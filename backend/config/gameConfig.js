require('dotenv').config();
module.exports = {
  startMode: parseInt(process.env.START_MODE || '0', 10),
  startHour: parseInt(process.env.START_HOUR || '0', 10),
  startMin: parseInt(process.env.START_MIN || '3', 10),
  readyMin: parseInt(process.env.READY_MIN || '1', 10)
};
