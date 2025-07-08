const { Server } = require('ws');

let wss;
const clients = new Set();

function init(server) {
  wss = new Server({ server });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  for (const c of clients) {
    if (c.readyState === 1) c.send(msg);
  }
}

module.exports = { init, broadcast };
