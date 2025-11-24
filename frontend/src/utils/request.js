// src/utils/request.js
import axios from 'axios'
import { Message } from 'element-ui'

// 1. 创建 axios 实例
const service = axios.create({
  // 这里配置 baseURL: '/api'，意味着以后所有请求都会自动加上 /api 前缀
  // 从而触发 vue.config.js 里的代理，转发到后端 3000 端口
  baseURL: '/api',
  timeout: 5000 // 请求超时时间 5秒
})

// 2. 响应拦截器 (Response Interceptor)
// 就像包裹快递一样，后端返回的数据包了一层壳，我们在这里把它剥开
service.interceptors.response.use(
  response => {
    const res = response.data

    // 如果后端返回的 code 不是 200，说明出错了
    if (res.code !== 200) {
      Message({
        message: res.msg || '系统错误',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      // 只有 code 是 200，才把真正的数据吐给页面
      return res
    }
  },
  error => {
    console.log('err' + error)
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
