// frontend/src/utils/request.js
import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router' // 引入路由，用于强制跳转登录

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || '/api', // 这里的 /api 会触发 vue.config.js 的代理
  timeout: 5000 // 请求超时时间
})

// ==========================================
// 1. 请求拦截器 (Request Interceptor)
// 作用：在请求发出去之前，自动把 Token 塞到 Header 里
// ==========================================
service.interceptors.request.use(
  config => {
    // 从浏览器缓存获取 Token
    const token = localStorage.getItem('token')

    // 如果有 Token，就加到请求头里
    if (token) {
      // 注意：格式通常是 'Bearer ' + token (中间有个空格)
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// ==========================================
// 2. 响应拦截器 (Response Interceptor)
// 作用：如果后端返回 401 (Token失效)，强制踢回登录页
// ==========================================
service.interceptors.response.use(
  response => {
    const res = response.data
    // 这里假设后端返回的 code 不是 200 就是错误，视你后端的逻辑而定
    // 如果后端直接返回 JSON 数据，不需要判断 res.code !== 200，直接 return res
    return res
  },
  error => {
    console.log('err' + error) // for debug

    // 如果后端返回 401 (未登录/Token过期)
    if (error.response && error.response.status === 401) {
      Message({
        message: '登录状态已过期，请重新登录',
        type: 'error',
        duration: 3 * 1000
      })
      // 清除本地缓存
      localStorage.clear()
      // 强制跳转到登录页
      router.push('/login')
    } else {
      Message({
        message: error.message || '请求失败',
        type: 'error',
        duration: 5 * 1000
      })
    }
    return Promise.reject(error)
  }
)

export default service
