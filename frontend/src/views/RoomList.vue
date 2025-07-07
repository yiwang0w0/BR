<template>
  <div>
    <el-card>
      <template #header>
        <span>房间大厅</span>
        <el-button type="primary" class="create-btn" @click="dialogVisible=true">创建房间</el-button>
      </template>
      <el-table :data="rooms" stripe style="width: 100%">
        <el-table-column prop="groomid" label="房间号" width="100"/>
        <el-table-column prop="gamenum" label="游戏编号"/>
        <el-table-column prop="gametype" label="类型"/>
        <el-table-column prop="gamestate" label="状态"/>
        <el-table-column prop="validnum" label="总人数"/>
        <el-table-column prop="alivenum" label="存活"/>
        <el-table-column prop="deathnum" label="死亡"/>
        <el-table-column>
          <template #default="scope">
            <el-button size="small" type="primary" @click="enterRoom(scope.row.groomid)">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建房间">
      <el-form :model="form">
        <el-form-item label="类型">
          <el-input v-model="form.gametype" />
        </el-form-item>
        <el-form-item label="人数">
          <el-input v-model="form.validnum" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="createRoom">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

const rooms = ref([])
const dialogVisible = ref(false)
const form = ref({ gametype: 1, validnum: 10 })
const router = useRouter()

onMounted(async () => {
  const res = await http.get('/rooms')
  if(res.data.code === 0){
    rooms.value = res.data.data
  }
})

async function createRoom() {
  const res = await http.post('/rooms', form.value)
  if (res.data.code === 0) {
    ElMessage.success('房间创建成功')
    dialogVisible.value = false
    // 刷新房间列表
    const list = await http.get('/rooms')
    if (list.data.code === 0) {
      rooms.value = list.data.data
    }
  } else {
    ElMessage.error(res.data.msg || '创建失败')
  }
}

function enterRoom(id) {
  router.push(`/game/${id}`)
}
</script>
