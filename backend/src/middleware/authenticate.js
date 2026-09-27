const { verifyAccessToken } = require('../utils/tokens');
const { UnauthorizedError } = require('../utils/errors');
const { getOne } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await getOne(
      'SELECT id, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) throw new UnauthorizedError('User not found');
    if (user.status === 'suspended') throw new UnauthorizedError('Account suspended');
    if (user.status === 'inactive') throw new UnauthorizedError('Account inactive');

    req.user = { id: user.id, email: user.email, role: user.role, status: user.status };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return next(new UnauthorizedError('Invalid token'));
    if (err.name === 'TokenExpiredError') return next(new UnauthorizedError('Token expired'));
    next(err);
  }
};

module.exports = authenticate;