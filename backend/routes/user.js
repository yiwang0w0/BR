const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 注册
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.json({ code: 1, msg: "缺少参数" });

  const exist = await User.findOne({ where: { username } });
  if (exist) return res.json({ code: 1, msg: "用户名已存在" });

  const hash = bcrypt.hashSync(password, 10);
  await User.create({ username, password: hash });

  res.json({ code: 0, msg: "注册成功" });
});

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.json({ code: 1, msg: "缺少参数" });

  const user = await User.findOne({ where: { username } });
  if (!user) return res.json({ code: 1, msg: "用户不存在" });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.json({ code: 1, msg: "密码错误" });

  // 生成JWT
  const token = jwt.sign({ uid: user.uid, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ code: 0, msg: "登录成功", token });
});

module.exports = router;
