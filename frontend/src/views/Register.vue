<template>
  <el-card class="login-card">
    <h2>用户注册</h2>
    <el-form :model="form" @submit.prevent="onSubmit" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="form.password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">注册</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const form = reactive({
  username: '',
  password: ''
})
const router = useRouter()

async function onSubmit() {
  try {
    const res = await axios.post('/register', form)
    if (res.data.code === 0) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      ElMessage.error(res.data.msg || '注册失败')
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
