import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../utils/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const isLoggedIn = () => !!token.value

  function setTokens(at, rt) {
    token.value = at
    refreshToken.value = rt
    localStorage.setItem('token', at)
    if (rt) localStorage.setItem('refreshToken', rt)
    http.defaults.headers.common['Authorization'] = `Bearer ${at}`
  }

  function logout() {
    if (refreshToken.value) {
      http.post('/logout', { refreshToken: refreshToken.value }).catch(() => {})
    }
    token.value = ''
    refreshToken.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete http.defaults.headers.common['Authorization']
  }

  return { token, refreshToken, isLoggedIn, setTokens, logout }
})
