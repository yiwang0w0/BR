const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const History = sequelize.define('bra_history', {
  gid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  wmode: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  winner: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  motto: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
  gametype: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  vnum: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  gtime: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  gstime: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  getime: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  hdmg: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  hdp: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  hkill: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  hkp: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  winnernum: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  winnerteamID: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' },
  winnerlist: { type: DataTypes.STRING(1000), allowNull: false, defaultValue: '' },
  winnerpdata: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  validlist: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  hnews: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }
}, {
  tableName: 'bra_history',
  timestamps: false
});

module.exports = History;
