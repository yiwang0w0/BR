<template>
  <el-card class="login-card">
    <h2>用户登录</h2>
    <!-- el-form 双向绑定 form，阻止默认提交行为 -->
    <el-form :model="form" @submit.prevent="onSubmit" label-width="80px">
      <el-form-item label="用户名">
        <!-- v-model 双向绑定用户名 -->
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="密码">
        <!-- 密码输入框，安全性更高 -->
        <el-input type="password" v-model="form.password" />
      </el-form-item>
      <el-form-item>
        <!-- 登录按钮，点击时触发 onSubmit -->
        <el-button type="primary" @click="onSubmit">登录</el-button>
        <!-- 注册按钮，跳转到注册页 -->
        <el-button type="success" @click="router.push('/register')" style="margin-left:10px">注册</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
// =========== 依赖导入 ===========
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'          // axios 封装实例，自动带token
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'   // Pinia 用户状态管理

// =========== 表单数据 ===========
const form = reactive({
  username: '',   // 用户名
  password: ''    // 密码
})
const router = useRouter()
const auth = useAuthStore()

// =========== 登录逻辑实现 ===========
// 1. 调用 /api/login 完成登录认证（建议加 /api 前缀以统一后端接口规范）
// 2. 登录成功后存储token，并跳转主页
// 3. 登录失败/网络异常有友好提示
async function onSubmit() {
  try {
    // -------- 注意1：推荐接口为 /api/login -------
    const res = await http.post('/api/login', form)
    if (res.data.code === 0) {
      // -------- 注意2：存储 accessToken/refreshToken -------
      auth.setTokens(res.data.accessToken, res.data.refreshToken)
      ElMessage.success('登录成功')
      router.push('/')  // 登录后跳转首页（可根据业务自定义）
    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
    console.error(e)
  }
}

/* =================== 重要注意事项 ===================
1. API路径建议统一加 /api 前缀，与AGENTS.md后端文档对齐
2. 登录表单建议增加前端校验（如用户名/密码不能为空，可用 el-form rules）
3. 登录成功后如需做“记住我”功能，建议扩展token存储逻辑
4. token字段建议后端返回 accessToken/refreshToken，避免命名混乱
5. 如需自定义跳转页，可按业务场景更改 router.push 路径
6. 所有异常建议都用 ElMessage 做弹窗提示，提升用户体验
===================================================== */
</script>

<style scoped>
.login-card {
  max-width: 400px;
  margin: 0 auto;
}
</style>
