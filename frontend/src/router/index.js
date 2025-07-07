import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import RoomList from '../views/RoomList.vue'

const routes = [
  { path: '/', component: Home },        // 首页
  { path: '/rooms', component: RoomList } // 房间大厅
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
