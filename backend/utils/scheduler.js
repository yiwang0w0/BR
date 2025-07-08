const cron = require('node-cron');
const Room = require('../models/Room');
const History = require('../models/History');
const config = require('../config/gameConfig');
const npc = require('./npc');

const TEAM_MODES = [11, 12, 13, 14];

async function createRoom(gametype = 1) {
  const max = await Room.max('groomid');
  const groomid = (max || 0) + 1;
  const gamenum = 10000 + groomid;
  const gamevars = {
    players: {},
    map: [],
    log: [],
    turn: 0,
    npcs: npc.initNpcs()
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
  const delay = Math.max(starttime - Math.floor(Date.now() / 1000), 0) * 1000;
  setTimeout(() => startRoom(room.groomid), delay);
  return room;
}

async function startRoom(groomid) {
  const room = await Room.findOne({ where: { groomid } });
  if (room && room.gamestate === 0) {
    await room.update({ gamestate: 1, groomstatus: 40 });
  }
}

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
  // default personal battle
  if (alivePlayers.length === 1) return { result: 'win', winner: alivePlayers[0].username };
  if (alivePlayers.length === 0) return { result: 'lose' };
  return null;
}

async function endGame(room, result, winner, game = null) {
  if (room.gamestate === 2) return; // already ended
  if (!game) {
    try { game = JSON.parse(room.gamevars || '{}'); } catch (e) { game = {}; }
  }
  await room.update({ gamestate: 2 });

  const kills = Object.values(game.players || {}).map(p => p.kills || 0);
  const maxKill = Math.max(0, ...kills);
  const topPlayer = Object.values(game.players || {}).find(p => (p.kills || 0) === maxKill);

  const summary = {
    result,
    winner,
    kills: Object.fromEntries(Object.entries(game.players || {}).map(([pid, p]) => [pid, p.kills || 0]))
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
    validlist: Object.keys(game.players || {}).join(','),
    hnews: JSON.stringify(summary)
  });
}

function scheduleRooms() {
  if (!config.startMode) return;
  let pattern;
  if (config.startMode === 1) {
    pattern = `${config.startMin} ${config.startHour} * * *`;
  } else if (config.startMode === 2) {
    const hour = config.startHour > 0 ? config.startHour : 1;
    pattern = `0 */${hour} * * *`;
  } else if (config.startMode === 3) {
    const minute = config.startMin > 0 ? config.startMin : 1;
    pattern = `*/${minute} * * * *`;
  } else {
    return;
  }
  cron.schedule(pattern, createRoom);
}

module.exports = { createRoom, startRoom, endGame, scheduleRooms, checkEndConditions };
