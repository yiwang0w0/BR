const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const sequelize = require('../models');
const History = require('../models/History');
const historyRouter = require('../routes/history');

const app = express();
app.use(express.json());
app.use('/', historyRouter);

describe('历史对局分页', function() {
  before(async function() {
    await sequelize.sync({ force: true });
    const records = [];
    for (let i = 1; i <= 25; i++) {
      records.push({ gid: i, winner: `p${i}`, gametype: 1 });
    }
    await History.bulkCreate(records);
  });

  it('默认分页返回10条记录和总数', async function() {
    const token = jwt.sign({ uid: 1, username: 'foo' }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.code).to.equal(0);
    expect(res.body.data.list).to.have.lengthOf(10);
    expect(res.body.data.total).to.equal(25);
  });

  it('指定第三页应返回5条记录', async function() {
    const token = jwt.sign({ uid: 1, username: 'foo' }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/history?page=3&pageSize=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.code).to.equal(0);
    expect(res.body.data.list).to.have.lengthOf(5);
    expect(res.body.data.total).to.equal(25);
  });
});
