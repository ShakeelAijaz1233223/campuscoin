const { verifyAccessToken } = require('../utils/tokens');
const { UnauthorizedError } = require('../utils/errors');
const { getOne } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith('Bearer ');
    const token = bearer ? authHeader.slice(7) : require('../utils/session').readSession(req);
    if (!token) throw new UnauthorizedError('No token provided');
    // Cookie-authenticated writes require a non-simple header. Cross-origin
    // callers cannot send it unless explicitly allowed by our CORS policy.
    if (!bearer && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Requested-With') !== 'CampusCoin') {
      return res.status(403).json({ success: false, message: 'Invalid request origin' });
    }

    const decoded = verifyAccessToken(token);

    const user = await getOne(
      'SELECT id, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) throw new UnauthorizedError('User not found');
    if (user.status === 'suspended') throw new UnauthorizedError('Account suspended');
    if (user.status === 'pending') throw new UnauthorizedError('Account pending activation');
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