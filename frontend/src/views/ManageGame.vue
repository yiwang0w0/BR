<template>
  <el-card>
    <template #header>
      <span>管理游戏</span>
    </template>
    <div>
      <el-button type="primary" @click="startGame">开始新游戏</el-button>
      <div style="margin-top:20px;">
        <el-input v-model="endId" placeholder="房间ID" style="width:120px;margin-right:10px;" />
        <el-button type="danger" @click="endGame">强行结束房间</el-button>
      </div>
      <el-table :data="rooms" style="margin-top:20px;" border v-if="rooms.length">
        <el-table-column prop="groomid" label="房间ID" width="80" />
        <el-table-column prop="gamestate" label="状态" />
        <el-table-column prop="starttime" label="开始时间" />
      </el-table>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

const rooms = ref([])
const endId = ref('')

async function fetchRooms() {
  const res = await http.get('/rooms')
  if (res.data.code === 0) rooms.value = res.data.data
}

async function startGame() {
  try {
    const res = await http.post('/admin/rooms/start')
    if (res.data.code === 0) {
      ElMessage.success('房间创建成功')
      fetchRooms()
    } else {
      ElMessage.error(res.data.msg || '创建失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

async function endGame() {
  if (!endId.value) {
    ElMessage.error('请输入房间ID')
    return
  }
  try {
    const res = await http.post(`/admin/rooms/${endId.value}/end`)
    if (res.data.code === 0) {
      ElMessage.success('房间已结束')
      fetchRooms()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

onMounted(fetchRooms)
</script>
