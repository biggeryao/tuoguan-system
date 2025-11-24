<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      router> <!-- 开启 router 模式，index 就是跳转路径 -->

      <el-menu-item index="/">
        <i class="el-icon-user-solid"></i> 学生管理
      </el-menu-item>

      <el-menu-item index="/finance">
        <i class="el-icon-s-data"></i> 财务记账
      </el-menu-item>
      <el-menu-item index="/teacher">
        <i class="el-icon-s-data"></i> 教师管理
      </el-menu-item>
      <el-menu-item style="float: right">
        小学生托管系统 v1.0
      </el-menu-item>
    </el-menu>

    <!-- 页面内容在这里显示 -->
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    // 让导航栏高亮当前选中的页面
    activeIndex () {
      return this.$route.path
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5; /* 给背景加个灰色，好看点 */
}
</style>
