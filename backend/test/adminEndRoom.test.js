const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.READY_MIN = '0';

const sequelize = require('../models');
const User = require('../models/User');
const History = require('../models/History');
const adminRouter = require('../routes/admin');
const { createRoom } = require('../utils/scheduler');

const app = express();
app.use(express.json());
app.use('/', adminRouter);

const originalSetTimeout = global.setTimeout;

describe('管理端结束房间', function() {
  before(async function() {
    global.setTimeout = (fn) => { fn(); return null; };
    await sequelize.sync({ force: true });
  });

  after(function() {
    global.setTimeout = originalSetTimeout;
  });

  it('调用结束接口后应生成历史记录', async function() {
    const admin = await User.create({ username: 'admin', password: 'h', groupid: 2 });
    const token = jwt.sign({ uid: admin.uid, username: admin.username }, process.env.JWT_SECRET);
    const room = await createRoom();

    await request(app)
      .post(`/admin/rooms/${room.groomid}/end`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const count = await History.count();
    expect(count).to.equal(1);
  });
});
