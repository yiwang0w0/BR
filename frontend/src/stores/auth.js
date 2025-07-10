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

  async function refresh() {
    if (!refreshToken.value) return false
    try {
      const res = await http.post('/refresh', { refreshToken: refreshToken.value })
      if (res.data.code === 0) {
        setTokens(res.data.accessToken, res.data.refreshToken)
        return true
      }
    } catch (e) {
      // ignore
    }
    logout()
    return false
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

  return { token, refreshToken, isLoggedIn, setTokens, refresh, logout }
})
