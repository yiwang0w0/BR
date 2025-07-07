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
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import axios from 'axios'

const form = reactive({
  username: '',
  password: ''
})

async function onSubmit() {
  // TODO: 接入 /api/login
  console.log('login submit', form)
  try {
    const res = await axios.post('http://localhost:3000/api/login', form)
    console.log(res.data)
  } catch (e) {
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
