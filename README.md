# DTS Game - Modern Web Remake

> 本项目是基于https://github.com/sillycross/dts的重构版本，使用 Node.js + MySQL 实现后端 API，前端采用 Vue3 + Element Plus。致力于打造现代化的房间制/回合制多人在线大逃杀游戏。

---

## 技术栈

- **前端**：Vue3, Element Plus, Pinia, Axios, Vite
- **后端**：Node.js (Express)，Sequelize ORM，MySQL 8+
- **实时通信**：WebSocket
- **认证安全**：JWT，bcrypt
- **开发环境**：Docker（可选），PM2

---

## 目录结构

更完整的项目目录示例如下，便于快速定位代码：

```bash
.
├── backend/                  # Node.js 后端
│   ├── app.js                # 入口文件
│   ├── config/               # Sequelize 配置等
│   ├── models/               # 数据模型定义
│   ├── routes/               # API 路由
│   ├── middlewares/          # 通用中间件
│   ├── utils/                # 工具函数
│   ├── scripts/              # 辅助脚本
│   └── test/                 # Mocha 单元测试
├── frontend/                 # Vue3 前端
│   ├── src/
│   │   ├── assets/           # 静态资源
│   │   ├── views/            # 页面组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   └── utils/            # 前端工具
│   ├── public/
│   └── vite.config.js
├── README.md
├── AGENTS.md
└── database.sql              # （冗余）快速入口
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

### 登录并加入游戏

1. 访问前端首页并使用已有账号登录。
2. 登录后点击 **加入游戏** 按钮，系统会自动加入当前进行中的房间。
3. 在随后的配置页面完成昵称和性别等设置后，点击 **开始游戏** 即可进入游戏画面。

---

## 端口提示

已实现端口：

- **3000** - 后端 REST API 以及 WebSocket 服务。
- **5173** - Vite 开发服务器（前端）。
- **3306** - MySQL 数据库（需自行安装）。

预留端口（未实现）：

- **8080** - 后续计划的管理后台。

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

- 本仓库不包含 `.env`，请在 `backend` 目录中复制 `.env.example` 为 `.env` 并根据需要配置数据库连接。
- 推荐配合 PM2 生产部署，支持 Docker 一键启动（后续补充 docker-compose.yaml）。
- 前端对接后端 API，接口文档见 [AGENTS.md](AGENTS.md)。

## 主要函数说明

以下列出了项目中常见的函数及其作用，方便快速了解代码：

### 后端工具函数
- `initNpcs(count, mapSize)`：生成指定数量的 NPC【F:backend/utils/npc.js†L3-L26】
- `act(game)`：驱动 NPC 行动并处理与玩家的交互【F:backend/utils/npc.js†L85-L119】
- `createRoom()`：创建新的游戏房间【F:backend/utils/scheduler.js†L7-L39】
- `startRoom(groomid)`：房间开始进入游戏阶段【F:backend/utils/scheduler.js†L41-L46】
- `endGame(room, result, winner)`：结束游戏并保存历史【F:backend/utils/scheduler.js†L48-L68】
- `scheduleRooms()`：按照配置定时创建房间【F:backend/utils/scheduler.js†L70-L84】
- `add(token)`、`has(token)`、`remove(token)`：刷新令牌的增删查【F:backend/utils/tokenStore.js†L11-L33】

### 中间件
- `auth(req, res, next)`：JWT 鉴权中间件【F:backend/middlewares/auth.js†L3-L16】

### 前端函数
- `setTokens(at, rt)`、`logout()`：管理登录状态【F:frontend/src/stores/auth.js†L10-L27】
- `http`：封装的 axios 实例，统一处理请求与 token【F:frontend/src/utils/http.js†L1-L23】

---

## 贡献

欢迎 PR 或 issue 反馈！  
如有疑问请联系维护者 [@yiwang0w0](https://github.com/yiwang0w0)。

---

## License

MIT
