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
import http from '../utils/http'
import { ElMessage } from 'element-plus'

const user = ref(null)

onMounted(async () => {
  try {
    const res = await http.get('/user/me')
    if(res.data.code === 0){
      user.value = res.data.data
    } else {
      ElMessage.error(res.data.msg || '获取失败')
    }
  } catch(e){
    ElMessage.error('网络错误')
    console.error(e)
  }
})
</script>
