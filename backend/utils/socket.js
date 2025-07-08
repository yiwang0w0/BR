const { Server } = require('socket.io');

let io;

function init(server) {
  io = new Server(server, {
    path: '/ws',
    cors: { origin: '*' }
  });
  io.on('connection', socket => {
    socket.on('message', msg => {
      if (!msg || !msg.type) return;
      const { type, payload } = msg;
      if (type === 'join_room' && payload && payload.groomid) {
        socket.join(`room_${payload.groomid}`);
        io.to(`room_${payload.groomid}`).emit('message', {
          type: 'player_join',
          payload: { uid: payload.uid, username: payload.username }
        });
      } else if (type === 'leave_room' && payload && payload.groomid) {
        socket.leave(`room_${payload.groomid}`);
        io.to(`room_${payload.groomid}`).emit('message', {
          type: 'player_leave',
          payload: { uid: payload.uid, username: payload.username }
        });
      } else if (type === 'chat_message' && payload && payload.groomid && payload.text) {
        io.to(`room_${payload.groomid}`).emit('message', {
          type: 'chat_message',
          payload: { user: payload.user, text: payload.text }
        });
      }
    });
  });
}

function getIO() { return io; }

function emitRoomUpdate(groomid, data) {
  if (io) io.to(`room_${groomid}`).emit('message', { type: 'room_update', payload: data });
}

function emitBattleResult(groomid, data) {
  if (io) io.to(`room_${groomid}`).emit('message', { type: 'battle_result', payload: data });
}

module.exports = { init, getIO, emitRoomUpdate, emitBattleResult };
