const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const { createRoom } = require('../utils/scheduler');

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
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (game.players) {
    for (const p of Object.values(game.players)) {
      p.hp = 0;
      p.alive = false;
    }
  }
  if (Array.isArray(game.npcs)) {
    for (const n of game.npcs) {
      n.hp = 0;
      n.alive = false;
    }
  }
  await room.update({ gamestate: 99, groomstatus: 0, gamevars: JSON.stringify(game) });
  await User.update({ roomid: 0 }, { where: { roomid: id } });
  res.json({ code: 0, msg: '房间已结束' });
});

// ========================
// 地图与NPC管理
// ========================

// 获取房间的地图状态
router.get('/admin/rooms/:id/maps', async (req, res) => {
  const { id } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  res.json({
    code: 0,
    msg: 'ok',
    data: {
      map: game.map || {},
      mapNpcs: game.mapNpcs || {},
      mapProps: game.mapProps || {}
    }
  });
});

// 添加地图物品
router.post('/admin/rooms/:id/maps/:mapId/items', async (req, res) => {
  const { id, mapId } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.map) game.map = {};
  if (!game.map[mapId]) game.map[mapId] = [];
  const item = req.body || {};
  game.map[mapId].push(item);
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: game.map[mapId] });
});

// 更新地图物品
router.put('/admin/rooms/:id/maps/:mapId/items/:idx', async (req, res) => {
  const { id, mapId, idx } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.map || !game.map[mapId] || !game.map[mapId][idx]) {
    return res.json({ code: 1, msg: '物品不存在' });
  }
  game.map[mapId][idx] = Object.assign(game.map[mapId][idx], req.body || {});
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: game.map[mapId] });
});

// 删除地图物品
router.delete('/admin/rooms/:id/maps/:mapId/items/:idx', async (req, res) => {
  const { id, mapId, idx } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.map || !game.map[mapId] || !game.map[mapId][idx]) {
    return res.json({ code: 1, msg: '物品不存在' });
  }
  game.map[mapId].splice(idx, 1);
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: game.map[mapId] });
});

// 添加NPC
router.post('/admin/rooms/:id/maps/:mapId/npcs', async (req, res) => {
  const { id, mapId } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.mapNpcs) game.mapNpcs = {};
  if (!game.mapNpcs[mapId]) game.mapNpcs[mapId] = [];
  const npc = req.body || {};
  const all = Object.values(game.mapNpcs).flat();
  const maxId = all.reduce((m, n) => Math.max(m, n.id || 0), 0);
  npc.id = maxId + 1;
  npc.map = parseInt(mapId, 10);
  game.mapNpcs[mapId].push(npc);
  game.npcs = Object.values(game.mapNpcs).flat();
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: game.mapNpcs[mapId] });
});

// 更新NPC
router.put('/admin/rooms/:id/maps/:mapId/npcs/:nid', async (req, res) => {
  const { id, mapId, nid } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.mapNpcs || !game.mapNpcs[mapId]) {
    return res.json({ code: 1, msg: 'NPC不存在' });
  }
  const npc = game.mapNpcs[mapId].find(n => String(n.id) === String(nid));
  if (!npc) return res.json({ code: 1, msg: 'NPC不存在' });
  Object.assign(npc, req.body || {});
  game.npcs = Object.values(game.mapNpcs).flat();
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: npc });
});

// 删除NPC
router.delete('/admin/rooms/:id/maps/:mapId/npcs/:nid', async (req, res) => {
  const { id, mapId, nid } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.mapNpcs || !game.mapNpcs[mapId]) {
    return res.json({ code: 1, msg: 'NPC不存在' });
  }
  const idx = game.mapNpcs[mapId].findIndex(n => String(n.id) === String(nid));
  if (idx === -1) return res.json({ code: 1, msg: 'NPC不存在' });
  game.mapNpcs[mapId].splice(idx, 1);
  game.npcs = Object.values(game.mapNpcs).flat();
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: game.mapNpcs[mapId] });
});

// 更新地图属性(禁区、天气)
router.put('/admin/rooms/:id/maps/:mapId/settings', async (req, res) => {
  const { id, mapId } = req.params;
  const room = await Room.findOne({ where: { groomid: id } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.mapProps) game.mapProps = {};
  if (!game.mapProps[mapId]) game.mapProps[mapId] = { blocked: [], weather: '' };
  const props = game.mapProps[mapId];
  if (Array.isArray(req.body.blocked)) props.blocked = req.body.blocked;
  if (typeof req.body.weather === 'string') props.weather = req.body.weather;
  await room.update({ gamevars: JSON.stringify(game) });
  res.json({ code: 0, msg: 'ok', data: props });
});

module.exports = router;

