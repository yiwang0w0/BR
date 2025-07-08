const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const { createRoom, endGame } = require('../utils/scheduler');

// auth + admin check middleware
router.use(auth);
router.use(async (req, res, next) => {
  const user = await User.findByPk(req.user.uid);
  if (!user || user.groupid <= 1) {
    return res.status(403).json({ code: 1, msg: '权限不足' });
  }
  req.admin = user;
  next();
});

router.post('/admin/rooms/start', async (req, res) => {
  try {
    const room = await createRoom();
    res.json({ code: 0, msg: '房间创建成功', data: room });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 1, msg: '创建失败' });
  }
});

router.post('/admin/rooms/:id/end', async (req, res) => {
  const { id } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  try {
    await endGame(room, 'abort');
    await room.update({ groomstatus: 0 });
    res.json({ code: 0, msg: '房间已结束' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 1, msg: '结束失败' });
  }
});

module.exports = router;
