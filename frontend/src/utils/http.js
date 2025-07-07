import axios from 'axios'

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
  error => {
    console.error('HTTP error', error)
    return Promise.reject(error)
  }
)

export default http
