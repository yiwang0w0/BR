const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const Room = require('../models/Room');

// 全局 JWT 验证中间件
router.use(auth);

// 获取所有房间列表
router.get('/rooms', async (req, res) => {
  const rooms = await Room.findAll({
    attributes: [
      'groomid', 'gamenum', 'gametype', 'gamestate', 'validnum', 'alivenum', 'deathnum', 'groomtype', 'groomstatus', 'starttime'
    ],
    order: [['groomid', 'ASC']]
  });
  res.json({ code: 0, msg: "ok", data: rooms });
});

// 下一局信息
router.get('/rooms/next', async (req, res) => {
  const room = await Room.findOne({
    where: { gamestate: { [Op.in]: [0, 1] } },
    order: [['starttime', 'DESC']]
  });
  if (!room) return res.json({ code: 1, msg: '暂无房间' });
  res.json({ code: 0, msg: 'ok', data: room });
});

// 加入房间
router.post('/rooms/:id/join', async (req, res) => {
  const groomid = req.params.id;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  const now = Math.floor(Date.now() / 1000);
  if (now < room.starttime) {
    return res.json({ code: 1, msg: '房间尚未开始' });
  }

  const User = require('../models/User');
  const user = await User.findByPk(req.user.uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (user.roomid > 0) {
    return res.json({ code: 1, msg: '已在房间中' });
  }
  await user.update({ roomid: groomid });
  res.json({ code: 0, msg: '加入房间成功' });
});

// 获取房间详情
router.get('/game/:groomid', async (req, res) => {
  const { groomid } = req.params;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  const data = room.toJSON();
  try {
    data.gamevars = JSON.parse(data.gamevars || '{}');
  } catch (e) {
    data.gamevars = {};
  }
  res.json({ code: 0, msg: 'ok', data });
});

// 游戏操作示例
router.post('/game/:groomid/action', async (req, res) => {
  const { groomid } = req.params;
  const { type, params } = req.body;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });

  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}

  if (type === 'move') {
    const uid = req.user.uid;
    if (!game.players) game.players = {};
    if (!game.players[uid]) game.players[uid] = {};
    game.players[uid].pos = [params.x, params.y];
    if (!game.log) game.log = [];
    game.log.push({ time: Date.now(), uid, type: 'move', pos: [params.x, params.y] });
    await room.update({ gamevars: JSON.stringify(game) });
    return res.json({ code: 0, msg: 'ok', data: game });
  }

  res.json({ code: 1, msg: '未知操作' });
});

module.exports = router;
