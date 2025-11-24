<template>
  <div class="app-container">
    <!-- === 1. 顶部月份导航栏 (驾驶舱核心) === -->
    <div class="month-navigator">
      <el-button
        icon="el-icon-arrow-left"
        circle
        @click="changeMonth(-1)"
      ></el-button>

      <div class="date-picker-box">
        <span class="label">当前统计月份：</span>
        <el-date-picker
          v-model="currentMonth"
          type="month"
          :clearable="false"
          value-format="yyyy-MM"
          placeholder="选择月份"
          style="width: 140px; text-align: center"
        >
        </el-date-picker>
      </div>

      <el-button
        icon="el-icon-arrow-right"
        circle
        @click="changeMonth(1)"
      ></el-button>

      <!-- 右侧记账按钮 -->
      <el-button
        type="primary"
        icon="el-icon-plus"
        style="margin-left: auto"
        @click="$refs.financeDialog.openDialog()"
      >
        记一笔
      </el-button>
    </div>

    <!-- === 2. 核心指标卡片 === -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card shadow="hover" class="finance-card income-card">
          <div class="card-title"><i class="el-icon-wallet"></i> 本月收入</div>
          <div class="card-num">￥{{ monthStats.income }}</div>
          <div class="card-sub">
            比上月: {{ compareStats.incomeDiff >= 0 ? "+" : ""
            }}{{ compareStats.incomeDiff }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="finance-card expense-card">
          <div class="card-title">
            <i class="el-icon-shopping-cart-full"></i> 本月支出
          </div>
          <div class="card-num">￥{{ monthStats.expense }}</div>
          <div class="card-sub">
            比上月: {{ compareStats.expenseDiff >= 0 ? "+" : ""
            }}{{ compareStats.expenseDiff }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="finance-card profit-card">
          <div class="card-title">
            <i class="el-icon-s-marketing"></i> 本月净利润
          </div>
          <div class="card-num">￥{{ monthStats.profit }}</div>
          <div class="card-sub">
            利润率:
            {{
              monthStats.income > 0
                ? ((monthStats.profit / monthStats.income) * 100).toFixed(1)
                : 0
            }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- === 3. 多维视图区域 (标签页切换) === -->
    <el-tabs type="border-card">
      <!-- 视图A: 流水明细 -->
      <el-tab-pane label="📋 流水明细">
        <el-table
          :data="currentMonthList"
          border
          stripe
          style="width: 100%"
          height="500"
        >
          <el-table-column label="日期" prop="record_date" width="120" sortable>
            <template slot-scope="scope">{{ scope.row.record_date }}</template>
          </el-table-column>

          <el-table-column label="分类" prop="category" width="120">
            <template slot-scope="scope">
              <el-tag size="small" type="info">{{ scope.row.category }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="金额" width="150" sortable prop="amount">
            <template slot-scope="scope">
              <span
                :class="scope.row.type === 1 ? 'text-income' : 'text-expense'"
              >
                {{ scope.row.type === 1 ? "+" : "-" }} {{ scope.row.amount }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="备注" prop="remark"></el-table-column>

          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button
                type="text"
                style="color: #f56c6c"
                @click="handleDelete(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 视图B: 分类统计报表 (老板最爱看这个) -->
      <el-tab-pane label="📊 分类统计">
        <el-row :gutter="20">
          <!-- 左边：收入构成 -->
          <el-col :span="12">
            <h4>💰 收入来源分析</h4>
            <el-table
              :data="categoryStats.income"
              border
              :summary-method="getSummaries"
              show-summary
            >
              <el-table-column prop="category" label="收入项"></el-table-column>
              <el-table-column prop="amount" label="金额 (元)" sortable>
                <template slot-scope="scope"
                  ><span class="text-income"
                    >+{{ scope.row.amount }}</span
                  ></template
                >
              </el-table-column>
            </el-table>
          </el-col>

          <!-- 右边：支出构成 -->
          <el-col :span="12">
            <h4>💸 支出去向分析</h4>
            <el-table
              :data="categoryStats.expense"
              border
              :summary-method="getSummaries"
              show-summary
            >
              <el-table-column prop="category" label="支出项"></el-table-column>
              <el-table-column prop="amount" label="金额 (元)" sortable>
                <template slot-scope="scope"
                  ><span class="text-expense"
                    >-{{ scope.row.amount }}</span
                  ></template
                >
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 引入之前的记账弹窗 -->
    <finance-dialog ref="financeDialog" @success="fetchData"></finance-dialog>
  </div>
</template>

<script>
import FinanceDialog from '@/components/Finance/FinanceDialog'
import { getFinanceList, deleteFinance } from '@/api/finance'

export default {
  name: 'FinanceList',
  components: { FinanceDialog },
  data () {
    return {
      allData: [], // 存放从后台拿来的所有数据
      currentMonth: new Date().toISOString().substring(0, 7), // 默认选中本月 '2025-11'
      loading: false
    }
  },
  computed: {
    // 1. 过滤出【当前选中月份】的账目
    currentMonthList () {
      if (!this.allData) return []
      console.log(this.currentMonth)
      console.log(this.allData)
      return this.allData.filter(item => item.record_date.startsWith(this.currentMonth))
    },

    // 2. 过滤出【上个月】的账目 (用于计算环比)
    lastMonthList () {
      const date = new Date(this.currentMonth + '-01')
      date.setMonth(date.getMonth() - 1)
      const lastMonthStr = date.toISOString().substring(0, 7)
      return this.allData.filter(item => item.record_date.startsWith(lastMonthStr))
    },

    // 3. 计算【本月】的核心指标
    monthStats () {
      return this.calculateStats(this.currentMonthList)
    },

    // 4. 计算【环比】数据
    compareStats () {
      const lastStats = this.calculateStats(this.lastMonthList)
      return {
        incomeDiff: (this.monthStats.income - lastStats.income).toFixed(2),
        expenseDiff: (this.monthStats.expense - lastStats.expense).toFixed(2)
      }
    },

    // 5. 核心算法：自动按【分类】汇总数据
    categoryStats () {
      const incomeMap = {}
      const expenseMap = {}

      this.currentMonthList.forEach(item => {
        const amt = Number(item.amount)
        if (item.type === 1) {
          // 收入
          incomeMap[item.category] = (incomeMap[item.category] || 0) + amt
        } else {
          // 支出
          expenseMap[item.category] = (expenseMap[item.category] || 0) + amt
        }
      })

      // 转成表格能用的数组格式
      return {
        income: Object.keys(incomeMap).map(k => ({ category: k, amount: incomeMap[k].toFixed(2) })),
        expense: Object.keys(expenseMap).map(k => ({ category: k, amount: expenseMap[k].toFixed(2) }))
      }
    }
  },
  created () {
    this.fetchData()
  },
  methods: {
    fetchData () {
      this.loading = true
      getFinanceList().then(res => {
        this.allData = res.data
        this.loading = false
      })
    },
    // 切换月份按钮 (-1 上个月, 1 下个月)
    changeMonth (step) {
      const date = new Date(this.currentMonth + '-01')
      date.setMonth(date.getMonth() + step)
      this.currentMonth = date.toISOString().substring(0, 7)
    },
    // 辅助工具：算出总收入、总支出、利润
    calculateStats (list) {
      let income = 0
      let expense = 0
      list.forEach(item => {
        if (item.type === 1) income += Number(item.amount)
        else expense += Number(item.amount)
      })
      return {
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        profit: (income - expense).toFixed(2)
      }
    },
    // 表格合计行逻辑 (Element UI 自带功能)
    getSummaries (param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) { sums[index] = '合计'; return }
        const values = data.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            return !isNaN(value) ? prev + curr : prev
          }, 0).toFixed(2)
        }
      })
      return sums
    },
    handleDelete (row) {
      this.$confirm('确认删除?').then(() => {
        deleteFinance(row.id).then(() => {
          this.$message.success('删除成功')
          this.fetchData()
        })
      })
    }
  }
}
</script>

<style scoped>
/* 顶部导航栏样式 */
.month-navigator {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
.date-picker-box {
  margin: 0 20px;
  font-weight: bold;
  color: #606266;
}

/* 核心指标卡片样式 */
.finance-card {
  text-align: center;
  border: none;
}
.income-card {
  background: #f0f9eb;
  color: #67c23a;
}
.expense-card {
  background: #fef0f0;
  color: #f56c6c;
}
.profit-card {
  background: #ecf5ff;
  color: #409eff;
}

.card-title {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 10px;
}
.card-num {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}
.card-sub {
  font-size: 12px;
  opacity: 0.7;
}

/* 文字颜色工具类 */
.text-income {
  color: #67c23a;
  font-weight: bold;
}
.text-expense {
  color: #f56c6c;
  font-weight: bold;
}
</style>
