require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const sequelize = require('./models/index');
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const messageRouter = require('./routes/message');
const adminRouter = require('./routes/admin');
const logRouter = require('./routes/log');
const { scheduleRooms } = require('./utils/scheduler');
const wsServer = require('./utils/wsServer'); // 推荐统一命名

const app = express();

app.use(cors());
app.use(express.json());

// 路由注册
app.use('/api', userRouter);
app.use('/api', roomRouter);
app.use('/api', messageRouter);
app.use('/api', adminRouter);
app.use('/api', logRouter);

// 数据库连接测试
sequelize.authenticate()
  .then(() => console.log('数据库连接成功！'))
  .catch(err => console.error('数据库连接失败：', err));

// 自动定时建房
scheduleRooms();

// 健康检查接口
app.get('/api/ping', (req, res) => res.send('pong'));

const PORT = process.env.PORT || 3000;

// 启动 HTTP + WebSocket
const server = http.createServer(app);     // 必须用http.createServer(app)
wsServer.init(server);                     // 初始化 WebSocket 服务

server.listen(PORT, () => {
  console.log('API server listening on port', PORT);
});
