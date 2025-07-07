const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Message = sequelize.define('bra_messages', {
  mid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  timestamp: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  rd: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  checked: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  receiver: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  sender: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  title: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  enclosure: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
}, {
  tableName: 'bra_messages',
  timestamps: false,
});

module.exports = Message;
