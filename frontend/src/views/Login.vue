<template>
  <el-card class="login-card">
    <h2>用户登录</h2>
    <el-form :model="form" @submit.prevent="onSubmit" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="form.password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">登录</el-button>
        <el-button type="success" @click="router.push('/register')" style="margin-left:10px">注册</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const form = reactive({
  username: '',
  password: ''
})
const router = useRouter()
const auth = useAuthStore()

async function onSubmit() {
  try {
    const res = await http.post('/login', form)
    if (res.data.code === 0) {
      auth.setTokens(res.data.accessToken, res.data.refreshToken)
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
    console.error(e)
  }
}
</script>

<style scoped>
.login-card {
  max-width: 400px;
  margin: 0 auto;
}
</style>
