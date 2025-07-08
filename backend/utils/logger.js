const Log = require('../models/Log');
const News = require('../models/News');
const { broadcast } = require('./socket');

async function logSave(uid, type, text) {
  await Log.create({
    toid: uid,
    type,
    time: Math.floor(Date.now() / 1000),
    log: text
  });
  broadcast({ type: 'log', uid, log: text, ltype: type });
}

async function addNews(event, a = '', b = '', c = '', d = '', e = '') {
  await News.create({
    time: Math.floor(Date.now() / 1000),
    news: event,
    a, b, c, d, e
  });
  broadcast({ type: 'news', event, a, b, c, d, e });
}

module.exports = { logSave, addNews };
