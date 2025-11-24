<template>
  <div id="app">
    <!-- 如果是登录页，不显示导航栏 -->
    <el-menu
      v-if="$route.path !== '/login'"
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      router
    >
      <el-menu-item index="/">
        <i class="el-icon-user-solid"></i> 学生管理
      </el-menu-item>

      <!-- 只有 admin 才能看到这两个菜单 -->
      <el-menu-item index="/finance" v-if="role === 'admin'">
        <i class="el-icon-s-data"></i> 财务记账
      </el-menu-item>

      <el-menu-item index="/teachers" v-if="role === 'admin'">
        <i class="el-icon-s-custom"></i> 教师薪资
      </el-menu-item>
      <el-menu-item index="/users" v-if="role === 'admin'">
        <i class="el-icon-setting"></i> 系统账号
      </el-menu-item>
      <!-- 右侧信息 -->
      <div
        style="
          float: right;
          display: flex;
          align-items: center;
          height: 60px;
          padding-right: 20px;
        "
      >
        <span style="color: white; margin-right: 15px">
          欢迎, {{ name }} ({{ role === "admin" ? "管理员" : "老师" }})
        </span>
        <el-button type="danger" size="mini" @click="logout">退出</el-button>
      </div>
    </el-menu>

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      role: localStorage.getItem('role') || 'teacher',
      name: localStorage.getItem('name') || '用户'
    }
  },
  computed: {
    activeIndex () {
      return this.$route.path
    }
  },
  watch: {
    // 监听路由变化，更新用户信息（防止登录后名字不刷新的问题）
    $route () {
      this.role = localStorage.getItem('role')
      this.name = localStorage.getItem('name')
    }
  },
  methods: {
    logout () {
      localStorage.clear() // 清空 Token
      this.$router.push('/login') // 跳回登录
      this.$message.success('已退出')
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}
</style>
