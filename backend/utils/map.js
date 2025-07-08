const fs = require('fs');
const path = require('path');

const mapItemsPath = path.join(__dirname, '../data/mapitems.json');
let mapItemsData = null;

function loadMapItems() {
  if (!mapItemsData) {
    mapItemsData = JSON.parse(fs.readFileSync(mapItemsPath, 'utf8'));
  }
  return mapItemsData;
}

function initMap() {
  const data = loadMapItems();
  const map = {};
  for (const row of data) {
    const [time, place, num, name, kind, effect, dur, attr, attr2] = row;
    const count = parseInt(num, 10) || 1;
    const pid = parseInt(place, 10);
    if (!map[pid]) map[pid] = [];
    const item = { name, kind, effect: Number(effect), dur: Number(dur), attr, attr2 };
    for (let i = 0; i < count; i++) {
      map[pid].push({ ...item });
    }
  }
  return map;
}

function drawItem(gameMap, mapId) {
  if (!gameMap) return null;
  if (!gameMap[mapId] || gameMap[mapId].length === 0) {
    mapId = 99;
  }
  const items = gameMap[mapId];
  if (!items || items.length === 0) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items.splice(idx, 1)[0];
}

module.exports = { initMap, drawItem };
