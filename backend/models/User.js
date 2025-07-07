const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const User = sequelize.define('bra_users', {
  uid: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(15), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(32), allowNull: false },
  // 其它字段可以继续加……
}, {
  tableName: 'bra_users',
  timestamps: false,
});

module.exports = User;
