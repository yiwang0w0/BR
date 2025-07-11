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

describe('击败NPC触发游戏结束', function() {
  before(async function() {
    Math.random = () => 0;
    global.setTimeout = (fn) => { fn(); return null; };
    await sequelize.sync({ force: true });
  });

  after(function() {
    Math.random = originalRandom;
    global.setTimeout = originalSetTimeout;
  });

  it('最后一个NPC被击败后应判定胜利', async function() {
    const user = await User.create({ username: 'hero', password: 'h' });
    const token = jwt.sign({ uid: user.uid, username: user.username }, process.env.JWT_SECRET);
    const room = await createRoom(2); // PVE 模式
    await request(app)
      .post(`/rooms/${room.groomid}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // 只保留一个NPC
    let record = await Room.findByPk(room.groomid);
    let game = JSON.parse(record.gamevars);
    game.npcs = game.npcs.slice(0,1);
    game.mapNpcs = { 0: [game.npcs[0]] };
    game.players[user.uid].atk = 50;
    await record.update({ gamevars: JSON.stringify(game) });

    const res = await request(app)
      .post(`/game/${room.groomid}/action`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'attack', params: { npcId: game.npcs[0].id } })
      .expect(200);

    expect(res.body.data.gameover).to.equal('win');
    const count = await History.count();
    expect(count).to.equal(1);
  });
});
