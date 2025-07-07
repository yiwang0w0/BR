const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../models/index');
const auth = require('../middlewares/auth');

// 建房间表模型
const { DataTypes } = require('sequelize');
const Room = sequelize.define('bra_game', {
  groomid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  gamenum: DataTypes.INTEGER.UNSIGNED,
  gametype: DataTypes.INTEGER.UNSIGNED,
  gamestate: DataTypes.INTEGER.UNSIGNED,
  validnum: DataTypes.INTEGER.UNSIGNED,
  alivenum: DataTypes.INTEGER.UNSIGNED,
  deathnum: DataTypes.INTEGER.UNSIGNED,
  groomtype: DataTypes.INTEGER.UNSIGNED,
  groomstatus: DataTypes.INTEGER.UNSIGNED,
  starttime: DataTypes.INTEGER.UNSIGNED,
  // 可补充其它字段
}, {
  tableName: 'bra_game',
  timestamps: false,
});

// 获取所有房间列表
router.get('/rooms', async (req, res) => {
  // 这里可以筛选"进行中的房间"、"公开房间"等
  const rooms = await Room.findAll({
    attributes: [
      'groomid', 'gamenum', 'gametype', 'gamestate', 'validnum', 'alivenum', 'deathnum', 'groomtype', 'groomstatus', 'starttime'
    ],
    order: [['groomid', 'ASC']]
  });
  res.json({ code: 0, msg: "ok", data: rooms });
});

// 创建房间
router.post('/rooms', async (req, res) => {
  const { gametype = 1, validnum = 10 } = req.body;
  const max = await Room.max('groomid');
  const groomid = (max || 0) + 1;
  const gamenum = 10000 + groomid;

  await Room.create({
    groomid,
    gamenum,
    gametype,
    gamestate: 0,
    validnum,
    alivenum: validnum,
    deathnum: 0,
    groomtype: 1,
    groomstatus: 0,
    starttime: Math.floor(Date.now() / 1000)
  });

  res.json({ code: 0, msg: '房间创建成功', data: { groomid } });
});

// 加入房间
router.post('/rooms/:id/join', auth, async (req, res) => {
  const groomid = req.params.id;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });

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
  res.json({ code: 0, msg: 'ok', data: room });
});

// 游戏操作示例
router.post('/game/:groomid/action', auth, async (req, res) => {
  const { groomid } = req.params;
  const { type, params } = req.body;
  // 这里只是示例，实际逻辑需根据游戏规则实现
  res.json({ code: 0, msg: '操作已接收', data: { groomid, type, params } });
});

module.exports = router;
