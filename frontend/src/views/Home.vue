<template>
  <el-card>
    <h1>欢迎来到DTS大逃杀游戏</h1>
    <!-- 登录状态分支 -->
    <p v-if="auth.isLoggedIn()">请选择左侧菜单。</p>
    <p v-else>登录后可加入游戏。</p>

    <!-- 未登录状态：显示登录表单 -->
    <div v-if="!auth.isLoggedIn()" style="margin-top:20px;">
      <el-form :model="form" @submit.prevent="onSubmit" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">登录</el-button>
          <el-button type="success" @click="$router.push('/register')" style="margin-left:10px">注册</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 已登录状态：显示加入/注销按钮 -->
    <div v-else style="margin-top:20px;">
      <el-button type="primary" @click="joinGame">加入游戏</el-button>
      <el-button type="warning" @click="logout" style="margin-left:10px;">注销</el-button>
    </div>
  </el-card>
</template>

<script setup>
// ========================= 依赖导入 =========================
import { reactive } from 'vue'
import http from '../utils/http'           // 封装的 axios，自动带token
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'  // Pinia用户状态管理
import { useRouter } from 'vue-router'

// ========================= 状态变量与表单 =========================
const auth = useAuthStore()
const router = useRouter()
// 登录表单模型
const form = reactive({ username: '', password: '' })

// ========================= 登录提交 =========================
// 登录接口，推荐使用 /api/login，与 AGENTS.md 保持一致
async function onSubmit() {
  try {
    // -------- 注意1：API路径建议加 /api 前缀 -------
    const res = await http.post('/api/login', form)
    if (res.data.code === 0) {
      // -------- 注意2：token结构保持统一 -------
      // 后端建议返回 accessToken/refreshToken 两个字段
      auth.setTokens(res.data.accessToken, res.data.refreshToken)
      ElMessage.success('登录成功')
    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
    console.error(e)
  }
}

// ========================= 注销逻辑 =========================
function logout() {
  auth.logout()
  ElMessage.success('已注销')
}

// ========================= 加入游戏主流程 =========================
/*
流程如下：
1. 尝试获取当前可加入房间（/api/rooms/next），如无可用则创建新房间（/api/rooms）
2. 加入房间（/api/rooms/:id/join）
3. 加入成功后获取当前用户信息（/api/user/me），根据 configured 字段判断是否跳配置页面
4. 特判“已在房间中”时仍需拉取当前房间ID跳转
5. 所有API路径建议补 /api 前缀，与后端保持一致
*/
async function joinGame() {
  try {
    let rid
    // -------- 优先查找可加入房间 -------
    const next = await http.get('/api/rooms/next')
    if (next.data.code !== 0 || !next.data.data) {
      // -------- 无空房则创建 -------
      const created = await http.post('/api/rooms')
      if (created.data.code !== 0 || !created.data.data) {
        ElMessage.closeAll()
        ElMessage.error(created.data.msg || '创建房间失败')
        return
      }
      rid = created.data.data.groomid
    } else {
      rid = next.data.data.groomid
    }

    // -------- 加入房间 -------
    const join = await http.post(`/api/rooms/${rid}/join`)
    if (join.data.code === 0) {
      ElMessage.closeAll()
      ElMessage.success('加入成功')
      // -------- 获取当前用户信息，判断配置状态 -------
      const me = await http.get('/api/user/me')
      if (me.data.code === 0 && me.data.data) {
        const { roomid, configured } = me.data.data
        router.push(configured === 0 ? `/game-config/${roomid}` : `/room/${roomid}`)
      } else {
        router.push(`/game-config/${rid}`)
      }
    } else if (join.data.msg === '已在房间中') {
      // -------- 已在房间，需跳转当前房间 -------
      const me = await http.get('/api/user/me')
      if (me.data.code === 0 && me.data.data) {
        const { roomid, configured } = me.data.data
        router.push(configured === 0 ? `/game-config/${roomid}` : `/room/${roomid}`)
      }
    } else {
      ElMessage.closeAll()
      ElMessage.error(join.data.msg || '加入失败')
    }
  } catch (e) {
    ElMessage.closeAll()
    ElMessage.error('网络错误')
  }
}

/* =================== 重要注意事项 ===================
1. 前后端API路径建议统一加 /api 前缀（例如 /api/login、/api/rooms/next）
2. token 建议用 accessToken/refreshToken，登录后调用 auth.setTokens 存储
3. 加入房间时如后端直接返回 roomid，前端即可跳转；否则需查 /api/user/me 获取最新状态
4. “已在房间中”时依旧需要刷新 roomid 和 configured 字段，避免跳错页面
5. 报错信息统一用 ElMessage.closeAll + error 提示，避免多弹窗叠加
6. 登录表单建议加前端校验（本例略去）
===================================================== */
</script>
