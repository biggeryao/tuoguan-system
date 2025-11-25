<template>
  <div class="app-container">

    <!-- 1. 顶部数据卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card" style="background: #409EFF; color: white;">
          <div slot="header">👦 在读学生</div>
          <div class="number">{{ stats.student_count }} 人</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card" style="background: #67C23A; color: white;">
          <div slot="header">💰 本月收入</div>
          <div class="number">￥{{ stats.month_income }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card" style="background: #F56C6C; color: white;">
          <div slot="header">💸 本月支出</div>
          <div class="number">￥{{ stats.month_expense }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card" style="background: #E6A23C; color: white;">
          <div slot="header">📈 本月净利</div>
          <div class="number">￥{{ stats.month_profit }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 图表区域 -->
    <el-row :gutter="20">
      <!-- 左边：财务走势 -->
      <el-col :span="14">
        <el-card shadow="hover">
          <div slot="header">📊 近半年财务走势</div>
          <div id="financeChart" style="height: 350px;"></div>
        </el-card>
      </el-col>

      <!-- 右边：学生分布 -->
      <el-col :span="10">
        <el-card shadow="hover">
          <div slot="header">🏫 学生年级分布</div>
          <div id="studentChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import * as echarts from 'echarts' // 引入 ECharts
import { getTopStats, getFinanceChart, getStudentChart } from '@/api/dashboard'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Dashboard',
  data () {
    return {
      stats: {
        student_count: 0,
        month_income: 0,
        month_expense: 0,
        month_profit: 0
      }
    }
  },
  mounted () {
    this.fetchStats()
    this.initFinanceChart()
    this.initStudentChart()
  },
  methods: {
    // 1. 获取顶部数字
    fetchStats () {
      getTopStats().then(res => {
        this.stats = res.data
      })
    },

    // 2. 初始化财务折线图
    initFinanceChart () {
      const chart = echarts.init(document.getElementById('financeChart'))

      getFinanceChart().then(res => {
        const data = res.data
        // 提取数据数组
        const months = data.map(item => item.month)
        const incomes = data.map(item => item.income)
        const expenses = data.map(item => item.expense)

        chart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['收入', '支出'] },
          xAxis: { type: 'category', data: months },
          yAxis: { type: 'value' },
          series: [
            { name: '收入', type: 'line', data: incomes, smooth: true, color: '#67C23A', areaStyle: { opacity: 0.1 } },
            { name: '支出', type: 'line', data: expenses, smooth: true, color: '#F56C6C' }
          ]
        })
      })
    },

    // 3. 初始化学生饼图
    initStudentChart () {
      const chart = echarts.init(document.getElementById('studentChart'))

      getStudentChart().then(res => {
        const data = res.data
        // 转换成饼图需要的格式 { name: '一年级', value: 10 }
        const pieData = data.map(item => ({ name: item.grade, value: item.count }))

        chart.setOption({
          tooltip: { trigger: 'item' },
          legend: { bottom: '0%' },
          series: [
            {
              name: '年级分布',
              type: 'pie',
              radius: ['40%', '70%'], // 环形图
              data: pieData,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              }
            }
          ]
        })
      })
    }
  }
}
</script>

<style scoped>
.number {
  font-size: 28px;
  font-weight: bold;
  margin-top: 10px;
}
.data-card {
    /* 让标题稍微小一点 */
    border: none;
}
</style>
