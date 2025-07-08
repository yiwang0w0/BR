const Room = require('../models/Room');
const History = require('../models/History');
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
  setTimeout(() => createRoom(), 60 * 1000);
}

module.exports = { createRoom, startRoom, endGame };
