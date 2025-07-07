const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_SECRET = 'refreshsecret';

const userRouter = require('../routes/user');
const tokenStore = require('../utils/tokenStore');

const app = express();
app.use(express.json());
app.use('/', userRouter);

describe('Refresh token', function() {
  it('returns access token with uid and username', function(done) {
    const refreshToken = jwt.sign({ uid: 1, username: 'foo' }, process.env.REFRESH_SECRET);
    tokenStore.add(refreshToken);
    request(app)
      .post('/refresh')
      .send({ refreshToken })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const payload = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
        expect(payload.uid).to.equal(1);
        expect(payload.username).to.equal('foo');
        done();
      });
  });
});
