const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const News = sequelize.define('bra_newsinfo', {
  nid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  time: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  news: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  a: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  b: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  c: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  d: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  e: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' }
}, {
  tableName: 'bra_newsinfo',
  timestamps: false
});

module.exports = News;
