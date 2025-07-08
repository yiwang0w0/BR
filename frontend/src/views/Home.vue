<template>
  <el-card>
    <h1>欢迎来到DTS大逃杀游戏</h1>
    <p v-if="auth.isLoggedIn()">请选择左侧菜单，或进入房间大厅。</p>
    <el-button v-if="auth.isLoggedIn()" type="primary" @click="$router.push('/rooms')">进入房间大厅</el-button>
    <p v-else>登录后可进入房间大厅。</p>
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
      <el-button type="warning" @click="logout">注销</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import http from '../utils/http'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
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
</script>
