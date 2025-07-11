<template>
  <el-card>
    <h2>游戏配置</h2>
    <p>你已加入房间 {{ roomId }} ，请在下方选择初始设置。</p>
    <el-form :model="form" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio label="m">男</el-radio>
          <el-radio label="f">女</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <!-- 按钮在字段未填写完时禁用，防止误操作 -->
    <el-button 
      type="primary" 
      :disabled="!form.nickname || !form.gender" 
      @click="startGame"
    >开始游戏</el-button>
  </el-card>
</template>

<script setup>
// 导入 vue/element-plus 相关功能
import { reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../utils/http'  // axios封装实例，自动带token
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
// roomId 来自路由参数，假设 /room/:id 路由
const roomId = computed(() => route.params.id)

// form结构对应需要提交的用户配置数据
const form = reactive({
  nickname: '',  // 注意！和后端字段 username 对应，建议与后端保持统一命名
  gender: 'm'
})

// 核心函数：发起游戏配置请求
function startGame() {
  // --------【注意1：后端API路径和payload结构需确认】--------
  // 推荐写法：与 AGENTS.md 及后端约定一致，配置行为统一走 action 接口
  // 如后端未实现 /game/:groomid/config，应改用 /api/game/:groomid/action，并传 type: 'config'
  http.post(`/api/game/${roomId.value}/action`, {
    type: 'config',  // 标明是配置信息
    params: {
      username: form.nickname,  // 建议后端和前端统一用 username 字段
      gender: form.gender
    }
  })
    .then(res => {
      // --------【注意2：code判断，msg友好提示】--------
      if (res.data.code === 0) {
        // 跳转到房间游戏界面
        router.push(`/room/${roomId.value}`)
      } else {
        // 显示后端错误信息（如昵称重复等）
        ElMessage.error(res.data.msg || '配置失败')
      }
    })
    .catch(() => ElMessage.error('网络错误'))  // 网络异常友好提示
}

/* ============ 重要注意事项汇总 ============

1. 与后端接口协定：务必确认配置接口路径，推荐 /api/game/:groomid/action + type/config 格式，避免和文档或实现脱节。
2. 字段命名要统一：如后端表为 username，前端form请同步用 username，不要用 nickname。后端如兼容 nickname 也建议统一为 username。
3. 表单校验：本例通过按钮 disabled 简单校验；如需更严谨可用 el-form 验证。
4. UI友好性：接口返回失败时应有明确提示。
5. 业务流畅性：配置成功后自动跳转房间，体验顺滑。
6. 默认值：性别默认'm'，如有头像/签名等字段，建议后端和前端补齐对应。

========================================= */
</script>
