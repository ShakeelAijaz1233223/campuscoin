const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const PasswordResetModel = require('../models/passwordReset.model');
const AccountModel = require('../models/account.model');
const CategoryModel = require('../models/category.model');
const ActivityModel = require('../models/activity.model');
const {
  generateAccessToken,
  generateResetToken,
  hashToken
} = require('../utils/tokens');
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError
} = require('../utils/errors');
const db = require('../config/database');
const env = require('../config/env');

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8)
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters'
    });
  if (!/[A-Z]/.test(password || ''))
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter'
    });
  if (!/[a-z]/.test(password || ''))
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter'
    });
  if (!/[0-9]/.test(password || ''))
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number'
    });
  return errors;
};

const register = async ({
  email,
  password,
  first_name,
  last_name,
  academic_year,
  monthly_allowance = 0
}) => {
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0)
    throw new BadRequestError(
      'Password does not meet requirements',
      passwordErrors
    );

  const existing = await UserModel.findByEmail(email.toLowerCase().trim());
  if (existing)
    throw new ConflictError('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db
    .transaction(async (conn) => {
      const [userResult] = await conn.execute(
        'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)',
        [email.toLowerCase().trim(), passwordHash, 'student', 'active']
      );
      const userId = userResult.insertId;

      await conn.execute(
        'INSERT INTO profiles (user_id, first_name, last_name, academic_year, monthly_allowance) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          first_name,
          last_name || null,
          academic_year || 'freshman',
          monthly_allowance
        ]
      );

      // Seed default accounts for a quick start
      await conn.execute(
        'INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Cash Wallet', 'cash', 0, 1]
      );

      return userId;
    })
    .catch((error) => {
      // The unique email constraint is authoritative when submissions race.
      if (error.code === 'ER_DUP_ENTRY')
        throw new ConflictError('An account with this email already exists');
      throw error;
    });

  const user = await UserModel.findById(result);
  const token = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: 0
  });

  await ActivityModel.create(
    user.id,
    'registered',
    'user',
    user.id,
    'Account created'
  );

  return { user, token };
};

const login = async ({ email, password, ip }) => {
  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  if (!user) throw new UnauthorizedError('Invalid email or password');

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new UnauthorizedError(
      'Account temporarily locked due to multiple failed attempts. Try again later.'
    );
  }

  if (user.status === 'suspended')
    throw new UnauthorizedError('Account suspended. Contact an administrator.');
  if (user.status === 'inactive')
    throw new UnauthorizedError(
      'Account is inactive. Contact an administrator.'
    );
  if (user.status === 'pending')
    throw new UnauthorizedError('Account pending activation.');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await UserModel.incrementFailedAttempts(user.id);
    const refreshed = await UserModel.findByEmail(email.toLowerCase().trim());
    if (refreshed.failed_login_attempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await UserModel.lockAccount(user.id, lockUntil);
      throw new UnauthorizedError(
        'Too many failed attempts. Account locked for 30 minutes.'
      );
    }
    throw new UnauthorizedError('Invalid email or password');
  }

  await UserModel.updateLastLogin(user.id, ip || null);
  const fresh = await UserModel.findById(user.id);
  const token = generateAccessToken({
    id: fresh.id,
    email: fresh.email,
    role: fresh.role,
    sessionVersion: user.session_version
  });

  await ActivityModel.create(
    fresh.id,
    'login',
    'user',
    fresh.id,
    'User logged in',
    null,
    ip || null
  );

  return { user: fresh, token };
};

const getMe = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const profile = await ProfileModel.findByUserId(userId);
  return { ...user, profile };
};

const logout = async (userId) => {
  // Explicitly end all sessions, including previously issued Bearer tokens.
  await db.update(
    'UPDATE users SET session_version = session_version + 1 WHERE id = ?',
    [userId]
  );
  await ActivityModel.create(
    userId,
    'logout',
    'user',
    userId,
    'User logged out'
  );
  return true;
};

const forgotPassword = async (email) => {
  if (env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
    throw new (require('../utils/errors').AppError)(
      'Password reset email is not configured. Contact the administrator.',
      503
    );
  }
  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  // Always return success to avoid email enumeration
  if (!user) return { sent: true };

  const { resetToken, hashedToken } = generateResetToken();
  const expiresAt = new Date(Date.now() + env.RESET_TOKEN_EXPIRY);
  await PasswordResetModel.create(user.id, hashedToken, expiresAt);

  await require('./mail.service').sendPasswordReset(email, resetToken);
  // In production this token is emailed. For this deployment it is
  // returned only in non-production so the flow is testable end-to-end.
  return {
    sent: true,
    resetToken: env.NODE_ENV === 'production' ? undefined : resetToken
  };
};

const resetPassword = async ({ token, password }) => {
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0)
    throw new BadRequestError(
      'Password does not meet requirements',
      passwordErrors
    );

  const hashedToken = hashToken(token);
  const reset = await PasswordResetModel.findValidToken(hashedToken);
  if (!reset) throw new BadRequestError('Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.transaction(async (conn) => {
    // Serialize resets for this user, then re-check the token under the lock.
    await conn.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [
      reset.user_id
    ]);
    const [valid] = await conn.execute(
      'SELECT id FROM password_resets WHERE id = ? AND used = 0 AND expires_at > NOW() FOR UPDATE',
      [reset.id]
    );
    if (!valid.length)
      throw new BadRequestError('Invalid or expired reset token');
    await conn.execute(
      'UPDATE users SET password_hash = ?, session_version = session_version + 1, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [passwordHash, reset.user_id]
    );
    await conn.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [
      reset.id
    ]);
    // Invalidate all other outstanding tokens for this user
    await conn.execute(
      'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0',
      [reset.user_id]
    );
  });

  await ActivityModel.create(
    reset.user_id,
    'password_reset',
    'user',
    reset.user_id,
    'Password reset completed'
  );
  return true;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await db.getOne(
    'SELECT password_hash, session_version, email, role FROM users WHERE id = ?',
    [userId]
  );
  if (!user) throw new NotFoundError('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length > 0)
    throw new BadRequestError(
      'Password does not meet requirements',
      passwordErrors
    );

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.transaction(async (conn) => {
    // A stale concurrent password change must not supersede a newer password.
    const [result] = await conn.execute(
      'UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ? AND password_hash = ?',
      [passwordHash, userId, user.password_hash]
    );
    if (!result.affectedRows)
      throw new UnauthorizedError(
        'Password changed in another session. Sign in again.'
      );
    await conn.execute(
      'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0',
      [userId]
    );
  });
  await ActivityModel.create(
    userId,
    'password_change',
    'user',
    userId,
    'Password changed'
  );
  return generateAccessToken({
    id: userId,
    email: user.email,
    role: user.role,
    sessionVersion: user.session_version + 1
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  validatePassword
};
