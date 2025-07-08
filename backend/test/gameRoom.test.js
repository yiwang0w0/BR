const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.READY_MIN = '0';

const sequelize = require('../models');
const Room = require('../models/Room');
const User = require('../models/User');
const History = require('../models/History');
const roomRouter = require('../routes/room');
const { createRoom } = require('../utils/scheduler');

const app = express();
app.use(express.json());
app.use('/', roomRouter);

const originalRandom = Math.random;
const originalSetTimeout = global.setTimeout;

describe('房间与NPC相关逻辑', function() {
  before(async function() {
    Math.random = () => 0; // 保证生成的随机值可预测
    global.setTimeout = (fn) => { fn(); return null; };
    await sequelize.sync({ force: true });
  });

  after(function() {
    Math.random = originalRandom;
    global.setTimeout = originalSetTimeout;
  });

  it('创建房间时应包含NPC', async function() {
    const room = await createRoom();
    const saved = await Room.findByPk(room.groomid);
    const game = JSON.parse(saved.gamevars);
    expect(game.npcs).to.have.length.above(0);
  });

  it('玩家移动后NPC会行动并造成伤害与日志记录', async function() {
    const user = await User.create({ username: 'p1', password: 'h' });
    const token = jwt.sign({ uid: user.uid, username: user.username }, process.env.JWT_SECRET);
    const room = await createRoom();
    await request(app)
      .post(`/rooms/${room.groomid}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const res = await request(app)
      .post(`/game/${room.groomid}/action`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'move', params: { x: 1, y: 0 } })
      .expect(200);

    const game = res.body.data.game;
    const logTypes = game.log.map(l => l.type);
    expect(game.players[user.uid].hp).to.equal(11);
    expect(logTypes.filter(t => t === 'move')).to.have.lengthOf(1);
    expect(logTypes.filter(t => t === 'hurt')).to.have.lengthOf(3);
  });

  it('击败所有NPC应判定胜利', async function() {
    const user = await User.create({ username: 'p2', password: 'h' });
    const token = jwt.sign({ uid: user.uid, username: user.username }, process.env.JWT_SECRET);
    const room = await createRoom();
    await request(app)
      .post(`/rooms/${room.groomid}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    let record = await Room.findByPk(room.groomid);
    let game = JSON.parse(record.gamevars);
    game.players[user.uid].atk = 50;
    await record.update({ gamevars: JSON.stringify(game) });

    let res;
    for (const id of [1,2,3]) {
      res = await request(app)
        .post(`/game/${room.groomid}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'attack', params: { npcId: id } })
        .expect(200);
    }

    expect(res.body.data.gameover).to.equal('win');
    expect(res.body.data.game.npcs).to.have.lengthOf(0);
    const historyCount = await History.count();
    expect(historyCount).to.equal(1);
  });

  it('玩家被击败应判定失败', async function() {
    const user = await User.create({ username: 'p3', password: 'h' });
    const token = jwt.sign({ uid: user.uid, username: user.username }, process.env.JWT_SECRET);
    const room = await createRoom();
    await request(app)
      .post(`/rooms/${room.groomid}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    let record = await Room.findByPk(room.groomid);
    let game = JSON.parse(record.gamevars);
    game.players[user.uid].hp = 1;
    await record.update({ gamevars: JSON.stringify(game) });

    const res = await request(app)
      .post(`/game/${room.groomid}/action`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'move', params: { x: 1, y: 0 } })
      .expect(200);

    expect(res.body.data.gameover).to.equal('lose');
  });
});
