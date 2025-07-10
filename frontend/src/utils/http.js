import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const http = axios.create({
  baseURL: '/api'
})

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

http.interceptors.response.use(
  response => response,
  async error => {
    const auth = useAuthStore()
    const config = error.config
    if (error.response && error.response.status === 401 && !config._retry) {
      config._retry = true
      const ok = await auth.refresh()
      if (ok) {
        config.headers.Authorization = `Bearer ${auth.token}`
        return http(config)
      }
    }
    console.error('HTTP error', error)
    return Promise.reject(error)
  }
)

export default http
