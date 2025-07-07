const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, msg: '未认证' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ code: 1, msg: 'token无效' });
  }
};

  }
;
