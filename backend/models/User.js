const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const User = sequelize.define('bra_users', {
  uid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(15), unique: true, allowNull: false, defaultValue: '' },
  // bcrypt hash 长度固定为 60
  password: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '' },
  alt_pswd: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  ip: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  groupid: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  roomid: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  gender: { type: DataTypes.STRING(1), allowNull: false, defaultValue: '0' },
  motto: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
  killmsg: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
  lastword: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
  lastwin: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  lastgame: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  validgames: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  wingames: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalcredits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  credits2: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // mediumint 可用 int 代替
  gold: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  gold2: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  elo_rating: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1500 },
  elo_volatility: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 400 },
  elo_playedtimes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  card: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  cd_s: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  cd_a: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  cd_a1: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  cd_b: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  cardenergylastupd: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  u_templateid: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  icon: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '0' },

  // 以下所有 text 字段必须 defaultValue: ''
  cardenergy: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  cardlist: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  elo_history: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  u_achievements: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  n_achievements: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
}, {
  tableName: 'bra_users',
  timestamps: false,
});

module.exports = User;
