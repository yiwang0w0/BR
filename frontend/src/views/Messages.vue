<template>
  <el-tabs v-model="active" @tab-change="loadData()">
    <el-tab-pane label="收件箱" name="inbox">
      <el-table :data="messages" stripe style="width: 100%">
        <el-table-column prop="mid" label="ID" width="80" />
        <el-table-column prop="sender" label="发送者" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="timestamp" label="时间">
          <template #default="scope">
            {{ formatTime(scope.row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        style="margin-top: 10px; text-align: right"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="total"
        @current-change="page => loadData(page)"
      />
    </el-tab-pane>
    <el-tab-pane label="发件箱" name="outbox">
      <el-table :data="messages" stripe style="width: 100%">
        <el-table-column prop="mid" label="ID" width="80" />
        <el-table-column prop="receiver" label="接收者" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="timestamp" label="时间">
          <template #default="scope">
            {{ formatTime(scope.row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        style="margin-top: 10px; text-align: right"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="total"
        @current-change="page => loadData(page)"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../utils/http'

const active = ref('inbox')
const messages = ref([])
const total = ref(0)
const pageSize = 10

onMounted(() => {
  loadData()
})

async function loadData(page = 1) {
  const res = await http.get(`/messages/${active.value}`, {
    params: { page, pageSize }
  })
  if (res.data.code === 0) {
    messages.value = res.data.data.list
    total.value = res.data.data.total
  }
}

function formatTime(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleString()
}
</script>
