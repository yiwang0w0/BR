<template>
  <div>
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>
      <div v-if="user">
        <!-- 个人信息编辑表单 -->
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="用户名">
            <!-- 用户名只读，不能更改 -->
            <el-input v-model="editForm.username" disabled />
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="editForm.gender" placeholder="请选择">
              <el-option label="保密" value="0" />
              <el-option label="男" value="M" />
              <el-option label="女" value="F" />
            </el-select>
          </el-form-item>
          <el-form-item label="格言">
            <el-input v-model="editForm.motto" />
          </el-form-item>
          <el-form-item label="击杀宣言">
            <el-input v-model="editForm.killmsg" />
          </el-form-item>
          <el-form-item label="遗言">
            <el-input v-model="editForm.lastword" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSave">保存</el-button>
          </el-form-item>
        </el-form>
        <!-- 个人统计与权限功能 -->
        <p>胜场：{{ user.wingames }} / {{ user.validgames }} （胜率 {{ winRate }}）</p>
        <p>ELO：{{ user.elo_rating }}</p>
        <p>金币：{{ user.gold }}</p>
        <!-- 管理员显示管理入口，groupid>1视为管理权限 -->
        <el-button v-if="user.groupid > 1" type="warning" @click="goManage">管理游戏</el-button>
      </div>
      <div v-else>请先登录。</div>
    </el-card>
  </div>
</template>

<script setup>
// ========== 依赖导入 ==========
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

// ========== 状态与表单 ==========
const user = ref(null) // 当前用户信息
const editForm = reactive({
  username: '',  // 用户名（只读）
  motto: '',     // 格言
  killmsg: '',   // 击杀宣言
  lastword: '',  // 遗言
  gender: ''     // 性别
})

const router = useRouter()

// 计算胜率，自动百分比
const winRate = computed(() => {
  if (!user.value) return '0%'
  const valid = user.value.validgames || 0
  return valid ? Math.round((user.value.wingames || 0) / valid * 100) + '%' : '0%'
})

// ========== 拉取用户信息 ==========
async function fetchUser() {
  try {
    // -------- 推荐接口 /api/user/me --------
    const res = await http.get('/api/user/me')
    if(res.data.code === 0){
      user.value = res.data.data
      // 用用户数据初始化表单
      Object.assign(editForm, {
        username: res.data.data.username,
        motto: res.data.data.motto,
        killmsg: res.data.data.killmsg,
        lastword: res.data.data.lastword,
        gender: res.data.data.gender
      })
    } else {
      ElMessage.error(res.data.msg || '获取失败')
    }
  } catch(e){
    ElMessage.error('网络错误')
    console.error(e)
  }
}

// ========== 保存修改 ==========
async function onSave() {
  try {
    // 发送 PUT /api/user/me，更新可编辑信息
    const payload = { ...editForm }
    delete payload.username // 用户名不可改，防止误传
    const res = await http.put('/api/user/me', payload)
    if(res.data.code === 0){
      ElMessage.success('更新成功')
      await fetchUser() // 保存后刷新
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch(e){
    ElMessage.error('网络错误')
    console.error(e)
  }
}

// ========== 管理入口跳转 ==========
function goManage() {
  router.push('/manage-game')
}

// ========== 页面加载时自动拉取个人信息 ==========
onMounted(fetchUser)

/* =================== 重要注意事项 ===================
1. 推荐API路径为 /api/user/me，和AGENTS.md文档一致。
2. 字段名需和后端表结构一致，如 username、gender、motto、killmsg、lastword。
3. 性别建议后端用 'M'/'F'/'0'(保密)，表单选项与后端保持同步。
4. 用户名只读，前端不传username更新，防止越权。
5. groupid>1为管理用户，可扩展权限管理功能。
6. 成功/失败/网络异常统一用ElMessage反馈。
7. 表单建议可扩展校验（如长度限制、脏检查等）。
===================================================== */
</script>
