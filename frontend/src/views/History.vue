<template>
  <el-card>
    <template #header>
      <span>历史对局</span>
    </template>
    <!-- 历史列表表格，绑定 list 数据源 -->
    <el-table :data="list" stripe style="width: 100%">
      <el-table-column prop="gid" label="局号" width="80" />
      <el-table-column prop="winner" label="赢家" />
      <el-table-column prop="gametype" label="类型" width="80" />
      <!-- 时间列使用 formatTime 格式化为本地时间字符串 -->
      <el-table-column prop="gtime" label="时间">
        <template #default="scope">
          {{ formatTime(scope.row.gtime) }}
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页控件，绑定 total，翻页触发 loadHistory(page) -->
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
// ============ 依赖导入 ============
import { ref, onMounted } from 'vue'
import http from '../utils/http'   // axios 封装实例，自动带 token

// ============ 响应式变量 ============
const list = ref([])       // 历史局列表
const total = ref(0)       // 总条数，供分页使用
const pageSize = 10        // 每页条数，建议与后端分页一致

// ============ 生命周期钩子：页面初始化时加载第一页 ============
onMounted(() => {
  loadHistory()
})

// ============ 历史局数据加载函数 ============
// 参数 page 为页码，默认1；如分页组件切换，会传入当前页
async function loadHistory(page = 1) {
  // --------【注意1：接口路径需与后端保持一致】--------
  // 推荐走 /api/history，支持分页参数 page/pageSize
  // 如需过滤按用户/时间等可扩展 params
  const res = await http.get('/api/history', { params: { page, pageSize } })
  if (res.data.code === 0) {
    // --------【注意2：返回结构需与后端约定一致】--------
    // 通常为 { code, data: { list: [...], total: 123 } }
    list.value = res.data.data.list
    total.value = res.data.data.total
  }
  // else 这里可以加错误提示
}

// ============ 工具函数：时间戳格式化 ============
// 数据库 gtime 字段为 UNIX 秒时间戳，需转成 Date
function formatTime(ts) {
  // --------【注意3：后端存的是秒，需 *1000 转毫秒】--------
  const d = new Date(ts * 1000)
  return d.toLocaleString()  // 显示本地时间
}

/* =================== 重要注意事项 ===================
1. API 路径需和 AGENTS.md 保持一致（一般是 /api/history）
2. 分页参数 page/pageSize 前后端需约定（起始页通常为1）
3. 返回结构建议标准化为 { code, data: { list, total } }
4. 表格内时间戳字段通常为秒，需转毫秒后格式化
5. 如需显示更多字段（如赢家ID/模式），可在 el-table-column 扩展
6. 若需更详细的单局信息，可给 gid 设置 router-link 点击跳转到详情页
7. 分页控件 layout 可根据需求增减功能（如 jumper、sizes）
=================================================== */
</script>
