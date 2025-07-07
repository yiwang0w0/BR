import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import RoomList from '../views/RoomList.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserProfile from '../views/UserProfile.vue'
import Messages from '../views/Messages.vue'
import History from '../views/History.vue'
import GameRoom from '../views/GameRoom.vue'

const routes = [
  { path: '/', component: Home },               // 首页
  { path: '/login', component: Login },         // 登录
  { path: '/register', component: Register },   // 注册
  { path: '/rooms', component: RoomList },      // 房间大厅
  { path: '/user', component: UserProfile },    // 个人信息
  { path: '/messages', component: Messages },   // 消息系统
  { path: '/history', component: History },     // 历史对局
  { path: '/game/:id', component: GameRoom }    // 游戏房间
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
