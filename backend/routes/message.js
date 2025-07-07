const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// 全局 JWT 验证中间件
router.use(auth);

// 发送消息
router.post('/messages', async (req, res) => {
  const { receiver, title, content } = req.body;
  if (!receiver || !title || !content) {
    return res.json({ code: 1, msg: '缺少参数' });
  }
  const user = await User.findOne({ where: { username: receiver } });
  if (!user) return res.json({ code: 1, msg: '接收者不存在' });

  await Message.create({
    timestamp: Math.floor(Date.now() / 1000),
    receiver,
    sender: req.user.username,
    title,
    content,
    enclosure: ''
  });
  res.json({ code: 0, msg: '发送成功' });
});

// 获取收件箱
router.get('/messages/inbox', async (req, res) => {
  const msgs = await Message.findAll({
    where: { receiver: req.user.username },
    order: [['mid', 'DESC']]
  });
  res.json({ code: 0, msg: 'ok', data: msgs });
});

// 获取发件箱
router.get('/messages/outbox', async (req, res) => {
  const msgs = await Message.findAll({
    where: { sender: req.user.username },
    order: [['mid', 'DESC']]
  });
  res.json({ code: 0, msg: 'ok', data: msgs });
});

module.exports = router;
