let socket
const callbacks = []

function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  }
}

export function connect(token) {
  if (socket) return socket
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  socket = new WebSocket(`${proto}://${location.host}/ws?token=${token}`)
  socket.addEventListener('message', (e) => {
    let msg
    try { msg = JSON.parse(e.data) } catch (err) { return }
    callbacks.forEach(cb => cb(msg))
  })
  return socket
}

export function joinRoom(id, info = {}) {
  send({ type: 'join_room', payload: { groomid: id, ...info } })
}

export function leaveRoom(id, info = {}) {
  send({ type: 'leave_room', payload: { groomid: id, ...info } })
}

export function sendChat(id, text, user) {
  send({ type: 'chat_message', payload: { groomid: id, text, user } })
}

export function onMessage(cb) {
  callbacks.push(cb)
}

export default { connect, joinRoom, leaveRoom, sendChat, onMessage }
