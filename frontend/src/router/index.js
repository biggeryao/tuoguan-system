import Vue from 'vue'
import VueRouter from 'vue-router'
// 引入我们的新页面
import StudentList from '@/views/StudentList.vue'
import FinanceList from '@/views/FinanceList.vue'
import TeacherList from '@/views/TeacherList.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: StudentList
  },
  {
    path: '/finance', // <--- 新增路径
    name: 'Finance',
    component: FinanceList
  },
  {
    path: '/teacher', // <--- 新增路径
    name: 'Teacher',
    component: TeacherList
  }
]

const router = new VueRouter({
  routes
})

export default router
