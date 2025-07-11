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
  // 发送至房间配置接口，字段与后端保持一致
  http.post(`/game/${roomId.value}/config`, {
    nickname: form.nickname,
    gender: form.gender
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

1. 与后端接口协定：当前实现采用 /game/:groomid/config 路径，字段为 nickname、gender，请与后端保持一致。
2. 字段命名要统一：如后端表为 nickname，前端需同步使用 nickname，与后端保持一致。
3. 表单校验：本例通过按钮 disabled 简单校验；如需更严谨可用 el-form 验证。
4. UI友好性：接口返回失败时应有明确提示。
5. 业务流畅性：配置成功后自动跳转房间，体验顺滑。
6. 默认值：性别默认'm'，如有头像/签名等字段，建议后端和前端补齐对应。

========================================= */
</script>
