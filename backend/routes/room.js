const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const Room = require('../models/Room');
const User = require('../models/User');
const npc = require('../utils/npc');
const events = require('../utils/events');
const logger = require('../utils/logger');
const { checkGameOverAndEnd } = require('../utils/gameover');

// 所有接口必须登录
router.use(auth);

/**
 * 获取房间列表
 */
router.get('/rooms', async (req, res) => {
  const rooms = await Room.findAll({
    attributes: [
      'groomid', 'gamenum', 'gametype', 'gamestate', 'validnum', 'alivenum', 'deathnum', 'groomtype', 'groomstatus', 'starttime'
    ],
    order: [['groomid', 'ASC']]
  });
  res.json({ code: 0, msg: 'ok', data: rooms });
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

/**
 * 加入房间
 */
router.post('/rooms/:id/join', async (req, res) => {
  const groomid = req.params.id;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });
  const now = Math.floor(Date.now() / 1000);
  if (room.gamestate === 0 && now < room.starttime) {
    return res.json({ code: 1, msg: '房间尚未开始' });
  }

  const user = await User.findByPk(req.user.uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  if (user.roomid > 0) return res.json({ code: 1, msg: '已在房间中' });

  await user.update({ roomid: groomid });
  await logger.logSave(user.uid, 'system', `加入房间${groomid}`);

  // 初始化玩家数据（原DTS风格）
  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.players) game.players = {};
  if (!game.players[user.uid]) {
    const team = req.body.team || 1;
    game.players[user.uid] = {
      hp: 20, atk: 5, def: 3, pos: [0, 0], team, username: user.username,
      inventory: [], // 背包，按原版格式扩展
      status: {},    // 状态效果
      kills: 0,
    };
  }
  await room.update({ gamevars: JSON.stringify(game) });

  res.json({ code: 0, msg: '加入房间成功' });
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
 * 游戏主操作（完全复刻DTS风格，支持移动/攻击/道具/休息等，并内嵌事件判定与NPC AI）
 */
router.post('/game/:groomid/action', async (req, res) => {
  const { groomid } = req.params;
  const { type, params } = req.body;
  const uid = req.user.uid;
  const room = await Room.findOne({ where: { groomid } });
  if (!room) return res.json({ code: 1, msg: '房间不存在' });

  let game = {};
  try { game = JSON.parse(room.gamevars || '{}'); } catch (e) {}
  if (!game.players) game.players = {};

  if (!game.log) game.log = [];

  // --- 玩家主动行动阶段 ---
  if (type === 'move') {
    // 按原版流程，先处理玩家行动
    const player = game.players[uid];
    if (!player) return res.json({ code: 1, msg: '玩家不存在' });
    player.pos = [params.x, params.y];

    // 触发地图事件/陷阱/道具等
    const moveEvents = events.onPlayerMove(player, game, room); // 你需要实现详细原版风格的事件判定与日志
    game.log.push(...moveEvents);

    // 玩家状态副作用结算（如中毒/回血等）
    events.resolveStatus(player, game, room, game.log);

    // 日志记录
    game.log.push({ time: Date.now(), uid, type: 'move', pos: player.pos, msg: `${player.username}移动到(${player.pos[0]},${player.pos[1]})` });
    await logger.logSave(uid, 'move', `移动到(${player.pos[0]},${player.pos[1]})`);
  }

  if (type === 'attack') {
    // 攻击流程（支持对NPC/玩家，原DTS风格）
    const player = game.players[uid];
    if (!player) return res.json({ code: 1, msg: '玩家不存在' });
    const targetId = params.npcId || params.playerId;
    let attackEvents = [];
    if (targetId && game.npcs && game.npcs.length > 0) {
      // 攻击NPC
      const npcTarget = game.npcs.find(n => n.id === targetId);
      if (!npcTarget) return res.json({ code: 1, msg: '目标不存在' });
      attackEvents = events.onPlayerAttackNpc(player, npcTarget, game, room);
    } else if (params.playerId && game.players[params.playerId]) {
      // 攻击玩家
      const pTarget = game.players[params.playerId];
      attackEvents = events.onPlayerAttackPlayer(player, pTarget, game, room);
    }
    game.log.push(...attackEvents);

    // 玩家副作用（如反击/异常等）
    events.resolveStatus(player, game, room, game.log);
  }

  // 你可以拓展支持更多指令，如 use_item, rest, 合成等
  // ...

  // --- NPC回合，严格复刻原版DTS的AI链和事件处理 ---
  let npcLogs = [];
  if (game.npcs && game.npcs.length > 0) {
    for (const npcObj of game.npcs) {
      const logs = npc.act(npcObj, game, room); // 必须实现原DTS每个npc的完整行动、判定、副作用链
      npcLogs.push(...logs);
    }
  }
  game.log.push(...npcLogs);

  // --- 回合结束：依次判定所有事件链/胜负结算 ---
  const endLog = [];
  const result = checkGameOverAndEnd(game, room, endLog); // 请实现和原版一致的多次判定&胜负结算逻辑
  if (endLog.length) game.log.push(...endLog);

  await room.update({ gamevars: JSON.stringify(game) });

  // 返回：全部详细日志、最新状态、是否gameover
  res.json({
    code: 0,
    msg: 'ok',
    data: {
      game,
      logs: game.log.slice(-30), // 返回最近30条
      gameover: result ? result : null
    }
  });
});

module.exports = router;
