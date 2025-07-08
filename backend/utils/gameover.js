const { checkEndConditions, endGame } = require('./scheduler');
const logger = require('./logger');

function checkGameOverAndEnd(game, room, logs = []) {
  const result = checkEndConditions(game, room.gametype);
  if (result) {
    logs.push({
      time: Date.now(),
      type: 'gameover',
      result: result.result,
      winner: result.winner || ''
    });
    endGame(room, result.result, result.winner, game);
    logger.addNews('gameover', result.winner || '', result.result);
    return result.result;
  }
  return null;
}

module.exports = { checkGameOverAndEnd };
