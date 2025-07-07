// backend/models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
}

module.exports = sequelize;
