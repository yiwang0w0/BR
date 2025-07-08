const { Server } = require('ws');

let wss;
const rooms = new Map();

function init(server) {
  wss = new Server({ server, path: '/ws' });
  wss.on('connection', ws => {
    ws.rooms = new Set();
    ws.on('message', data => {
      let msg;
      try { msg = JSON.parse(data); } catch (e) { return; }
      const { type, payload } = msg;
      if (type === 'join_room' && payload && payload.groomid) {
        joinRoom(ws, payload.groomid);
        sendRoomMessage(payload.groomid, {
          type: 'player_join',
          payload: { uid: payload.uid, username: payload.username }
        });
      } else if (type === 'leave_room' && payload && payload.groomid) {
        leaveRoom(ws, payload.groomid);
        sendRoomMessage(payload.groomid, {
          type: 'player_leave',
          payload: { uid: payload.uid, username: payload.username }
        });
      } else if (type === 'chat_message' && payload && payload.groomid && payload.text) {
        sendRoomMessage(payload.groomid, {
          type: 'chat_message',
          payload: { user: payload.user, text: payload.text }
        });
      }
    });
    ws.on('close', () => {
      for (const rid of ws.rooms) {
        const set = rooms.get(rid);
        if (set) set.delete(ws);
      }
    });
  });
}

function joinRoom(ws, rid) {
  let set = rooms.get(rid);
  if (!set) {
    set = new Set();
    rooms.set(rid, set);
  }
  set.add(ws);
  ws.rooms.add(rid);
}

function leaveRoom(ws, rid) {
  const set = rooms.get(rid);
  if (set) set.delete(ws);
  ws.rooms.delete(rid);
}

function sendRoomMessage(rid, data) {
  const set = rooms.get(rid);
  if (!set) return;
  const msg = JSON.stringify(data);
  for (const c of set) {
    if (c.readyState === 1) c.send(msg);
  }
}

function emitRoomUpdate(rid, data) {
  sendRoomMessage(rid, { type: 'room_update', payload: data });
}

function emitBattleResult(rid, data) {
  sendRoomMessage(rid, { type: 'battle_result', payload: data });
}

function getIO() { return wss; }

module.exports = { init, getIO, emitRoomUpdate, emitBattleResult, sendRoomMessage };
