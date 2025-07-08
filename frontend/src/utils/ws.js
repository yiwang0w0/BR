import { io } from 'socket.io-client'

let socket

export function connect(token) {
  if (socket) return socket
  socket = io('/', { path: '/ws', auth: { token } })
  return socket
}

export function joinRoom(id, info = {}) {
  socket.emit('message', { type: 'join_room', payload: { groomid: id, ...info } })
}

export function leaveRoom(id, info = {}) {
  socket.emit('message', { type: 'leave_room', payload: { groomid: id, ...info } })
}

export function sendChat(id, text, user) {
  socket.emit('message', { type: 'chat_message', payload: { groomid: id, text, user } })
}

export function onMessage(cb) {
  socket.on('message', cb)
}

export default { connect, joinRoom, leaveRoom, sendChat, onMessage }
