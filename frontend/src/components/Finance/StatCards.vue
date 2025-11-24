<template>
  <el-row :gutter="20" style="margin-bottom: 20px;">
    <!-- 收入卡片 -->
    <el-col :span="8">
      <el-card shadow="always" style="background-color: #67C23A; color: white;">
        <div slot="header">本月总收入</div>
        <div style="font-size: 24px;">￥{{ income }}</div>
      </el-card>
    </el-col>

    <!-- 支出卡片 -->
    <el-col :span="8">
      <el-card shadow="always" style="background-color: #F56C6C; color: white;">
        <div slot="header">本月总支出</div>
        <div style="font-size: 24px;">￥{{ expense }}</div>
      </el-card>
    </el-col>

    <!-- 利润卡片 -->
    <el-col :span="8">
      <el-card shadow="always" style="background-color: #409EFF; color: white;">
        <div slot="header">结余利润</div>
        <!-- 自动计算利润 -->
        <div style="font-size: 24px;">￥{{ (Number(income) - Number(expense)).toFixed(2) }}</div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'StatCards',
  // props 是父组件传给我的数据，我是只读的
  props: {
    income: {
      type: [String, Number],
      default: 0
    },
    expense: {
      type: [String, Number],
      default: 0
    }
  }
}
</script>
