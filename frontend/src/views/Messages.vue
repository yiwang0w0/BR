<template>
  <!-- v-model 绑定 active 实现收件箱/发件箱切换，tab-change 时刷新数据 -->
  <el-tabs v-model="active" @tab-change="loadData()">
    <el-tab-pane label="收件箱" name="inbox">
      <!-- 收件箱表格：显示消息ID、发送者、标题、时间 -->
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
      <!-- 分页控件，支持翻页 -->
      <el-pagination
        style="margin-top: 10px; text-align: right"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="total"
        @current-change="page => loadData(page)"
      />
    </el-tab-pane>
    <el-tab-pane label="发件箱" name="outbox">
      <!-- 发件箱表格：显示消息ID、接收者、标题、时间 -->
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
      <!-- 分页控件 -->
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
// =========== 依赖导入 ===========
import { ref, onMounted } from 'vue'
import http from '../utils/http'

// =========== 响应式数据 ===========
const active = ref('inbox')  // 当前标签：inbox(收件箱) / outbox(发件箱)
const messages = ref([])     // 消息列表
const total = ref(0)         // 消息总数，用于分页
const pageSize = 10          // 每页消息数

// =========== 初始化时拉取当前标签数据 ===========
onMounted(() => {
  loadData()
})

// =========== 数据拉取函数 ===========
/**
 * 加载收件箱/发件箱消息，支持分页
 * @param {number} page - 当前页码，默认1
 * 
 * 注意：
 * 1. API 路径建议为 /api/messages/inbox 或 /api/messages/outbox，严格与后端对齐
 * 2. 支持分页参数 page/pageSize，后端返回 { code, data: { list, total } }
 */
async function loadData(page = 1) {
  const res = await http.get(`/api/messages/${active.value}`, {
    params: { page, pageSize }
  })
  if (res.data.code === 0) {
    messages.value = res.data.data.list
    total.value = res.data.data.total
  }
  // else 可加错误提示
}

// =========== 时间戳格式化 ===========
/**
 * 后端 timestamp 字段为秒时间戳，需 *1000 转为毫秒
 */
function formatTime(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleString()
}

/* =================== 重要注意事项 ===================
1. 建议 API 路径统一加 /api 前缀（如 /api/messages/inbox）
2. 后端返回数据结构建议标准为 { code, data: { list, total } }
3. active 只应为 'inbox' 或 'outbox'，避免拼写错误导致接口404
4. 分页参数要和后端分页逻辑对齐，注意起始页是否为1
5. 时间戳字段记得*1000再格式化，否则显示1970年
6. 可扩展点击表格行跳详情、消息已读等功能
7. 分页翻页、tab切换都要重新loadData，否则数据不同步
===================================================== */
</script>
