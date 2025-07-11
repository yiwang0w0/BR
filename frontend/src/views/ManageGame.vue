<template>
  <el-card>
    <template #header>
      <span>管理游戏</span>
    </template>
    <div>
      <!-- 开始新游戏按钮 -->
      <el-button type="primary" @click="startGame">开始新游戏</el-button>
      <!-- 强制结束房间 -->
      <div style="margin-top:20px;">
        <el-input v-model="endId" placeholder="房间ID" style="width:120px;margin-right:10px;" />
        <el-button type="danger" @click="endGame">强行结束房间</el-button>
      </div>
      <!-- 房间列表 -->
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

      <!-- 选中房间的地图与NPC管理面板 -->
      <div v-if="selectedRoom" style="margin-top:20px;">
        <h3>房间 {{ selectedRoom }} 地图管理</h3>
        <!-- 地图选择器 -->
        <el-select v-model="currentMap" placeholder="选择地图" style="width:120px;">
          <el-option v-for="m in mapList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>

        <!-- 物品管理 -->
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
            <!-- 物品新增表单，字段需与后端接口结构对应 -->
            <el-input v-model="newItem.name" placeholder="名称" style="width:120px; margin-right:5px;" />
            <el-input v-model="newItem.kind" placeholder="类型" style="width:80px; margin-right:5px;" />
            <el-input-number v-model="newItem.effect" :min="0" style="margin-right:5px;" />
            <el-input-number v-model="newItem.amount" :min="1" style="margin-right:5px;" />
            <el-button size="small" @click="addItem">添加</el-button>
          </div>

          <!-- NPC管理 -->
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
            <!-- NPC新增表单，字段需与后端接口结构对应 -->
            <el-input v-model="newNpc.name" placeholder="名称" style="width:120px; margin-right:5px;" />
            <el-input-number v-model="newNpc.hp" :min="1" style="margin-right:5px;" />
            <el-input-number v-model="newNpc.atk" :min="0" style="margin-right:5px;" />
            <el-button size="small" @click="addNpc">添加</el-button>
          </div>

          <!-- 地图属性管理（如天气和禁区） -->
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
// ======================== 依赖 & 状态声明 ========================
import { ref, onMounted, watch } from 'vue'
import http from '../utils/http'
import { ElMessage } from 'element-plus'

// 房间相关
const rooms = ref([])          // 房间列表
const endId = ref('')          // 结束房间ID
const selectedRoom = ref(0)    // 当前选中房间

// 地图与物品、NPC、属性相关
const mapsData = ref({ map: {}, mapNpcs: {}, mapProps: {} })  // 后端返回的当前房间各地图内容
const mapList = ref([])        // 地图选择列表
const currentMap = ref('')     // 当前选中地图

// 物品/NPC新增表单
const newItem = ref({ name: '', kind: '', effect: 0, amount: 1 })
const newNpc = ref({ name: '', hp: 10, atk: 1 })

// 天气与禁区
const weather = ref('')
const newBlock = ref('')

// ========== 房间与地图数据获取 ==========
// 拉取所有可用地图（一般由后端维护，id-name结构）
async function fetchMaps() {
  const res = await http.get('/maps')
  if (res.data.code === 0) {
    mapList.value = res.data.data
  }
}

// 拉取所有房间（后端 /rooms 接口，含状态等）
async function fetchRooms() {
  const res = await http.get('/rooms')
  if (res.data.code === 0) rooms.value = res.data.data
}

// ========== 房间创建、结束 ==========
// 管理员点击“开始新游戏”，后台创建房间
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

// 强制结束某个房间
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

// 选中房间后，拉取该房间各地图数据
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

// 更新当前地图天气（用于初始赋值/切换地图时同步）
function updateWeather() {
  if (mapsData.value.mapProps[currentMap.value]) {
    weather.value = mapsData.value.mapProps[currentMap.value].weather || ''
  } else {
    weather.value = ''
  }
}

// ========== 物品/NPC/禁区 增删改 ==========
// 添加物品
async function addItem() {
  if (!selectedRoom.value || !currentMap.value) return
  const res = await http.post(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/items`, newItem.value)
  if (res.data.code === 0) {
    mapsData.value.map[currentMap.value] = res.data.data
    newItem.value = { name: '', kind: '', effect: 0, amount: 1 }
  }
}

// 删除物品
async function removeItem(idx) {
  const res = await http.delete(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/items/${idx}`)
  if (res.data.code === 0) {
    mapsData.value.map[currentMap.value] = res.data.data
  }
}

// 添加NPC
async function addNpc() {
  if (!selectedRoom.value || !currentMap.value) return
  const res = await http.post(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/npcs`, newNpc.value)
  if (res.data.code === 0) {
    mapsData.value.mapNpcs[currentMap.value] = res.data.data
    newNpc.value = { name: '', hp: 10, atk: 1 }
  }
}

// 删除NPC
async function removeNpc(id) {
  const res = await http.delete(`/admin/rooms/${selectedRoom.value}/maps/${currentMap.value}/npcs/${id}`)
  if (res.data.code === 0) {
    mapsData.value.mapNpcs[currentMap.value] = res.data.data
  }
}

// 添加禁区（格式要求 x,y），会同步到 mapsData.mapProps
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

// 删除禁区
function removeBlock(i) {
  mapsData.value.mapProps[currentMap.value].blocked.splice(i, 1)
}

// 保存当前地图属性（天气、禁区）
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

// ========== 监听与初始化 ==========
// 切换地图时自动同步天气
watch(currentMap, updateWeather)
// 页面加载时拉取地图与房间
onMounted(() => {
  fetchMaps()
  fetchRooms()
})

/* =================== 重要注意事项 ===================
1. 管理后台接口建议统一加 /admin 前缀，并鉴权（防止越权操作）。
2. 物品/NPC字段需和后端结构对齐，如 name/kind/effect/amount；NPC有 id/name/hp/atk。
3. 禁区为坐标数组，格式务必保证前端后端一致（如[ [1,2], [2,3] ]）。
4. 所有操作建议加异常与成功提示，提升体验。
5. 保存地图属性前建议校验（如天气、禁区格式）。
6. 数据操作后应及时同步 UI 与后台数据，避免“脏数据”。
7. 不同后端实现可能返回字段名略有差异，建议接口对齐后端实际返回。
==================================================== */
</script>
