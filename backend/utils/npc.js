const npcData = require('../config/npcinfo.json');

function initNpcs(count = 3, mapSize = 10) {
  const npcs = [];
  for (let i = 0; i < count; i++) {
    const base = npcData[i % npcData.length];
    npcs.push({
      id: i + 1,
      name: base.name,
      hp: base.hp,
      atk: base.atk,
      pos: [
        Math.floor(Math.random() * mapSize),
        Math.floor(Math.random() * mapSize)
      ]
    });
  }
  return npcs;
}

function act(game) {
  if (!game.npcs) return;
  for (const npc of game.npcs) {
    const dir = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ][Math.floor(Math.random() * 4)];
    npc.pos[0] += dir[0];
    npc.pos[1] += dir[1];

    if (game.players) {
      for (const pid in game.players) {
        const p = game.players[pid];
        if (p.hp > 0 && p.pos && p.pos[0] === npc.pos[0] && p.pos[1] === npc.pos[1]) {
          p.hp -= npc.atk;
          if (!game.log) game.log = [];
          game.log.push({ time: Date.now(), uid: Number(pid), type: 'hurt', dmg: npc.atk });
        }
      }
    }
  }
  game.turn = (game.turn || 0) + 1;
}

module.exports = { initNpcs, act };
