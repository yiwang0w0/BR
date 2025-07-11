<template>
  <el-card class="login-card">
    <h2>用户注册</h2>
    <!-- el-form 绑定 form，阻止默认提交，label宽度80px -->
    <el-form :model="form" @submit.prevent="onSubmit" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="form.password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">注册</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
// ========== 依赖导入 ==========
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

// ========== 响应式表单 ==========
const form = reactive({
  username: '', // 用户名字段，需和后端接口一致
  password: ''  // 密码字段，需和后端接口一致
})
const router = useRouter()

// ========== 注册逻辑实现 ==========
/**
 * 1. 调用 /api/register 完成注册（推荐加 /api 前缀与后端一致）
 * 2. 注册成功跳转到登录页
 * 3. 注册失败或网络异常友好提示
 */
async function onSubmit() {
  try {
    // ------- 注意1：推荐接口为 /api/register -------
    const res = await http.post('/api/register', form)
    if (res.data.code === 0) {
      ElMessage.success('注册成功')
      router.push('/login') // 注册后跳转到登录页
    } else {
      ElMessage.error(res.data.msg || '注册失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
    console.error(e)
  }
}

/* ============== 重要注意事项 ==============
1. API路径建议统一加 /api 前缀（/api/register），与AGENTS.md后端文档一致
2. 用户名/密码字段名需与后端接口保持一致，常用 username/password
3. 注册表单可加前端校验（如用户名/密码不能为空、密码强度等）
4. 后端应校验用户名唯一性，前端可对已存在用户友好提示
5. 网络/接口异常统一用 ElMessage 做弹窗反馈
6. 如有扩展（如验证码、邮箱等），可按需增减表单项
============================================ */
</script>

<style scoped>
.login-card {
  max-width: 400px;
  margin: 0 auto;
}
</style>
