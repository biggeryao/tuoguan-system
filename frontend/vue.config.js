module.exports = {
  devServer: {
    port: 8080, // 前端运行在 8080
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 代理目标：你的后端地址
        changeOrigin: true
        // 解释：当你请求 /api/students 时，其实是请求 http://localhost:3000/api/students
      }
    }
  }
}
