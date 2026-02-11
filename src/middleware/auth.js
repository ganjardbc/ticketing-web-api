const { formatResponse } = require('../utils/response');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(formatResponse(false, null, 'Unauthorized'));
  }
  
  const token = authHeader.substring(7);
  if (!token.startsWith('mock-')) {
    return res.status(401).json(formatResponse(false, null, 'Invalid token'));
  }
  
  req.user = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User'
  };
  next();
}

module.exports = { authMiddleware };
