const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const Room = require('../models/Room');
const User = require('../models/User');
const npc = require('../utils/npc');
const events = require('../utils/events');
const logger = require('../utils/logger');
const mapUtil = require('../utils/map');
const { checkGameOverAndEnd } = require('../utils/gameover');
const { emitRoomUpdate, emitBattleResult, sendRoomMessage } = require('../utils/socket'); // WebSocket 工具
const { drawItem } = require('../utils/map');
const { createRoom } = require('../utils/scheduler');

router.use(auth);

/**
 * 获取房间列表
 */
router.get('/rooms', async (req, res) => {
  const rooms = await Room.findAll({
    attributes: [
      'groomid', 'gamenum', 'gametype', 'gamestate', 'validnum', 'alivenum', 'deathnum', 'groomtype', 'groomstatus', 'starttime'
    ],
    where: { gamestate: { [Op.notIn]: [2, 99] } },
    order: [['groomid', 'ASC']]
  });
  res.json({ code: 0, msg: 'ok', data: rooms });
});

/**
 * 获取地图基本信息（id 与名称）
 */
router.get('/maps', async (req, res) => {
  const mapInfo = require('../data/mapinfo.json');
  res.json({ code: 0, msg: 'ok', data: mapInfo });
});

/**
 * 获取最近的可加入房间
 */
router.get('/rooms/next', async (req, res) => {
  const room = await Room.findOne({
    where: { gamestate: { [Op.in]: [0, 1] } },
    order: [['starttime', 'DESC']]
  });
  if (!room) return res.json({ code: 1, msg: '暂无房间' });
  res.json({ code: 0, msg: 'ok', data: room });
});

// 创建房间（供自动建房或无房间时使用）
router.post('/rooms', async (req, res) => {
  try {
    const room = await createRoom(req.body.gametype || 1);
    res.json({ code: 0, msg: '房间创建成功', data: room });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 1, msg: '创建失败' });
  }
});

/**
 * 加入房间
 */
router.post('/rooms/:id/join', async (req, res) => {
  const groomid = req.params.id;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  if (room.gamestate >= 2 || room.gamestate === 99) {
    return res.json({ code: 1, msg: '房间已结束' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (room.gamestate === 0 && now < room.starttime) {
    return res.json({ code: 1, msg: '房间尚未开始' });
  }

  const user = await User.findByPk(req.user.uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (user.roomid > 0) {
    if (parseInt(user.roomid) !== parseInt(groomid)) {
      return res.json({ code: 1, msg: '已在房间中' });
    }
    let curGame = {};
    try { curGame = JSON.parse(room.gamevars || '{}'); } catch (e) {}
    if (curGame.players && curGame.players[user.uid]) {
      return res.json({ code: 1, msg: '已在房间中' });
    }
  }

  await user.update({ roomid: groomid });
  await logger.logSave(user.uid, 'system', `加入房间${groomid}`);

  // 初始化玩家数据
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.players) game.players = {};
  if (!game.players[user.uid]) {
    const team = (req.body && req.body.team) || 1;
    game.players[user.uid] = {
      hp: 20,
      atk: 5,
      def: 3,
      spd: 10,
      pos: [0, 0],
      map: 0,
      team,
      username: user.username,
      inventory: [],
      status: {},
      kills: 0,
    };
  }
  await room.update({ gamevars: JSON.stringify(game) });
  await room.reload();

  // WebSocket: 房间内广播玩家加入
  emitRoomUpdate(groomid, { game });
  sendRoomMessage(groomid, { type: 'player_join', payload: { uid: user.uid, username: user.username } });

  // 再次写入用户房间号，确保数据库保持最新状态
  await user.update({ roomid: groomid });

  res.json({ code: 0, msg: '加入房间成功', data: { player: game.players[user.uid] } });
});

/**
 * 获取房间完整状态
 */
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

/**
 * 配置玩家信息（昵称、性别等）
 */
router.post('/game/:groomid/config', async (req, res) => {
  const { groomid } = req.params;
  const { nickname, gender } = req.body || {};
  const uid = req.user.uid;

  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });

  const user = await User.findByPk(uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (parseInt(user.roomid) !== parseInt(groomid)) {
    return res.json({ code: 1, msg: '未在当前房间' });
  }

  await user.update({
    username: nickname ?? user.username,
    gender: gender ?? user.gender,
    roomid: groomid,
    configured: 1
  });

  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.players) game.players = {};
  if (game.players[uid]) {
    if (nickname) game.players[uid].username = nickname;
    if (gender) game.players[uid].gender = gender;
  }

  await room.update({ gamevars: JSON.stringify(game) });

  emitRoomUpdate(groomid, { game });

  // 重新写入房间号，确保数据库记录与房间一致
  await user.update({ roomid: groomid });

  res.json({ code: 0, msg: '配置成功' });
});

/**
 * 游戏主操作
 */
router.post('/game/:groomid/action', async (req, res) => {
  const { groomid } = req.params;
  const { type, params } = req.body;
  const uid = req.user.uid;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });

  const user = await User.findByPk(uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (user.configured !== 1) {
    return res.status(401).json({ code: 1, msg: '配置未完成' });
  }
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}

  if (parseInt(user.roomid) !== parseInt(groomid)) {
    if (game.players && game.players[uid]) {
      await user.update({ roomid: groomid });
    } else {
      return res.json({ code: 1, msg: '未在当前房间' });
    }
  }

  const supported = ['move', 'attack', 'search', 'itemDecision'];
  if (!supported.includes(type)) {
    return res.json({ code: 1, msg: '该操作暂未实现' });
  }

  if (!game.players) game.players = {};
  if (!game.log) game.log = [];

  if (!game.players[uid]) {
    const fresh = await Room.findOne({ where: { groomid } });
    try { game = JSON.parse(fresh.gamevars || '{}'); } catch (e) {}
    if (!game.players || !game.players[uid]) {
      return res.json({ code: 1, msg: '未加入房间' });
    }
  }

  // 玩家主动行动阶段
  if (type === 'move') {
    const player = game.players[uid];
    if (!player) return res.json({ code: 1, msg: '未加入房间' });
    player.pos = [params.x, params.y];
    const mapId = params.map !== undefined ? params.map : player.map;
    if (mapId !== undefined) player.map = mapId;

    // 触发地图事件等
    const moveEvents = events.onPlayerMove(player, game, room) || [];
    game.log.push(...moveEvents);

    events.resolveStatus(player, game, room, game.log);

    game.log.push({ time: Date.now(), uid, type: 'move', pos: player.pos, msg: `${player.username}移动到(${player.pos[0]},${player.pos[1]})` });
    await logger.logSave(uid, 'move', `移动到(${player.pos[0]},${player.pos[1]})`);
  }

    if (type === 'search') {
      const player = game.players[uid];
    if (!player) return res.json({ code: 1, msg: '未加入房间' });
      const mapId = player.map !== undefined ? player.map : (player.pos ? player.pos[0] : 0);
      let result = { type: 'none' };
      const meetRate = 20 + (mapUtil.meetmanMods[mapId] || 0);
      if (Math.random() * 100 < meetRate) {
        const candidates = (game.npcs || []).filter(n => n.map === mapId);
        if (candidates.length) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const playerFirst = (player.spd || 0) >= (target.spd || 0);
          if (!playerFirst) {
            npc.attack(target, player, game.log);
          }
          player.pendingNpc = target.id;
          result = { type: 'npc', npc: { id: target.id, name: target.name, hp: target.hp, atk: target.atk, spd: target.spd }, playerFirst };
          game.log.push({ time: Date.now(), uid, type: 'encounter', msg: `${player.username}遭遇了${target.name}` });
        }
      }
      if (result.type === 'none') {
        const itemRate = 60 + (mapUtil.itemfindMods[mapId] || 0);
        if (Math.random() * 100 < itemRate) {
          const item = mapUtil.drawItem(game.map, mapId);
          if (item) {
            player.pendingItem = { item, mapId };
            result = { type: 'item', item };
            game.log.push({ time: Date.now(), uid, type: 'itemfound', msg: `${player.username}发现了${item.name}` });
          }
        }
      }
      if (result.type === 'none') {
        game.log.push({ time: Date.now(), uid, type: 'search', msg: `${player.username}搜索了一番，但什么也没发现` });
      }
      req.searchResult = result;
    }

    if (type === 'itemDecision') {
      const player = game.players[uid];
      if (!player || !player.pendingItem) return res.json({ code: 1, msg: '没有待处理物品' });
      const { decision, replaceIndex } = params || {};
      const { item, mapId } = player.pendingItem;
      delete player.pendingItem;
      if (decision === 'take') {
        if (!player.inventory) player.inventory = [];
        if (player.inventory.length >= 6) {
          if (replaceIndex === undefined || replaceIndex < 0 || replaceIndex >= player.inventory.length) {
            player.pendingItem = { item, mapId };
            return res.json({ code: 1, msg: 'bagFull', data: { inventory: player.inventory } });
          }
          const dropped = player.inventory.splice(replaceIndex, 1)[0];
          if (dropped) {
            game.map[mapId].push(dropped);
          }
        }
        player.inventory.push(item);
        game.log.push({ time: Date.now(), uid, type: 'itemget', msg: `${player.username}获得了${item.name}` });
      } else {
        game.map[mapId].push(item);
        game.log.push({ time: Date.now(), uid, type: 'itemdrop', msg: `${player.username}丢弃了${item.name}` });
      }
      req.searchResult = { type: 'itemDecision', result: decision };
    }

  if (type === 'attack') {
    const player = game.players[uid];
    if (!player) return res.json({ code: 1, msg: '未加入房间' });
    const targetId = params.npcId || params.playerId;
    let attackEvents = [];
    if (targetId && game.npcs && game.npcs.length > 0) {
      const npcTarget = game.npcs.find(n => n.id === targetId);
      if (!npcTarget) return res.json({ code: 1, msg: '目标不存在' });
      attackEvents = events.onPlayerAttackNpc(player, npcTarget, game, room) || [];
    } else if (params.playerId && game.players[params.playerId]) {
      const pTarget = game.players[params.playerId];
      attackEvents = events.onPlayerAttackPlayer(player, pTarget, game, room) || [];
    }
    game.log.push(...attackEvents);

    events.resolveStatus(player, game, room, game.log);
  }

  // 可拓展 use_item, rest, 合成等...

  // NPC回合，npc.act 会一次性处理全部 NPC 行为并写入日志
  if (game.npcs && game.npcs.length > 0) {
    npc.act(game);
  }

  // 判胜负
  const endLog = [];
  const result = checkGameOverAndEnd(game, room, endLog);
  if (endLog.length) game.log.push(...endLog);

  await room.update({ gamevars: JSON.stringify(game) });

  // WebSocket 推送游戏状态变化和战报
  emitRoomUpdate(groomid, { game });
  if (result && emitBattleResult) emitBattleResult(groomid, { result });

  // 返回API
  res.json({
    code: 0,
    msg: 'ok',
    data: {
      game,
      logs: game.log.slice(-30),
      gameover: result ? result : null,
      searchResult: req.searchResult || null
    }
  });
});

module.exports = router;
