const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const tokenStore = require('../utils/tokenStore');

// 注册
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ code: 1, msg: "缺少参数" });

  const exist = await User.findOne({ where: { username } });
  if (exist) return res.json({ code: 1, msg: "用户名已存在" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.json({ code: 0, msg: "注册成功" });
  } catch (err) {
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 登录
// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ code: 1, msg: "缺少参数" });

  const user = await User.findOne({ where: { username } });
  if (!user) return res.json({ code: 1, msg: "用户不存在" });

  try {
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ code: 1, msg: "密码错误" });

    const accessToken = jwt.sign(
      { uid: user.uid, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { uid: user.uid, username: user.username },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    await tokenStore.add(refreshToken);

    res.json({ code: 0, msg: "登录成功", accessToken, refreshToken });
  } catch (err) {
    // 把错误详细返回
    console.error('[Login error]', err);
    res.status(500).json({ code: 1, msg: '服务器错误', error: err.message });
  }
});


// 刷新 access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ code: 1, msg: '缺少参数' });
  if (!await tokenStore.has(refreshToken)) return res.status(403).json({ code: 1, msg: 'refresh token 无效' });

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    let username = payload.username;
    if (!username) {
      const user = await User.findByPk(payload.uid);
      if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
      username = user.username;
    }
    const accessToken = jwt.sign(
      { uid: payload.uid, username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ code: 0, msg: 'ok', accessToken });
  } catch (err) {
    res.status(403).json({ code: 1, msg: 'refresh token 无效' });
  }
});

// 注销
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await tokenStore.remove(refreshToken);
    res.json({ code: 0, msg: '已登出' });
  } catch (err) {
    // 关键日志
    console.error('[Logout error]', err);
    res.status(500).json({ code: 1, msg: '服务器错误', error: err.message });
  }
});


// 获取当前用户信息（推荐只保留下面这种方式）
router.get('/user/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.uid, {
    attributes: { exclude: ['password'] }
  });
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  res.json({ code: 0, msg: 'ok', data: user });
});

// 更新当前用户信息
router.put('/user/me', auth, async (req, res) => {
  const { motto, gender, killmsg, lastword } = req.body;
  const user = await User.findByPk(req.user.uid);
  if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
  await user.update({
    motto: motto ?? user.motto,
    gender: gender ?? user.gender,
    killmsg: killmsg ?? user.killmsg,
    lastword: lastword ?? user.lastword,
    configured: 1,
  });
  res.json({ code: 0, msg: '更新成功' });
});

module.exports = router;
