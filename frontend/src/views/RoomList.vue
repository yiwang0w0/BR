<template>
  <div>
    <el-card>
      <template #header>
        <span>房间大厅</span>
      </template>
      <el-table :data="rooms" stripe style="width: 100%">
        <el-table-column prop="groomid" label="房间号" width="100"/>
        <el-table-column prop="gamenum" label="游戏编号"/>
        <el-table-column prop="gametype" label="类型"/>
        <el-table-column prop="gamestate" label="状态"/>
        <el-table-column prop="validnum" label="总人数"/>
        <el-table-column prop="alivenum" label="存活"/>
        <el-table-column prop="deathnum" label="死亡"/>
        <el-table-column label="开始倒计时">
          <template #default="scope">
            {{ countdown(scope.row.starttime) }}
          </template>
        </el-table-column>
        <el-table-column>
          <template #default="scope">
            <el-button size="small" type="primary" @click="enterRoom(scope.row.groomid)">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'

const rooms = ref([])
const router = useRouter()

onMounted(async () => {
  const res = await http.get('/rooms')
  if(res.data.code === 0){
    rooms.value = res.data.data
  }
})

function countdown(ts){
  const diff = ts - Math.floor(Date.now()/1000)
  if(diff <= 0) return '已开始'
  const m = Math.floor(diff/60)
  const s = diff % 60
  return `${m}分${s}秒`
}

function enterRoom(id) {
  router.push(`/game/${id}`)
}
</script>
