import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Room from '../views/Room.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserProfile from '../views/UserProfile.vue'
import Messages from '../views/Messages.vue'
import History from '../views/History.vue'
import GameConfig from '../views/GameConfig.vue'

const routes = [
  { path: '/', component: Home },                       // 首页
  { path: '/login', component: Login },                 // 登录
  { path: '/register', component: Register },           // 注册
  { path: '/rooms', component: Room },                  // 房间大厅/游戏入口
  { path: '/room/:id', component: Room },               // 游戏房间
  { path: '/game-config/:id', component: GameConfig },  // 游戏配置
  { path: '/user', component: UserProfile },            // 个人信息
  { path: '/messages', component: Messages },           // 消息系统
  { path: '/history', component: History }              // 历史对局
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
