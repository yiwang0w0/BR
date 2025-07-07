# DTS Game - Modern Web Remake

> 本项目是基于https://github.com/sillycross/dts的重构版本，使用 Node.js + MySQL 实现后端 API，前端采用 Vue3 + Element Plus。致力于打造现代化的房间制/回合制多人在线大逃杀游戏。

---

## 技术栈

- **前端**：Vue3, Element Plus, Pinia, Axios, Vite
- **后端**：Node.js (Express)，Sequelize ORM，MySQL 8+
- **实时通信**：Socket.io
- **认证安全**：JWT，bcrypt
- **开发环境**：Docker（可选），PM2

---

## 目录结构

```bash
.
├── backend/              # Node.js 后端
│   ├── models/           # Sequelize ORM模型
│   ├── routes/           # API 路由
│   ├── controllers/      # 业务逻辑
│   ├── middlewares/      # 中间件
│   ├── utils/            # 工具
│   ├── app.js            # 入口
│   └── database.sql      # 数据库建表脚本
├── frontend/             # Vue3 前端
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── ...
├── README.md
├── AGENTS.md
└── database.sql          # （冗余）快速入口
```

---

## 快速开始

### 1. 数据库初始化

1. 安装 MySQL 8+，创建库 `dts_game`。
2. 导入建表 SQL：

   ```bash
   mysql -u root -p dts_game < database.sql
   ```

### 2. 启动后端

```bash
cd backend
npm install
cp .env.example .env   # 并配置你的数据库账号
npm run dev
```

后端 API 默认运行于 `http://localhost:3000`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行于 `http://localhost:5173`

---

## 主要功能

- 用户注册/登录/登出、个人信息、ELO 排名
- 房间大厅、创建/加入房间、观战
- 实时游戏流程（生存/杀人/回合）
- 私信/系统消息、历史对局
- 玩家成就、背包、商城（可选）
- 管理员后台（可选）

---

## 开发建议

- 配置 `.env` 文件（见后端根目录），注意数据库连接。
- 推荐配合 PM2 生产部署，支持 Docker 一键启动（后续补充 docker-compose.yaml）。
- 前端对接后端 API，接口文档见 [AGENTS.md](AGENTS.md)。

---

## 贡献

欢迎 PR 或 issue 反馈！  
如有疑问请联系维护者 [@yiwang0w0](https://github.com/yiwang0w0)。

---

## License

MIT
