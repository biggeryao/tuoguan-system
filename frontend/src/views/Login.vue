<template>
  <div class="login-bg">
    <div class="login-box">
      <div class="header">
        <div class="logo">🏫</div>
        <div class="title">托管智能管理系统</div>
        <div class="subtitle">让教育管理更简单，更高效</div>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="loginForm" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            prefix-icon="el-icon-user">
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
            @keyup.enter.native="handleLogin">
          </el-input>
        </el-form-item>

        <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">立即登录</el-button>

        <div class="footer-text">
          默认管理员账号: admin
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
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
              localStorage.setItem('token', res.data.token)
              localStorage.setItem('role', res.data.role)
              localStorage.setItem('name', res.data.name)
              this.$message.success('欢迎回来')
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
.login-bg {
  height: 100vh;
  width: 100vw;
  /* 漂亮的蓝紫色渐变背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 400px;
  background: rgba(255, 255, 255, 0.95); /* 轻微透明 */
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.header { margin-bottom: 30px; }
.logo { font-size: 48px; margin-bottom: 10px; }
.title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
.subtitle { font-size: 14px; color: #909399; }

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-top: 10px;
}
.login-btn:hover { opacity: 0.9; }

.footer-text { margin-top: 20px; font-size: 12px; color: #ccc; }
</style>
