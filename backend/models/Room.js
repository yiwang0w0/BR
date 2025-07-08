const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Room = sequelize.define('bra_game', {
  groomid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  gamenum: DataTypes.INTEGER.UNSIGNED,
  gametype: DataTypes.INTEGER.UNSIGNED,
  gamestate: DataTypes.INTEGER.UNSIGNED,
  validnum: DataTypes.INTEGER.UNSIGNED,
  alivenum: DataTypes.INTEGER.UNSIGNED,
  deathnum: DataTypes.INTEGER.UNSIGNED,
  groomtype: DataTypes.INTEGER.UNSIGNED,
  groomstatus: DataTypes.INTEGER.UNSIGNED,
  roomvars: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  starttime: DataTypes.INTEGER.UNSIGNED,
  gamevars: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  }
}, {
  tableName: 'bra_game',
  timestamps: false
});

module.exports = Room;
