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
cp .env.example .env   # 根据实际情况修改数据库和游戏设置
npm run dev
```

后端 API 默认运行于 `http://localhost:3000`

or node app.js
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

- 本仓库不包含 `.env`，请在 `backend` 目录中复制 `.env.example` 为 `.env`，并按需调整数据库账号、JWT 密钥及房间启动参数。
- 推荐配合 PM2 生产部署，支持 Docker 一键启动（后续补充 docker-compose.yaml）。
- 前端对接后端 API，接口文档见 [AGENTS.md](AGENTS.md)。

## 游戏搜索流程概述

项目源于根目录 `DTS-SAMPLE` 中的 PHP 版本，为保持玩法一致，搜索逻辑需与原作相
同。原版玩家在地图列表中选定地点后反复点击“搜索”，后端依次判定事件、陷阱、遇敌
及拾取物品。每个地图拥有独立的物品池和 NPC/玩家列表，搜索时从当前地图的池子随机
取得物品或遇敌。

目前后端在房间创建时会通过 `mapUtil.initMap()` 载入 `backend/data/mapitems.json` 初始化各地图的物品池。`search` 行为根据玩家的 `map` 字段确定所在地图，并从该地图的物品池或 NPC 列表抽取结果，坐标仅用于前端表现，不再影响判定。

## 主要函数说明

以下列出了项目中常见的函数及其作用，方便快速了解代码：

### 后端工具函数
- `initNpcs(count, mapSize)`：生成指定数量的 NPC【F:backend/utils/npc.js†L3-L34】
- `act(game)`：驱动 NPC 行动并处理与玩家的交互【F:backend/utils/npc.js†L93-L140】
- `createRoom()`：创建新的游戏房间【F:backend/utils/scheduler.js†L16-L53】
- `startRoom(groomid)`：房间开始进入游戏阶段【F:backend/utils/scheduler.js†L58-L64】
- `endGame(room, result, winner)`：结束游戏并保存历史【F:backend/utils/scheduler.js†L93-L143】
- `scheduleRooms()`：按照配置定时创建房间【F:backend/utils/scheduler.js†L148-L167】
- `add(token)`、`has(token)`、`remove(token)`：刷新令牌的增删查【F:backend/utils/tokenStore.js†L11-L33】
- `combineItems(player, items)`：基础道具合成逻辑【F:backend/utils/events.js†L6-L31】
- `restPlayer(player, mode, log)`：睡眠/治疗等恢复效果【F:backend/utils/events.js†L33-L49】

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
