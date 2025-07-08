const cron = require('node-cron');
const Room = require('../models/Room');
const History = require('../models/History');
const config = require('../config/gameConfig');
const npc = require('./npc');
const logger = require('./logger');

async function createRoom() {
  const max = await Room.max('groomid');
  const groomid = (max || 0) + 1;
  const gamenum = 10000 + groomid;
  const mapSize = 10;
  const blocked = [];
  const gamevars = {
    players: {},
    map: [],
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
    gametype: 1,
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
  setTimeout(() => startRoom(room.groomid), config.readyMin * 60 * 1000);
  return room;
}

async function startRoom(groomid) {
  const room = await Room.findOne({ where: { groomid } });
  if (room && room.gamestate === 0) {
    await room.update({ gamestate: 1, groomstatus: 40 });
  }
}

async function endGame(room, result, winner) {
  if (room.gamestate === 2) return; // already ended
  await room.update({ gamestate: 2 });
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
    winnerpdata: '',
    validlist: '',
    hnews: JSON.stringify(room.gamevars || '')
  });
  await logger.addNews('gameover', winner || '', result);
  setTimeout(() => createRoom(), 60 * 1000);
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

module.exports = { createRoom, startRoom, endGame, scheduleRooms };
