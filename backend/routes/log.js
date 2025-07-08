const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');
const Log = require('../models/Log');
const News = require('../models/News');

router.use(auth);

router.get('/logs', async (req, res) => {
  const since = Number(req.query.since) || 0;
  const logs = await Log.findAll({
    where: { toid: req.user.uid, time: { [Op.gt]: since } },
    order: [['lid', 'ASC']]
  });
  res.json({ code: 0, msg: 'ok', data: logs });
});

router.get('/news', async (req, res) => {
  const since = Number(req.query.since) || 0;
  const news = await News.findAll({
    where: { time: { [Op.gt]: since } },
    order: [['nid', 'ASC']]
  });
  res.json({ code: 0, msg: 'ok', data: news });
});

module.exports = router;
