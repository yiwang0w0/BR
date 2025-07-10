const npcData = require('../config/npcinfo.json');
const { drawItem } = require('./map');

function initNpcs(count = 3, mapSize = 10, blocked = [], mapCount = 1) {
  const npcs = [];
  const maps = {};
  for (let m = 0; m < mapCount; m++) {
    maps[m] = [];
  }
  for (let i = 0; i < count; i++) {
    const base = npcData[i % npcData.length];
    let pos;
    let map = Math.floor(Math.random() * mapCount);
    // 保证出生点不在封锁区域
    do {
      pos = [
        Math.floor(Math.random() * mapSize),
        Math.floor(Math.random() * mapSize)
      ];
    } while (blocked.some(b => b[0] === pos[0] && b[1] === pos[1]));

    const npc = {
      id: i + 1,
      name: base.name,
      hp: base.hp,
      atk: base.atk,
      spd: base.spd || 5,
      pos,
      map,
      alive: true
    };
    npcs.push(npc);
    maps[map].push(npc);
  }
  return { npcs, maps };
}

function distance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function moveNpc(npc, targetPos, mapSize, blocked = []) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  // 简单追击：向距离最近的玩家移动一格
  let bestDir = null;
  let bestDist = Infinity;
  for (const d of dirs) {
    const nx = npc.pos[0] + d[0];
    const ny = npc.pos[1] + d[1];
    if (nx < 0 || ny < 0 || nx >= mapSize || ny >= mapSize) continue;
    if (blocked.some(b => b[0] === nx && b[1] === ny)) continue;
    const dist = distance([nx, ny], targetPos);
    if (dist < bestDist) {
      bestDist = dist;
      bestDir = d;
    }
  }
  if (bestDir) {
    npc.pos[0] += bestDir[0];
    npc.pos[1] += bestDir[1];
    return true;
  }
  return false;
}

function attack(npc, player, log) {
  const hit = Math.random() < 0.8; // 80% 命中率
  if (hit) {
    player.hp -= npc.atk;
  }
  log.push({
    time: Date.now(),
    type: 'npcAttack',
    npc: npc.id,
    target: player.id || player.uid,
    hit,
    dmg: hit ? npc.atk : 0
  });
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
    log.push({
      time: Date.now(),
      type: 'playerDead',
      target: player.id || player.uid
    });
  }
}

function act(game) {
  if (!game.mapNpcs) return;
  if (!game.log) game.log = [];
  for (const list of Object.values(game.mapNpcs)) {
    for (const npc of list) {
      if (!npc.alive) continue;

      // NPC 搜索当前地图道具
      const mapId = npc.map;
      const got = drawItem(game.map, mapId);
      if (got) {
        if (!npc.inventory) npc.inventory = [];
        npc.inventory.push(got);
        game.log.push({ time: Date.now(), type: 'npcGet', npc: npc.id, item: got.name });
      }
    }
  }
  // 清理死亡的 NPC 和玩家
  for (const list of Object.values(game.mapNpcs)) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].alive) list.splice(i, 1);
    }
  }
  game.npcs = Object.values(game.mapNpcs).flat();
  if (game.players) {
    for (const pid of Object.keys(game.players)) {
      const pl = game.players[pid];
      if (pl.hp !== undefined && pl.hp <= 0) {
        pl.alive = false;
      }
    }
  }
  game.turn = (game.turn || 0) + 1;
}

module.exports = { initNpcs, act, attack };
