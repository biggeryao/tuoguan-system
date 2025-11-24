import Vue from 'vue'
import VueRouter from 'vue-router'
import StudentList from '@/views/StudentList.vue'
import FinanceList from '@/views/FinanceList.vue'
import TeacherList from '@/views/TeacherList.vue'
import Login from '@/views/Login.vue' // <--- 引入登录页

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    hidden: true // 自定义属性，用于菜单循环时隐藏
  },
  {
    path: '/',
    name: 'StudentList',
    component: StudentList,
    meta: { title: '学生管理', roles: ['admin', 'teacher'] } // <--- 所有人都能看
  },
  {
    path: '/finance',
    name: 'FinanceList',
    component: FinanceList,
    meta: { title: '财务记账', roles: ['admin'] } // <--- 只有 admin 能看
  },
  {
    path: '/teachers',
    name: 'TeacherList',
    component: TeacherList,
    meta: { title: '教师薪资', roles: ['admin'] } // <--- 只有 admin 能看
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('@/views/UserList.vue'),
    meta: { title: '系统设置', roles: ['admin'] } // 只有 admin 能进
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// === 👮‍♂️ 路由守卫：查岗 ===
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (to.path === '/login') {
    next() // 去登录页，放行
  } else {
    if (!token) {
      next('/login') // 没 Token，踢回登录页
    } else {
      // 检查权限
      if (to.meta.roles && !to.meta.roles.includes(userRole)) {
        Vue.prototype.$message.error('无权访问该页面')
        next('/') // 没权限，踢回首页
      } else {
        next() // 有 Token 且有权限，放行
      }
    }
  }
})

export default router
