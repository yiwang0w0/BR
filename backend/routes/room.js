const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../models/index');

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

module.exports = router;
