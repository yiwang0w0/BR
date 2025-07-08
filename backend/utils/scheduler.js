const cron = require('node-cron');
const Room = require('../models/Room');
const User = require('../models/User');
const History = require('../models/History');
const config = require('../config/gameConfig');
const npc = require('./npc');
const logger = require('./logger');
const { initMap } = require('./map');
// 可选：引入 WebSocket 广播能力
const { emitBattleResult } = require('./socket');

const TEAM_MODES = [11, 12, 13, 14];

// =====================
// 房间创建
// =====================
async function createRoom(gametype = 1) {
  const max = await Room.max('groomid');
  const groomid = (max || 0) + 1;
  const gamenum = 10000 + groomid;
  const mapSize = 10;
  const blocked = [];
  const gamevars = {
    players: {},
    map: initMap(),
    log: [],
    turn: 0,
    mapSize,
    blocked,
    npcs: npc.initNpcs(3, mapSize, blocked)
  };
  const starttime = Math.floor(Date.now() / 1000) + config.readyMin * 60;
  const room = await Room.create({
    groomid,
    gamenum,
    gametype,
    gamestate: 0,
    validnum: 10,
    alivenum: 10,
    deathnum: 0,
    groomtype: 1,
    groomstatus: 0,
    roomvars: JSON.stringify({}),
    starttime,
    gamevars: JSON.stringify(gamevars)
  });
  // 到点自动开房
  const delay = Math.max(starttime - Math.floor(Date.now() / 1000), 0) * 1000;
  setTimeout(() => startRoom(room.groomid), delay);
  logger.addNews('room', '', `新房间${groomid}已创建，编号${gamenum}`);
  return room;
}

// =====================
// 房间正式开始
// =====================
async function startRoom(groomid) {
  const room = await Room.findOne({ where: { groomid } });
  if (room && room.gamestate === 0) {
    await room.update({ gamestate: 1, groomstatus: 40 });
    logger.addNews('room', '', `房间${groomid}正式开始！`);
  }
}

// =====================
// 胜负判定（兼容多模式）
// =====================
function checkEndConditions(game, gametype) {
  const alivePlayers = Object.values(game.players || {}).filter(p => p.hp > 0);
  if (TEAM_MODES.includes(gametype)) {
    const teams = new Set(alivePlayers.map(p => p.team));
    if (alivePlayers.length === 0) return { result: 'lose' };
    if (teams.size === 1) return { result: 'win', winner: `Team${[...teams][0]}` };
    return null;
  }
  if (gametype === 2) {
    if (!game.npcs || game.npcs.length === 0) {
      return { result: 'win', winner: alivePlayers.map(p => p.username).join(',') };
    }
    if (alivePlayers.length === 0) return { result: 'lose' };
    return null;
  }
  // 个人乱斗
  if (alivePlayers.length === 1) return { result: 'win', winner: alivePlayers[0].username };
  if (alivePlayers.length === 0) return { result: 'lose' };
  return null;
}

// =====================
// 游戏结算与历史记录
// =====================
async function endGame(room, result, winner, game = null) {
  if (room.gamestate === 2) return; // already ended
  if (!game) {
    try { game = JSON.parse(room.gamevars || '{}'); } catch (e) { game = {}; }
  }
  await room.update({ gamestate: 2 });

  // --- 清理玩家房间号 ---
  const playerIds = Object.keys(game.players || {});
  await User.update({ roomid: 0 }, { where: { uid: playerIds } });

  // --- 详细结算/战报 ---
  const kills = Object.values(game.players || {}).map(p => p.kills || 0);
  const maxKill = Math.max(0, ...kills);
  const topPlayer = Object.values(game.players || {}).find(p => (p.kills || 0) === maxKill);

  const summary = {
    result,
    winner,
    kills: Object.fromEntries(Object.entries(game.players || {}).map(([pid, p]) => [pid, p.kills || 0])),
    // 可补充更多字段，如回合数、精彩事件
    // hnewsText: generateBattleSummary(game.log, game.players, game.npcs)
  };

  const gid = room.gamenum;
  await History.create({
    gid,
    wmode: result === 'win' ? 1 : 2,
    winner: winner || '',
    gametype: room.gametype,
    vnum: room.validnum,
    gtime: Math.floor(Date.now() / 1000),
    gstime: room.starttime,
    getime: Math.floor(Date.now() / 1000),
    winnernum: result === 'win' ? 1 : 0,
    winnerlist: winner || '',
    winnerpdata: topPlayer ? JSON.stringify(topPlayer) : '',
    validlist: playerIds.join(','),
    hnews: JSON.stringify(summary)
  });

  await logger.addNews('gameover', winner || '', result);

  // --- WebSocket 战报推送 ---
  if (typeof emitBattleResult === 'function') {
    emitBattleResult(room.groomid, { result, winner });
  }

  // --- 自动开新房间 ---
  setTimeout(() => createRoom(), 60 * 1000);
}

// =====================
// 自动定时建房
// =====================
function scheduleRooms() {
  if (!config.startMode) return;
  let pattern;
  if (config.startMode === 1) {
    // 每天定时
    pattern = `${config.startMin} ${config.startHour} * * *`;
  } else if (config.startMode === 2) {
    // 每隔N小时
    const hour = config.startHour > 0 ? config.startHour : 1;
    pattern = `0 */${hour} * * *`;
  } else if (config.startMode === 3) {
    // 每隔N分钟
    const minute = config.startMin > 0 ? config.startMin : 1;
    pattern = `*/${minute} * * * *`;
  } else {
    return;
  }
  cron.schedule(pattern, createRoom);
  logger.addNews('system', '', `已启动自动建房定时任务：${pattern}`);
}

module.exports = { createRoom, startRoom, endGame, scheduleRooms, checkEndConditions };
