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

// ======================
// 基础事件处理
// ======================

function onPlayerMove(player, game, room) {
  const log = [];
  const mapId = player.map;
  if (!game.mapNpcs) return log;
  const npcs = game.mapNpcs[mapId] || [];
  for (const n of npcs) {
    if (!n.alive) continue;
    const dist = Math.abs(n.pos[0] - player.pos[0]) + Math.abs(n.pos[1] - player.pos[1]);
    if (dist <= 1) {
      player.hp -= n.atk;
      log.push({
        time: Date.now(),
        type: 'hurt',
        uid: player.uid,
        msg: `${player.username}受到${n.atk}点伤害`,
      });
      if (player.hp <= 0) {
        player.hp = 0;
        player.alive = false;
        log.push({ time: Date.now(), type: 'dead', uid: player.uid, msg: `${player.username}被${n.name}击倒` });
        break;
      }
    }
  }
  return log;
}

function onPlayerAttackNpc(player, npc, game, room) {
  const log = [];
  // 保证引用到 mapNpcs 中的对象
  const list = (game.mapNpcs && game.mapNpcs[npc.map]) || [];
  const realNpc = list.find(n => n.id === npc.id) || npc;
  if (!realNpc.alive) return log;
  const dmg = player.atk || 0;
  realNpc.hp -= dmg;
  log.push({
    time: Date.now(),
    type: 'attack',
    uid: player.uid,
    target: realNpc.id,
    msg: `${player.username}攻击${realNpc.name}造成${dmg}点伤害`,
  });
  if (realNpc.hp <= 0) {
    realNpc.hp = 0;
    realNpc.alive = false;
    player.kills = (player.kills || 0) + 1;
    log.push({ time: Date.now(), type: 'npcDead', uid: player.uid, npc: realNpc.id, msg: `${realNpc.name}被击败` });
    if (realNpc.inventory && realNpc.inventory.length) {
      if (!game.map[realNpc.map]) game.map[realNpc.map] = [];
      game.map[realNpc.map].push(...realNpc.inventory);
      log.push({ time: Date.now(), type: 'npcDrop', npc: realNpc.id, items: realNpc.inventory.map(i => i.name).join(',') });
    }
    const idx = list.indexOf(realNpc);
    if (idx >= 0) list.splice(idx, 1);
    game.npcs = Object.values(game.mapNpcs).flat();
  } else {
    // 简单反击
    player.hp -= realNpc.atk;
    log.push({ time: Date.now(), type: 'hurt', uid: player.uid, msg: `${player.username}受到${realNpc.atk}点反击伤害` });
    if (player.hp <= 0) {
      player.hp = 0;
      player.alive = false;
      log.push({ time: Date.now(), type: 'dead', uid: player.uid, msg: `${player.username}被${realNpc.name}击倒` });
    }
  }
  return log;
}

function onPlayerAttackPlayer(player, target, game, room) {
  const log = [];
  if (!target.alive) return log;
  const dmg = Math.max(1, (player.atk || 0) - (target.def || 0));
  target.hp -= dmg;
  log.push({ time: Date.now(), type: 'pk', uid: player.uid, target: target.uid, msg: `${player.username}对${target.username}造成${dmg}点伤害` });
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    player.kills = (player.kills || 0) + 1;
    log.push({ time: Date.now(), type: 'playerDead', uid: target.uid, msg: `${target.username}被${player.username}击倒` });
  }
  return log;
}

function resolveStatus(player, game, room, log) {
  if (!player.status) return;
  const now = Date.now();
  if (player.status.poison && player.status.poison > 0) {
    player.hp -= 1;
    player.status.poison -= 1;
    log.push({ time: now, type: 'hurt', uid: player.uid, msg: `${player.username}受到1点中毒伤害` });
  }
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
    log.push({ time: now, type: 'dead', uid: player.uid, msg: `${player.username}死亡` });
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
