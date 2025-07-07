const refreshTokens = new Set();

module.exports = {
  add(token) {
    refreshTokens.add(token);
  },
  has(token) {
    return refreshTokens.has(token);
  },
  remove(token) {
    refreshTokens.delete(token);
  }
};
