<template>
  <div>
    <h2>游戏房间 {{ route.params.id }}</h2>
    <el-card v-if="room">
      <p>房间号：{{ room.groomid }}</p>
      <p>类型：{{ room.gametype }}</p>
      <p>状态：{{ room.gamestate }}</p>
      <p>人数：{{ room.alivenum }} / {{ room.validnum }}</p>
    </el-card>
    <p v-else>加载中...</p>

    <div v-if="room" class="actions" style="margin-top: 1rem;">
      <p>当前位置：{{ pos[0] }}, {{ pos[1] }}</p>
      <div>
        <el-button size="small" @click="move(0, -1)">↑</el-button>
        <el-button size="small" @click="move(-1, 0)">←</el-button>
        <el-button size="small" @click="move(1, 0)">→</el-button>
        <el-button size="small" @click="move(0, 1)">↓</el-button>
      </div>
    </div>

    <el-card v-if="log.length" class="mt-2">
      <p v-for="(item, idx) in log" :key="idx">{{ item }}</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import http from '../utils/http'

const route = useRoute()
const room = ref(null)
const pos = ref([0, 0])
const log = ref([])

onMounted(async () => {
  const res = await http.get(`/game/${route.params.id}`)
  if (res.data.code === 0) {
    room.value = res.data.data
  }
})

async function move(dx, dy) {
  const [x, y] = pos.value
  const nx = x + dx
  const ny = y + dy
  try {
    const res = await http.post(`/game/${route.params.id}/action`, {
      type: 'move',
      params: { x: nx, y: ny }
    })
    if (res.data.code === 0) {
      pos.value = [nx, ny]
      log.value.push(`移动到 (${nx}, ${ny})`)
    } else {
      log.value.push(`操作失败: ${res.data.msg}`)
    }
  } catch (e) {
    log.value.push('请求失败')
  }
}
</script>
