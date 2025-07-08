const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Log = sequelize.define('bra_log', {
  lid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  toid: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  type: { type: DataTypes.STRING(1), allowNull: false, defaultValue: '' },
  time: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  log: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }
}, {
  tableName: 'bra_log',
  timestamps: false
});

module.exports = Log;
