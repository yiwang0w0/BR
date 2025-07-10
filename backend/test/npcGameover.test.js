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
const roomRouter = require('../routes/room');
const { createRoom } = require('../utils/scheduler');

const app = express();
app.use(express.json());
app.use('/', roomRouter);

describe('NPC 战斗胜利判定', function() {
  before(async function() {
    await sequelize.sync({ force: true });
    global.setTimeout = fn => { fn(); return null; };
    Math.random = () => 0;
  });

  it('击杀所有NPC后应立即gameover', async function() {
    const user = await User.create({ username: 'hero', password: 'x' });
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
  });
});
