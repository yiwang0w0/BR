import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import http from './utils/http'
import { createPinia } from 'pinia'

const token = localStorage.getItem('token')
if (token) {
  http.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
