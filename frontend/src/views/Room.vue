<template>
  <div>
    <!-- Room list -->
    <div v-if="!roomId">
      <el-card>
        <template #header>
          <span>房间大厅</span>
        </template>
        <el-table :data="rooms" stripe style="width: 100%">
          <el-table-column prop="groomid" label="房间号" width="100" />
          <el-table-column prop="gamenum" label="游戏编号" />
          <el-table-column prop="gametype" label="类型" />
          <el-table-column prop="gamestate" label="状态" />
          <el-table-column prop="validnum" label="总人数" />
          <el-table-column prop="alivenum" label="存活" />
          <el-table-column prop="deathnum" label="死亡" />
          <el-table-column label="开始倒计时">
            <template #default="scope">
              {{ countdown(scope.row.starttime) }}
            </template>
          </el-table-column>
          <el-table-column>
            <template #default="scope">
              <el-button size="small" type="primary" @click="enterRoom(scope.row.groomid)">进入</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Game room -->
    <div v-else>
      <h2>游戏房间 {{ roomId }}</h2>
      <el-card v-if="room">
        <p>房间号：{{ room.groomid }}</p>
        <p>类型：{{ room.gametype }}</p>
        <p>状态：{{ room.gamestate }}</p>
        <p>人数：{{ room.alivenum }} / {{ room.validnum }}</p>
      </el-card>
      <p v-else>加载中...</p>

      <div v-if="room" class="actions" style="margin-top: 1rem;">
        <p>当前位置：{{ pos[0] }}, {{ pos[1] }} HP: {{ hp }}</p>
        <div class="mb-2">
          <el-select v-model="selectedMap" placeholder="选择目标地图" size="small" style="width: 200px;">
            <el-option v-for="m in maps" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-button class="ml-1" size="small" type="primary" @click="moveToMap">移动</el-button>
        </div>
        <div>
          <el-button size="small" type="danger" @click="attack">攻击</el-button>
          <el-button size="small" type="primary" @click="search">搜索</el-button>
        </div>
      </div>

      <el-card class="mt-2">
        <h3>物品栏</h3>
        <el-table :data="inventory" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column>
            <template #default="scope">
              <el-button size="small" @click="useItem(scope.row)">使用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-2">
          <el-button size="small" @click="combine">道具合成</el-button>
          <el-button size="small" @click="sortBag">整理包裹</el-button>
          <el-button size="small" @click="dropItem">道具丢弃</el-button>
          <el-button size="small" @click="toggleWeaponMode">武器模式</el-button>
          <el-button size="small" @click="showBagInfo">背包信息</el-button>
          <el-button size="small" @click="sleep">睡眠</el-button>
          <el-button size="small" @click="heal">治疗</el-button>
          <el-button size="small" @click="openShop">商店</el-button>
          <el-button size="small" @click="showSkills">技能表</el-button>
        </div>
      </el-card>

      <el-card class="mt-2">
        <h3>聊天</h3>
        <div>
          <el-input v-model="chatText" placeholder="说点什么..." size="small" style="width:70%" />
          <el-button size="small" @click="sendChat">发送</el-button>
          <el-button size="small" @click="toggleChat">{{ chatVisible ? '隐藏' : '显示' }}聊天</el-button>
        </div>
        <div v-if="chatVisible" class="chat-log" style="margin-top:10px;">
          <p v-for="(c, idx) in chatLog" :key="idx">{{ c }}</p>
        </div>
      </el-card>

      <el-card v-if="log.length" class="mt-2">
        <p v-for="(item, idx) in log" :key="idx">{{ item }}</p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import ws from '../utils/ws'
import { useRoute, useRouter } from 'vue-router'
import http from '../utils/http'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)

const rooms = ref([])
const room = ref(null)
const pos = ref([0, 0])
const hp = ref(0)
const log = ref([])
const inventory = ref([])
const chatText = ref('')
const chatLog = ref([])
const chatVisible = ref(true)
const uid = ref(null)
const auth = useAuthStore()

const maps = [
  { id: 0, name: '无月之影' },
  { id: 1, name: '端点' },
  { id: 2, name: 'RF高校' },
  { id: 3, name: '雪之镇' },
  { id: 4, name: '索拉利斯' },
  { id: 5, name: '指挥中心' },
  { id: 6, name: '梦幻馆' },
  { id: 7, name: '清水池' },
  { id: 8, name: '白穗神社' },
  { id: 9, name: '墓地' },
  { id: 10, name: '麦斯克林' },
  { id: 11, name: '对天使用作战本部' },
  { id: 12, name: '夏之镇' },
  { id: 13, name: '三体星' },
  { id: 14, name: '光坂高校' },
  { id: 15, name: '守矢神社' },
  { id: 16, name: '常磐森林' },
  { id: 17, name: '常磐台中学' },
  { id: 18, name: '秋之镇' },
  { id: 19, name: '精灵中心' },
  { id: 20, name: '春之镇' },
  { id: 21, name: '圣Gradius学园' },
  { id: 22, name: '初始之树' },
  { id: 23, name: '幻想世界' },
  { id: 24, name: '永恒的世界' },
  { id: 25, name: '妖精驿站' },
  { id: 26, name: '冰封墓场' },
  { id: 27, name: '花菱商厦' },
  { id: 28, name: 'FARGO前基地' },
  { id: 29, name: '风祭森林' },
  { id: 30, name: '天使队移动格纳库' },
  { id: 31, name: '和田町研究所' },
  { id: 32, name: 'ＳＣＰ研究设施' },
  { id: 33, name: '雏菊之丘' },
  { id: 34, name: '英灵殿' },
]
const selectedMap = ref(null)

async function loadData() {
  ws.connect(auth.token)
  if (!roomId.value) {
    const res = await http.get('/rooms')
    if (res.data.code === 0) {
      rooms.value = res.data.data
    }
  } else {
    const res = await http.get(`/game/${roomId.value}`)
    if (res.data.code === 0) {
      room.value = res.data.data
      if (res.data.data.inventory) inventory.value = res.data.data.inventory
      const me = await http.get('/user/me')
      if (me.data.code === 0) {
        uid.value = me.data.data.uid
        if (res.data.data.gamevars && res.data.data.gamevars.players && res.data.data.gamevars.players[uid.value]) {
          hp.value = res.data.data.gamevars.players[uid.value].hp
          if (res.data.data.gamevars.players[uid.value].pos) {
            pos.value = res.data.data.gamevars.players[uid.value].pos
          }
        }
      }
      ws.joinRoom(roomId.value, { uid: uid.value })
      ws.onMessage(handleMessage)
    }
  }
}

onMounted(loadData)
watch(roomId, () => {
  room.value = null
  rooms.value = []
  loadData()
})

onUnmounted(() => {
  if (roomId.value) ws.leaveRoom(roomId.value, { uid: uid.value })
})

function countdown(ts) {
  const diff = ts - Math.floor(Date.now() / 1000)
  if (diff <= 0) return '已开始'
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${m}分${s}秒`
}

function enterRoom(id) {
  router.push(`/room/${id}`)
}

async function moveToMap() {
  if (selectedMap.value === null) {
    log.value.push('请选择目标地图')
    return
  }
  await sendAction('move', { map: selectedMap.value })
}

async function useItem(item) {
  await sendAction('use_item', { item })
}

function combine() { sendAction('combine') }
function sortBag() { sendAction('sort_bag') }
function dropItem() { sendAction('drop_item') }
function toggleWeaponMode() { sendAction('weapon_mode') }
function showBagInfo() { sendAction('bag_info') }
function sleep() { sendAction('sleep') }
function heal() { sendAction('heal') }
function openShop() { sendAction('shop') }
function showSkills() { sendAction('skills') }
async function attack() {
  await sendAction('attack')
}

async function search() {
  await sendAction('search')
}

async function sendChat() {
  if (!chatText.value) return
  ws.sendChat(roomId.value, chatText.value)
  chatLog.value.push(chatText.value)
  chatText.value = ''
}

function toggleChat() { chatVisible.value = !chatVisible.value }

async function sendAction(type, params = {}) {
  try {
    const res = await http.post(`/game/${roomId.value}/action`, { type, params })
    if (res.data.code !== 0) {
      log.value.push(`操作失败: ${res.data.msg}`)
    } else {
      log.value.push(`${type} 操作成功`)
      if (res.data.data) {
        const gameInfo = res.data.data.game || res.data.data
        if (gameInfo.players) {
          if (!uid.value) {
            const me = await http.get('/user/me')
            if (me.data.code === 0) uid.value = me.data.data.uid
          }
          const p = gameInfo.players[uid.value]
          if (p) {
            hp.value = p.hp
            pos.value = p.pos
          }
        }
        if (res.data.data.gameover) {
          alert(res.data.data.gameover === 'win' ? '胜利！' : '你死了')
        }
        if (gameInfo.inventory) {
          inventory.value = gameInfo.inventory
        }
      }
    }
  } catch (e) {
    log.value.push('请求失败')
  }
}

function handleMessage(msg) {
  if (msg.type === 'chat_message') {
    chatLog.value.push(`${msg.payload.user || '玩家'}: ${msg.payload.text}`)
  } else if (msg.type === 'room_update') {
    const g = msg.payload.game
    if (g && uid.value && g.players && g.players[uid.value]) {
      hp.value = g.players[uid.value].hp
      pos.value = g.players[uid.value].pos || pos.value
    }
  } else if (msg.type === 'player_join') {
    log.value.push(`${msg.payload.username || msg.payload.uid} 加入房间`)
  } else if (msg.type === 'player_leave') {
    log.value.push(`${msg.payload.username || msg.payload.uid} 离开房间`)
  } else if (msg.type === 'battle_result') {
    alert(msg.payload.result === 'win' ? '胜利！' : '你死了')
  }
}
</script>

<style scoped>
.mt-2 { margin-top: 20px; }
.mb-2 { margin-bottom: 10px; }
.ml-1 { margin-left: 5px; }
</style>
