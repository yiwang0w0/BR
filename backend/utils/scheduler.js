const cron = require('node-cron');
const Room = require('../models/Room');
const config = require('../config/gameConfig');
const npc = require('./npc');

async function createRoom() {
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
  await Room.create({
    groomid,
    gamenum,
    gametype: 1,
    gamestate: 0,
    validnum: 10,
    alivenum: 10,
    deathnum: 0,
    groomtype: 1,
    groomstatus: 0,
    starttime: Math.floor(Date.now() / 1000),
    gamevars: JSON.stringify(gamevars)
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

module.exports = { scheduleRooms };
