const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized: token is missing', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (_error) {
    return sendError(res, 'Unauthorized: invalid or expired token', 401);
  }
}

module.exports = authMiddleware;
