<template>
  <div id="app">
    <!-- 1. 顶部导航栏 (固定在顶部) -->
    <div class="nav-container" v-if="$route.path !== '/login'">
      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
        router>

        <!-- Logo区 -->
        <el-menu-item index="/" class="brand-logo">
          🏫 榕易学少儿成长中心管理系统
        </el-menu-item>

        <el-menu-item index="/">
          <i class="el-icon-s-home"></i> 数据看板
        </el-menu-item>

        <el-menu-item index="/students">
          <i class="el-icon-user-solid"></i> 学生管理
        </el-menu-item>

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
        <div class="right-menu">
          <span class="welcome-text">
            {{ name }} ({{ role === 'admin' ? '管理员' : '老师' }})
          </span>
          <el-button type="danger" size="mini" round @click="logout" icon="el-icon-switch-button">退出</el-button>
        </div>
      </el-menu>
    </div>

    <!-- 2. 页面内容区域 (加了间距容器) -->
    <div class="main-container">
      <transition name="fade-transform" mode="out-in">
        <router-view/>
      </transition>
    </div>

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
      // 让导航栏高亮当前路由（解决刷新后高亮丢失问题）
      return this.$route.path
    }
  },
  watch: {
    $route () {
      this.role = localStorage.getItem('role')
      this.name = localStorage.getItem('name')
    }
  },
  methods: {
    logout () {
      this.$confirm('确定要退出登录吗?', '提示', { type: 'warning' }).then(() => {
        localStorage.clear()
        this.$router.push('/login')
        this.$message.success('已退出')
      })
    }
  }
}
</script>

<style>
/* === 全局重置样式 === */
body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5; /* 统一的浅灰背景 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === 导航栏样式优化 === */
.nav-container {
  position: sticky; /* 粘性定位，滑动时吸顶 */
  top: 0;
  z-index: 2000; /* 确保在最上层，防止被图表遮挡 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.15); /* 增加阴影立体感 */
}

.brand-logo {
  font-size: 18px !important;
  font-weight: bold;
  margin-right: 20px;
}

.right-menu {
  float: right;
  display: flex;
  align-items: center;
  height: 60px;
  padding-right: 20px;
  outline: none;
}

.welcome-text {
  color: #fff;
  font-size: 14px;
  margin-right: 15px;
  opacity: 0.9;
}

/* === 主内容区域优化 (解决间距问题) === */
.main-container {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 20px; /* 给所有页面四周留出 20px 间隙 */
  max-width: 1400px; /* 限制最大宽度，防止在大屏幕上拉得太长 */
  margin: 0 auto; /* 居中显示 */
}

/* === 页面切换动画 (可选，让切换更丝滑) === */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
