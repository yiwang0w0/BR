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
        <p>当前位置：{{ mapName }} HP: {{ hp }}</p>
        <div class="mb-2">
          <el-select v-model="selectedMap" placeholder="选择目标地图" size="small" style="width: 200px;">
            <el-option v-for="m in maps" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-button class="ml-1" size="small" type="primary" @click="moveToMap">移动</el-button>
        </div>
        <div>
          <el-button v-if="currentTarget" size="small" type="danger" @click="attackCurrentTarget">攻击</el-button>
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
        <!-- 其他操作按钮待实现 -->
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
        <p v-for="(item, idx) in log" :key="idx">{{ item.msg || item }}</p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
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
const searchResult = ref(null)
const currentTarget = ref(null)

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
const currentMap = ref(0)
const mapName = computed(() => {
  const m = maps.find(m => m.id === currentMap.value)
  return m ? m.name : ''
})

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
      if (res.data.data.game && Array.isArray(res.data.data.game.log)) {
        log.value = log.value.concat(res.data.data.game.log)
      } else if (res.data.data.gamevars && Array.isArray(res.data.data.gamevars.log)) {
        log.value = log.value.concat(res.data.data.gamevars.log)
      }
      const me = await http.get('/user/me')
      if (me.data.code === 0) {
        uid.value = me.data.data.uid
        if (me.data.data.roomid != Number(roomId.value)) {
          const joinRes = await http.post(`/rooms/${roomId.value}/join`)
          if (joinRes.data.code !== 0) {
            ElMessage.error(joinRes.data.msg || '加入房间失败')
            return
          }
        }
        if (res.data.data.gamevars && res.data.data.gamevars.players && res.data.data.gamevars.players[uid.value]) {
          const p = res.data.data.gamevars.players[uid.value]
          hp.value = p.hp
          if (p.pos) {
            pos.value = p.pos
          }
          if (p.map !== undefined) {
            currentMap.value = p.map
          } else if (p.pos) {
            currentMap.value = p.pos[0]
          }
          if (Array.isArray(p.inventory)) {
            inventory.value = p.inventory
          }
        } else {
          ElMessage.warning('玩家未加入成功，请重新加入房间')
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

async function move(dx, dy) {
  const [x, y] = pos.value
  const nx = x + dx
  const ny = y + dy
  await sendAction('move', { x: nx, y: ny })

}

async function moveToMap() {
  if (selectedMap.value !== null) {
    await sendAction('move', { map: selectedMap.value })
    pos.value = [selectedMap.value, 0]
    currentMap.value = selectedMap.value
  }
}

async function useItem(item) {
  await sendAction('use_item', { item })
}

function attack(npcId) {
  sendAction('attack', { npcId })
}

function attackCurrentTarget() {
  if (!currentTarget.value) return
  if (currentTarget.value.type === 'npc') {
    attack(currentTarget.value.npc.id)
  } else if (currentTarget.value.type === 'player') {
    sendAction('attack', { playerId: currentTarget.value.player.id })
  }
  currentTarget.value = null
}

async function search() {
  const res = await sendAction('search')
  if (res && res.data.data && res.data.data.searchResult) {
    handleSearchResult(res.data.data.searchResult)
  }

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
        if (gameInfo.log && Array.isArray(gameInfo.log)) {
          log.value = log.value.concat(gameInfo.log)
        }
        if (gameInfo.players) {
          if (!uid.value) {
            const me = await http.get('/user/me')
            if (me.data.code === 0) uid.value = me.data.data.uid
          }
          const p = gameInfo.players[uid.value]
          if (p) {
            hp.value = p.hp
            pos.value = p.pos
            if (p.map !== undefined) {
              currentMap.value = p.map
            } else if (p.pos) {
              currentMap.value = p.pos[0]
            }
            if (Array.isArray(p.inventory)) {
              inventory.value = p.inventory
            }
          } else {
            ElMessage.warning('玩家未加入成功，请重新加入房间')
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
    return res
  } catch (e) {
    log.value.push('请求失败')
    return null
  }
}

function handleSearchResult(r) {
  if (!r) {
    currentTarget.value = null
    return
  }
  if (r.type === 'item') {
    currentTarget.value = null
    ElMessageBox.confirm(`发现 ${r.item.name}，是否拾取？`, '发现物品', {
      confirmButtonText: '拾取',
      cancelButtonText: '丢弃'
    }).then(async () => {
      const res = await sendAction('itemDecision', { decision: 'take' })
      if (res && res.data.code === 1 && res.data.msg === 'bagFull') {
        const idx = await ElMessageBox.prompt('背包已满，请输入替换的格子索引(0开始)', '背包满', {
          confirmButtonText: '确认',
          cancelButtonText: '取消'
        }).then(d => Number(d.value)).catch(() => null)
        if (idx !== null) {
          await sendAction('itemDecision', { decision: 'take', replaceIndex: idx })
        }
      }
    }).catch(() => {
      sendAction('itemDecision', { decision: 'drop' })
    })
  } else if (r.type === 'npc') {
    currentTarget.value = r
    const tip = r.playerFirst ? '遭遇 ' + r.npc.name + '，是否攻击？'
      : '被 ' + r.npc.name + ' 先制攻击，是否反击？'
    ElMessageBox.confirm(tip, '遭遇敌人', {
      confirmButtonText: '攻击',
      cancelButtonText: '离开'
    }).then(() => {
      attack(r.npc.id)
    })
  } else if (r.type === 'player') {
    currentTarget.value = r
    ElMessageBox.confirm(`遭遇玩家 ${r.player.name}，是否攻击？`, '遭遇玩家', {
      confirmButtonText: '攻击',
      cancelButtonText: '离开'
    }).then(() => {
      sendAction('attack', { playerId: r.player.id })
    })
  }
  else {
    currentTarget.value = null
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
      if (g.players[uid.value].map !== undefined) {
        currentMap.value = g.players[uid.value].map
      } else if (g.players[uid.value].pos) {
        currentMap.value = g.players[uid.value].pos[0]
      }
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
