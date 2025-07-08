<template>
  <div>
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>
      <div v-if="user">
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="用户名">
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
        <p>胜场：{{ user.wingames }} / {{ user.validgames }} （胜率 {{ winRate }}）</p>
        <p>ELO：{{ user.elo_rating }}</p>
        <p>金币：{{ user.gold }}</p>
        <el-button v-if="user.groupid > 1" type="warning" @click="goManage">管理游戏</el-button>
      </div>
      <div v-else>请先登录。</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

const user = ref(null)
const editForm = reactive({
  username: '',
  motto: '',
  killmsg: '',
  lastword: '',
  gender: ''
})

const router = useRouter()

const winRate = computed(() => {
  if (!user.value) return '0%'
  const valid = user.value.validgames || 0
  return valid ? Math.round((user.value.wingames || 0) / valid * 100) + '%' : '0%'
})

async function fetchUser() {
  try {
    const res = await http.get('/user/me')
    if(res.data.code === 0){
      user.value = res.data.data
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

async function onSave() {
  try {
    const payload = { ...editForm }
    delete payload.username
    const res = await http.put('/user/me', payload)
    if(res.data.code === 0){
      ElMessage.success('更新成功')
      await fetchUser()
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch(e){
    ElMessage.error('网络错误')
    console.error(e)
  }
}

function goManage() {
  router.push('/manage-game')
}

onMounted(fetchUser)
</script>
