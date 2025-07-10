<template>
  <el-card>
    <template #header>
      <span>管理游戏</span>
    </template>
    <div>
      <el-button type="primary" @click="startGame">开始新游戏</el-button>
      <div style="margin-top:20px;">
        <el-input v-model="endId" placeholder="房间ID" style="width:120px;margin-right:10px;" />
        <el-button type="danger" @click="endGame">强行结束房间</el-button>
      </div>
      <el-table :data="rooms" style="margin-top:20px;" border v-if="rooms.length">
        <el-table-column prop="groomid" label="房间ID" width="80" />
        <el-table-column prop="gamestate" label="状态" />
        <el-table-column prop="starttime" label="开始时间" />
        <el-table-column label="管理">
          <template #default="scope">
            <el-button size="small" @click="manageRoom(scope.row.groomid)">管理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedRoom" style="margin-top:20px;">
        <h3>房间 {{ selectedRoom }} 地图管理</h3>
        <el-select v-model="currentMap" placeholder="选择地图" style="width:120px;">
          <el-option v-for="(items,id) in mapsData.map" :key="id" :label="'地图'+id" :value="id" />
        </el-select>

        <div v-if="currentMap" style="margin-top:10px;">
          <h4>物品</h4>
          <el-table :data="mapsData.map[currentMap]" border>
            <el-table-column prop="name" label="名称" />
            <el-table-column width="80">
              <template #default="scope">
                <el-button size="small" type="danger" @click="removeItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mb-2" style="margin-top:5px;">
            <el-input v-model="newItem.name" placeholder="名称" style="width:120px; margin-right:5px;" />
            <el-input v-model="newItem.kind" placeholder="类型" style="width:80px; margin-right:5px;" />
            <el-input-number v-model="newItem.effect" :min="0" style="margin-right:5px;" />
            <el-input-number v-model="newItem.amount" :min="1" style="margin-right:5px;" />
            <el-button size="small" @click="addItem">添加</el-button>
          </div>

          <h4>NPC</h4>
          <el-table :data="mapsData.mapNpcs[currentMap]" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="名称" />
            <el-table-column width="80">
              <template #default="scope">
                <el-button size="small" type="danger" @click="removeNpc(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mb-2" style="margin-top:5px;">
            <el-input v-model="newNpc.name" placeholder="名称" style="width:120px; margin-right:5px;" />
            <el-input-number v-model="newNpc.hp" :min="1" style="margin-right:5px;" />
            <el-input-number v-model="newNpc.atk" :min="0" style="margin-right:5px;" />
            <el-button size="small" @click="addNpc">添加</el-button>
          </div>

          <h4>地图属性</h4>
          <div>
            <el-input v-model="weather" placeholder="天气" style="width:120px; margin-right:5px;" />
            <el-input v-model="newBlock" placeholder="禁区 x,y" style="width:120px; margin-right:5px;" />
            <el-button size="small" @click="addBlock">添加禁区</el-button>
            <div style="margin-top:5px;">
              <el-tag v-for="(b,i) in mapsData.mapProps[currentMap]?.blocked" :key="i" closable @close="removeBlock(i)" style="margin-right:5px;">
                {{ b[0] }},{{ b[1] }}
              </el-tag>
            </div>
            <el-button size="small" type="primary" style="margin-top:5px;" @click="saveProps">保存属性</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

const rooms = ref([])
const endId = ref('')
const selectedRoom = ref(0)
const mapsData = ref({ map: {}, mapNpcs: {}, mapProps: {} })
const currentMap = ref('')
const newItem = ref({ name: '', kind: '', effect: 0, amount: 1 })
const newNpc = ref({ name: '', hp: 10, atk: 1 })
const weather = ref('')
const newBlock = ref('')

async function fetchRooms() {
  const res = await http.get('/rooms')
  if (res.data.code === 0) rooms.value = res.data.data
}

async function startGame() {
  try {
    const res = await http.post('/admin/rooms/start')
    if (res.data.code === 0) {
      ElMessage.success('房间创建成功')
      fetchRooms()
    } else {
      ElMessage.error(res.data.msg || '创建失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

async function endGame() {
  if (!endId.value) {
    ElMessage.error('请输入房间ID')
    return
  }
  try {
    const res = await http.post(`/admin/rooms/${endId.value}/end`)
    if (res.data.code === 0) {
      ElMessage.success('房间已结束')
      fetchRooms()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

async function manageRoom(id) {
  selectedRoom.value = id
  const res = await http.get(`/admin/rooms/${id}/maps`)
  if (res.data.code === 0) {
    mapsData.value = res.data.data
    const first = Object.keys(mapsData.value.map)[0]
    currentMap.value = first
    updateWeather()
  } else {
    ElMessage.error(res.data.msg || '获取失败')
  }
}

function updateWeather() {
  if (mapsData.value.mapProps[currentMap.value]) {
    weather.value = mapsData.value.mapProps[currentMap.value].weather || ''
  } else {
    weather.value = ''
  }
}

async function addItem() {
  if (!selectedRoom.value || !currentMap.value) return
  const res = await http.post(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/items`, newItem.value)
  if (res.data.code === 0) {
    mapsData.value.map[currentMap.value] = res.data.data
    newItem.value = { name: '', kind: '', effect: 0, amount: 1 }
  }
}

async function removeItem(idx) {
  const res = await http.delete(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/items/${idx}`)
  if (res.data.code === 0) {
    mapsData.value.map[currentMap.value] = res.data.data
  }
}

async function addNpc() {
  if (!selectedRoom.value || !currentMap.value) return
  const res = await http.post(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/npcs`, newNpc.value)
  if (res.data.code === 0) {
    mapsData.value.mapNpcs[currentMap.value] = res.data.data
    newNpc.value = { name: '', hp: 10, atk: 1 }
  }
}

async function removeNpc(id) {
  const res = await http.delete(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/npcs/${id}`)
  if (res.data.code === 0) {
    mapsData.value.mapNpcs[currentMap.value] = res.data.data
  }
}

function addBlock() {
  if (!mapsData.value.mapProps[currentMap.value]) {
    mapsData.value.mapProps[currentMap.value] = { blocked: [], weather: '' }
  }
  const parts = newBlock.value.split(',')
  if (parts.length === 2) {
    const x = parseInt(parts[0])
    const y = parseInt(parts[1])
    if (!isNaN(x) && !isNaN(y)) {
      mapsData.value.mapProps[currentMap.value].blocked.push([x, y])
    }
  }
  newBlock.value = ''
}

function removeBlock(i) {
  mapsData.value.mapProps[currentMap.value].blocked.splice(i, 1)
}

async function saveProps() {
  const props = mapsData.value.mapProps[currentMap.value] || { blocked: [], weather: '' }
  props.weather = weather.value
  const res = await http.put(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/settings`, props)
  if (res.data.code === 0) {
    mapsData.value.mapProps[currentMap.value] = res.data.data
    updateWeather()
    ElMessage.success('已保存')
  }
}

watch(currentMap, updateWeather)

onMounted(fetchRooms)
</script>
