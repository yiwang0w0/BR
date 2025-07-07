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
        <el-table-column>
          <template #default="scope">
            <el-button size="small" type="primary">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const rooms = ref([])

onMounted(async () => {
  const res = await axios.get('http://localhost:3000/api/rooms')
  if(res.data.code === 0){
    rooms.value = res.data.data
  }
})
</script>
