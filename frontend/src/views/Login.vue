<template>
  <div class="login-container">
    <el-card class="login-card">
      <div slot="header" class="login-header">
        <span>🏫 小学生托管系统</span>
      </div>
      <el-form :model="loginForm" :rules="rules" ref="loginForm">
        <el-form-item prop="username">
          <el-input
            prefix-icon="el-icon-user"
            v-model="loginForm.username"
            placeholder="账号"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            prefix-icon="el-icon-lock"
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>
        <el-button
          type="primary"
          style="width: 100%"
          :loading="loading"
          @click="handleLogin"
          >登 录</el-button
        >
      </el-form>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request' // 直接用 request 发请求

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Login',
  data () {
    return {
      loginForm: { username: '', password: '' },
      loading: false,
      rules: {
        username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
  methods: {
    handleLogin () {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          request.post('/users/login', this.loginForm).then(res => {
            if (res.code === 200) {
              // 1. 存 Token 和 角色
              localStorage.setItem('token', res.data.token)
              localStorage.setItem('role', res.data.role)
              localStorage.setItem('name', res.data.name)

              this.$message.success('登录成功')
              // 2. 跳转首页
              this.$router.push('/')
            } else {
              this.$message.error(res.msg)
            }
            this.loading = false
          }).catch(() => { this.loading = false })
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b; /* 深色背景 */
  background-image: linear-gradient(135deg, #2d3a4b 0%, #4b6cb7 100%);
}
.login-card {
  width: 400px;
}
.login-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
</style>
