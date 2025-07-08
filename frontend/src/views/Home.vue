<template>
  <el-card>
    <h1>欢迎来到DTS大逃杀游戏</h1>
    <p v-if="auth.isLoggedIn()">请选择左侧菜单。</p>
    <p v-else>登录后可加入游戏。</p>
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
    <div v-else style="margin-top:20px;">
      <el-button type="primary" @click="joinGame">加入游戏</el-button>
      <el-button type="warning" @click="logout" style="margin-left:10px;">注销</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import http from '../utils/http'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({ username: '', password: '' })

async function onSubmit() {
  try {
    const res = await http.post('/login', form)
    if (res.data.code === 0) {
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

function logout() {
  auth.logout()
  ElMessage.success('已注销')
}

async function joinGame() {
  try {
    let rid
    const next = await http.get('/rooms/next')
    if (next.data.code !== 0 || !next.data.data) {
      const created = await http.post('/rooms')
      if (created.data.code !== 0 || !created.data.data) {
        ElMessage.error(created.data.msg || '创建房间失败')
        return
      }
      rid = created.data.data.groomid
    } else {
      rid = next.data.data.groomid
    }
    const join = await http.post(`/rooms/${rid}/join`)
    if (join.data.code === 0) {
      ElMessage.success('加入成功')
      router.push(`/game-config/${rid}`)
    } else {
      ElMessage.error(join.data.msg || '加入失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}
</script>
