const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_SECRET = 'refreshsecret';

const userRouter = require('../routes/user');
const tokenStore = require('../utils/tokenStore');
const RefreshToken = require('../models/RefreshToken');

const app = express();
app.use(express.json());
app.use('/', userRouter);

describe('Refresh token', function() {
  before(async function() {
    await RefreshToken.sync({ force: true });
  });

  it('returns access token with uid and username', async function() {
    const refreshToken = jwt.sign({ uid: 1, username: 'foo' }, process.env.REFRESH_SECRET);
    await tokenStore.add(refreshToken);
    const record = await RefreshToken.findOne({ where: { token: refreshToken } });
    expect(record.uid).to.equal(1);
    const res = await request(app)
      .post('/refresh')
      .send({ refreshToken })
      .expect(200);
    const payload = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
    expect(payload.uid).to.equal(1);
    expect(payload.username).to.equal('foo');
  });
});
