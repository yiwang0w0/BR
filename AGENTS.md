# DTS Game - 后端 API 说明

本文件记录 Node.js 后端主要 API 接口和典型数据格式。

---

## 端口提示

已实现端口：

- **3000** - REST API 与 WebSocket 服务
- **5173** - 前端 Vite 开发服务器
- **3306** - MySQL 数据库

预留端口（未实现）：

- **8080** - 管理后台计划使用端口

---

## 用户/认证

### 注册 （已实现）

- `POST /api/register`
- Body: `{ username, password }`
- 返回：`{ code, msg, data }`

### 登录 （已实现）

- `POST /api/login`
- Body: `{ username, password }`
- 返回：`{ code, msg, token }`

### 获取当前用户信息 （已实现）

- `GET /api/user/me`
- Header: `Authorization: Bearer <token>`
- 返回：用户详细资料

---

## 游戏大厅/房间

### 获取房间列表 （已实现）

- `GET /api/rooms`
- 返回：房间数组（含状态、人数等）

### 创建房间 （未实现）

- `POST /api/rooms`
- Body: `{ gametype, roomname, ... }`
- 返回：房间信息

### 加入房间 （已实现）

- `POST /api/rooms/:id/join`
- Header: 认证
- 返回：成功/失败

---

## 游戏主流程

### 获取游戏房间详情 （已实现）

- `GET /api/game/:groomid`
- 返回：当前游戏所有状态（参考 bra_game 表字段）

### 游戏操作（举例，已实现）

- `POST /api/game/:groomid/action`
- Body: `{ type: 'move' | 'attack' | ... , params: { ... } }`
- 返回：操作后新状态

---

## 消息/邮件系统

### 发送消息 （已实现）

- `POST /api/messages`
- Body: `{ receiver, title, content }`
- 返回：发送结果

### 获取消息 （已实现）

- `GET /api/messages/inbox`
- 返回：收件箱

- `GET /api/messages/outbox`
- 返回：发件箱

---

## 排行榜/历史对局

### 查询历史对局 （未实现）

- `GET /api/history`
- 可加参数过滤，如按用户、时间等

### 查询某局详情 （未实现）

- `GET /api/history/:gid`

---

## 认证&错误说明

- 绝大多数 API 需要登录（JWT token），未授权将返回 401
- 返回结构通常如下：

```json
{
  "code": 0,
  "msg": "ok",
  "data": { ... }
}
```

- code 非 0 时为错误，msg 为错误原因。

---

## WebSocket 约定（已实现）

- 地址: `ws://localhost:3000/ws`
- 连接后通过 `{ type, payload }` 结构传递事件，如：
  - `join_room`, `start_game`, `game_action`, `chat_message`
- 后端会定期推送房间/游戏状态变更。

---

## 主要表结构简要说明

详见 `database.sql`，各表字段详尽注释。

- **bra_users** 用户主表
- **bra_game** 当前活跃房间状态
- **bra_roomlisteners** 房间监听/推送辅助
- **bra_messages**/ **bra_del_messages** 站内信/系统消息
- **bra_history** 历史对局

---

如需补充请 issue 或直接 PR。
