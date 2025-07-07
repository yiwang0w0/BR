<template>
  <el-card>
    <template #header>
      <span>历史对局</span>
    </template>
    <el-table :data="list" stripe style="width: 100%">
      <el-table-column prop="gid" label="局号" width="80" />
      <el-table-column prop="winner" label="赢家" />
      <el-table-column prop="gametype" label="类型" width="80" />
      <el-table-column prop="gtime" label="时间">
        <template #default="scope">
          {{ formatTime(scope.row.gtime) }}
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 10px; text-align: right"
      :page-size="pageSize"
      layout="prev, pager, next"
      :total="total"
      @current-change="page => loadHistory(page)"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../utils/http'

const list = ref([])
const total = ref(0)
const pageSize = 10

onMounted(() => {
  loadHistory()
})

async function loadHistory(page = 1) {
  const res = await http.get('/history', { params: { page, pageSize } })
  if (res.data.code === 0) {
    list.value = res.data.data.list
    total.value = res.data.data.total
  }
}

function formatTime(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleString()
}
</script>
