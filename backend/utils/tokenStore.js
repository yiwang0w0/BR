const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const RefreshToken = require('../models/RefreshToken');

async function cleanup() {
  await RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
}

setInterval(cleanup, 60 * 60 * 1000);

module.exports = {
  async add(token) {
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
    const uid = decoded?.uid;
    await RefreshToken.create({ uid, token, expiresAt });
    await cleanup();
  },
  async has(token) {
    await cleanup();
    const record = await RefreshToken.findOne({ where: { token } });
    if (!record) return false;
    if (record.expiresAt && record.expiresAt < new Date()) {
      await record.destroy();
      return false;
    }
    return true;
  },
  async remove(token) {
    await RefreshToken.destroy({ where: { token } });
  },
  cleanup,
};
