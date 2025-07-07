require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./models/index'); // 数据库连接
const userRouter = require('./routes/user'); // 用户相关路由
const roomRouter = require('./routes/room');
const { scheduleRooms } = require('./utils/scheduler');


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', userRouter);
app.use('/api', roomRouter);
// 数据库连接测试
sequelize.authenticate()
  .then(() => console.log('数据库连接成功！'))
  .catch(err => console.error('数据库连接失败：', err));

scheduleRooms();

// 健康检查
app.get('/api/ping', (req, res) => res.send('pong'));

// TODO: 以后可以继续挂载其他路由，比如：
// const roomRouter = require('./routes/room');
// app.use('/api', roomRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('API server listening on port', PORT);
});
