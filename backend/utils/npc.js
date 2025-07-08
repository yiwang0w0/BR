const npcData = require('../config/npcinfo.json');

function initNpcs(count = 3, mapSize = 10, blocked = []) {
  const npcs = [];
  for (let i = 0; i < count; i++) {
    const base = npcData[i % npcData.length];
    let pos;
    // 保证出生点不在封锁区域
    do {
      pos = [
        Math.floor(Math.random() * mapSize),
        Math.floor(Math.random() * mapSize)
      ];
    } while (blocked.some(b => b[0] === pos[0] && b[1] === pos[1]));

    npcs.push({
      id: i + 1,
      name: base.name,
      hp: base.hp,
      atk: base.atk,
      spd: base.spd || 5,
      pos,
      alive: true
    });
  }
  return npcs;
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
  if (!game.npcs) return;
  const mapSize = game.mapSize || 10;
  const blocked = game.blocked || [];
  if (!game.log) game.log = [];
  for (const npc of game.npcs) {
    if (!npc.alive) continue;
    const players = Object.values(game.players || {}).filter(p => p.hp > 0);
    if (players.length === 0) break;
    // 寻找最近的玩家
    players.sort((a, b) => distance(npc.pos, a.pos) - distance(npc.pos, b.pos));
    const target = players[0];
    if (distance(npc.pos, target.pos) === 0) {
      attack(npc, target, game.log);
    } else {
      moveNpc(npc, target.pos, mapSize, blocked);
      game.log.push({ time: Date.now(), type: 'npcMove', npc: npc.id, pos: [...npc.pos] });
      // 移动后若与玩家同格则进行攻击
      if (distance(npc.pos, target.pos) === 0) {
        attack(npc, target, game.log);
      }
    }
  }
  // 清理死亡的 NPC 和玩家
  game.npcs = game.npcs.filter(n => n.alive);
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
