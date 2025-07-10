const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const History = require('../models/History');

router.use(auth);

// 获取历史对局列表，可按 winner、gametype 等参数筛选
router.get('/history', async (req, res) => {
  const { winner, gametype, limit = 20 } = req.query;
  const where = {};
  if (winner) where.winner = winner;
  if (gametype) where.gametype = Number(gametype);
  try {
    const list = await History.findAll({
      where,
      order: [['gid', 'DESC']],
      limit: Number(limit) > 0 ? Number(limit) : 20
    });
    res.json({ code: 0, msg: 'ok', data: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 获取指定局的详细信息
router.get('/history/:gid', async (req, res) => {
  const { gid } = req.params;
  const record = await History.findOne({ where: { gid } });
  if (!record) return res.status(404).json({ code: 1, msg: '记录不存在' });
  res.json({ code: 0, msg: 'ok', data: record });
});

module.exports = router;
