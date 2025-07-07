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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const room = ref(null)

onMounted(async () => {
  const res = await axios.get(`/game/${route.params.id}`)
  if (res.data.code === 0) {
    room.value = res.data.data
  }
})
</script>
