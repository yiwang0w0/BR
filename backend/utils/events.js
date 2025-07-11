// backend/utils/events.js

// 部分事件逻辑由老版 DTS PHP 模块移植而来
// 合成配方示例，仅用于演示
const COMBINE_RECIPES = {
  '草药+清水': { name: '治疗药水', hp: 20 },
  '草药+草药': { name: '浓缩药水', hp: 40 },
};

function combineItems(player, items, log = []) {
  if (!player.inventory) return false;
  const names = items.map(i => i.name).sort();
  const key = names.join('+');
  const recipe = COMBINE_RECIPES[key];
  if (!recipe) return false;

  // 移除素材
  for (const it of items) {
    const idx = player.inventory.indexOf(it);
    if (idx >= 0) player.inventory.splice(idx, 1);
  }
  // 生成新道具
  player.inventory.push({ name: recipe.name, heal: recipe.hp });
  log.push({
    time: Date.now(),
    type: 'itemmix',
    uid: player.uid,
    msg: `${player.username}合成了${recipe.name}`,
  });
  return true;
}

function restPlayer(player, mode = 'sleep', log = []) {
  player.maxHp = player.maxHp || 20;
  player.maxSp = player.maxSp || 10;
  const now = Date.now();
  if (mode === 'sleep') {
    const spUp = Math.ceil(player.maxSp * 0.1);
    player.sp = Math.min((player.sp || player.maxSp) + spUp, player.maxSp);
    log.push({ time: now, type: 'rest', uid: player.uid, mode, msg: `${player.username}睡眠恢复了${spUp}点体力` });
  } else if (mode === 'heal') {
    const hpUp = Math.ceil(player.maxHp * 0.05);
    player.hp = Math.min(player.hp + hpUp, player.maxHp);
    log.push({ time: now, type: 'rest', uid: player.uid, mode, msg: `${player.username}治疗恢复了${hpUp}点生命` });
  }
}

function distance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function onPlayerMove(player, game, room, oldPos = null, oldMap = null) {
  const logs = [];
  if (!game.npcs) return logs;
  const prevPos = oldPos || player.pos;
  const prevMap = oldMap !== null ? oldMap : player.map;
  for (const n of game.npcs) {
    if (!n.alive) continue;
    if (n.map !== prevMap) continue;
    if (distance(n.pos, prevPos) === 0 || distance(n.pos, player.pos) <= 1) {
      player.hp -= n.atk;
      logs.push({
        time: Date.now(),
        type: 'hurt',
        uid: player.uid,
        npc: n.id,
        dmg: n.atk,
        msg: `${n.name}攻击${player.username}造成${n.atk}点伤害`
      });
      if (player.hp <= 0) {
        player.hp = 0;
        player.alive = false;
        logs.push({ time: Date.now(), type: 'playerDead', uid: player.uid });
        break;
      }
    }
  }
  return logs;
}

function onPlayerAttackNpc(player, npc, game, room) {
  const logs = [];
  if (!npc.alive) return logs;
  const dmg = Math.max(1, player.atk);
  npc.hp -= dmg;
  logs.push({
    time: Date.now(),
    type: 'attackNpc',
    uid: player.uid,
    npc: npc.id,
    dmg,
    msg: `${player.username}攻击${npc.name}造成${dmg}点伤害`
  });
  if (npc.hp <= 0) {
    npc.alive = false;
    npc.hp = 0;
    logs.push({ time: Date.now(), type: 'npcDead', npc: npc.id, by: player.uid });
    player.kills = (player.kills || 0) + 1;
    if (game.map && game.map[npc.map]) {
      const drop = require('./map').drawItem(game.map, npc.map);
      if (drop) {
        if (!player.inventory) player.inventory = [];
        player.inventory.push(drop);
        logs.push({ time: Date.now(), type: 'itemget', uid: player.uid, item: drop.name });
      }
    }
    if (game.mapNpcs && game.mapNpcs[npc.map]) {
      const idx = game.mapNpcs[npc.map].findIndex(n => n.id === npc.id);
      if (idx >= 0) game.mapNpcs[npc.map].splice(idx, 1);
    }
    const i = game.npcs.indexOf(npc);
    if (i >= 0) game.npcs.splice(i, 1);
  }
  return logs;
}

function onPlayerAttackPlayer(player, target, game, room) {
  const logs = [];
  if (!target.alive) return logs;
  const dmg = Math.max(1, player.atk - (target.def || 0));
  target.hp -= dmg;
  logs.push({
    time: Date.now(),
    type: 'attackPlayer',
    attacker: player.uid,
    target: target.uid,
    dmg,
    msg: `${player.username}攻击${target.username}造成${dmg}点伤害`
  });
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    player.kills = (player.kills || 0) + 1;
    logs.push({ time: Date.now(), type: 'playerDead', uid: target.uid, by: player.uid });
  }
  return logs;
}

function resolveStatus(player, game, room, log) {
  if (!player.status) return;
  const now = Date.now();
  if (player.status.poison) {
    player.hp -= player.status.poison;
    log.push({
      time: now,
      type: 'status',
      status: 'poison',
      uid: player.uid,
      dmg: player.status.poison,
      msg: `${player.username}受到毒素影响，损失${player.status.poison}点生命`
    });
    if (player.hp <= 0) {
      player.hp = 0;
      player.alive = false;
      log.push({ time: now, type: 'playerDead', uid: player.uid });
    }
  }
}

module.exports = {
  onPlayerMove,
  onPlayerAttackNpc,
  onPlayerAttackPlayer,
  resolveStatus,
  combineItems,
  restPlayer,
};
