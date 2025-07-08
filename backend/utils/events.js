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

module.exports = {
  onPlayerMove: (player, game, room) => [],
  onPlayerAttackNpc: (player, npc, game, room) => [],
  onPlayerAttackPlayer: (player, target, game, room) => [],
  resolveStatus: (player, game, room, log) => {},
  combineItems,
  restPlayer,
};
