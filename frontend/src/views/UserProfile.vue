<template>
  <div>
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>
      <div v-if="user">
        <p>用户名：{{ user.username }}</p>
        <!-- 可扩展更多字段 -->
      </div>
      <div v-else>请先登录。</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref(null)

onMounted(async () => {
  // TODO: 通过 /api/user/me 获取登录用户信息
  try {
    const res = await axios.get('http://localhost:3000/api/user/me', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    })
    if(res.data.code === 0){
      user.value = res.data.data
    }
  } catch(e){
    console.error(e)
  }
})
</script>
