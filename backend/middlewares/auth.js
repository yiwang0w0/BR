const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, msg: '未认证' });
  }
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ code: 1, msg: 'token无效' });
  }
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = authMiddleware;
module.exports.verifyToken = verifyToken;
