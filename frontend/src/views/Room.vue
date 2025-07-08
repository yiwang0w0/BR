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
        <div>
          <el-button size="small" @click="move(0, -1)">↑</el-button>
          <el-button size="small" @click="move(-1, 0)">←</el-button>
          <el-button size="small" @click="move(1, 0)">→</el-button>
          <el-button size="small" @click="move(0, 1)">↓</el-button>
          <el-button size="small" type="danger" @click="attack">攻击</el-button>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../utils/http'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id

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

onMounted(async () => {
  if (!roomId) {
    const res = await http.get('/rooms')
    if (res.data.code === 0) {
      rooms.value = res.data.data
    }
  } else {
    const res = await http.get(`/game/${roomId}`)
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
    }
  }
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
  pos.value = [nx, ny]
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
function attack() { sendAction('attack') }

async function sendChat() {
  if (!chatText.value) return
  chatLog.value.push(chatText.value)
  await sendAction('chat', { text: chatText.value })
  chatText.value = ''
}

function toggleChat() { chatVisible.value = !chatVisible.value }

async function sendAction(type, params = {}) {
  try {
    const res = await http.post(`/game/${roomId}/action`, { type, params })
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
</script>

<style scoped>
.mt-2 { margin-top: 20px; }
</style>
