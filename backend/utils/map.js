const mapItemsData = require('../data/mapitems.json');

// Map-specific modifiers extracted from DTS PHP config
const itemfindMods = [
  -15,0,0,15,0,-10,-10,10,5,0,0,5,15,0,5,0,-5,-10,15,0,15,10,5,5,5,0,-10,5,-5,5,0,0,-10,0,-15
];
const meetmanMods = [
  20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,20
];

function initMap() {
  const map = {};
  for (const row of mapItemsData) {
    const [, , mapIdStr, name, kind, effect, amount, attr] = row;
    const mapId = parseInt(mapIdStr, 10);
    if (!map[mapId]) map[mapId] = [];
    map[mapId].push({
      name,
      kind,
      effect: Number(effect) || 0,
      amount: Number(amount) || 0,
      attr: attr || ''
    });
  }
  return map;
}

function drawItem(map, mapId) {
  const items = map[mapId];
  if (!items || items.length === 0) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items.splice(idx, 1)[0];
}

module.exports = { initMap, drawItem, itemfindMods, meetmanMods };
