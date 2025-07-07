const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const RefreshToken = sequelize.define('refresh_tokens', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  uid: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  expiresAt: { type: DataTypes.DATE }
}, {
  tableName: 'refresh_tokens',
  timestamps: false
});

module.exports = RefreshToken;
