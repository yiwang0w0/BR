const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const Room = require('../models/Room');
const npc = require('../utils/npc');
const { endGame } = require('../utils/scheduler');
const logger = require('../utils/logger');

router.use(auth);

router.get('/rooms', async (req, res) => {
  const rooms = await Room.findAll({
    attributes: [
      'groomid', 'gamenum', 'gametype', 'gamestate', 'validnum', 'alivenum', 'deathnum', 'groomtype', 'groomstatus', 'starttime'
    ],
    order: [['groomid', 'ASC']]
  });
  res.json({ code: 0, msg: 'ok', data: rooms });
});

router.get('/rooms/next', async (req, res) => {
  const room = await Room.findOne({
    where: { gamestate: { [Op.in]: [0, 1] } },
    order: [['starttime', 'DESC']]
  });
  if (!room) return res.json({ code: 1, msg: '暂无房间' });
  res.json({ code: 0, msg: 'ok', data: room });
});

router.post('/rooms/:id/join', async (req, res) => {
  const groomid = req.params.id;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  const now = Math.floor(Date.now() / 1000);
  if (room.gamestate === 0 && now < room.starttime) {
    return res.json({ code: 1, msg: '房间尚未开始' });
  }

  const User = require('../models/User');
  const user = await User.findByPk(req.user.uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (user.roomid > 0) {
    return res.json({ code: 1, msg: '已在房间中' });
  }
  await user.update({ roomid: groomid });
  await logger.logSave(user.uid, 's', `加入房间${groomid}`);
  await logger.addNews('join', user.username, groomid.toString());

  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.players) game.players = {};
  if (!game.players[user.uid]) {
    game.players[user.uid] = { hp: 20, atk: 5, pos: [0, 0] };
  }
  await room.update({ gamevars: JSON.stringify(game) });

  res.json({ code: 0, msg: '加入房间成功' });
});

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

router.get('/game/:groomid/npcs', async (req, res) => {
  const { groomid } = req.params;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  res.json({ code: 0, msg: 'ok', data: game.npcs || [] });
});

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
    await logger.logSave(uid, 'b', `移动到(${params.x},${params.y})`);
    npc.act(game);
    await room.update({ gamevars: JSON.stringify(game) });
    let gameover = null;
    if (game.players[uid].hp !== undefined && game.players[uid].hp <= 0) gameover = 'lose';
    if (game.npcs && game.npcs.length === 0) gameover = 'win';
    if (gameover) await endGame(room, gameover, req.user.username);
    return res.json({ code: 0, msg: 'ok', data: { game, gameover } });
  }

  if (type === 'attack') {
    const uid = req.user.uid;
    if (!game.players || !game.players[uid]) {
      return res.json({ code: 1, msg: '玩家不存在' });
    }
    const player = game.players[uid];
    const target = (game.npcs || []).find(n => n.id === params.npcId) ||
      (game.npcs || []).find(n => n.pos[0] === player.pos[0] && n.pos[1] === player.pos[1]);
    if (!target) return res.json({ code: 1, msg: '没有目标' });
    target.hp -= player.atk;
    if (!game.log) game.log = [];
    game.log.push({ time: Date.now(), uid, type: 'attack', npc: target.id });
    await logger.logSave(uid, 'b', `攻击NPC${target.id}`);
    if (target.hp <= 0) {
      game.npcs = game.npcs.filter(n => n.id !== target.id);
    }
    npc.act(game);
    await room.update({ gamevars: JSON.stringify(game) });

    let gameover = null;
    if (player.hp <= 0) gameover = 'lose';
    if (!game.npcs.length) gameover = 'win';

    if (gameover) await endGame(room, gameover, req.user.username);
    return res.json({ code: 0, msg: 'ok', data: { game, gameover } });
  }

  res.json({ code: 1, msg: '未知操作' });
});

module.exports = router;
