<template>
  <el-dialog title="记一笔" :visible.sync="visible" width="400px" :before-close="closeDialog">
    <el-form ref="dataForm" :model="temp" :rules="rules" label-width="80px">

      <el-form-item label="类型">
        <el-radio-group v-model="temp.type">
          <el-radio :label="1">收入</el-radio>
          <el-radio :label="2">支出</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input v-model="temp.amount" type="number" placeholder="0.00"></el-input>
      </el-form-item>

      <el-form-item label="分类" prop="category">
        <el-input v-model="temp.category" placeholder="如：学费、买菜"></el-input>
      </el-form-item>

      <el-form-item label="日期" prop="record_date">
        <el-date-picker v-model="temp.record_date" type="date" value-format="yyyy-MM-dd" style="width: 100%"></el-date-picker>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="temp.remark" placeholder="选填"></el-input>
      </el-form-item>

    </el-form>
    <div slot="footer">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="submitData">确认记账</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addFinance } from '@/api/finance'

export default {
  data () {
    return {
      visible: false, // 控制弹窗显示
      temp: {
        type: 1,
        amount: '',
        category: '',
        record_date: '',
        remark: ''
      },
      rules: {
        amount: [{ required: true, message: '必填', trigger: 'blur' }],
        category: [{ required: true, message: '必填', trigger: 'blur' }],
        record_date: [{ required: true, message: '必填', trigger: 'change' }]
      }
    }
  },
  methods: {
    // 1. 给父组件调用的方法：打开弹窗
    openDialog () {
      // 重置数据
      this.temp = {
        type: 1,
        amount: '',
        category: '',
        record_date: new Date().toISOString().substring(0, 10),
        remark: ''
      }
      this.visible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },

    // 2. 关闭弹窗
    closeDialog () {
      this.visible = false
    },

    // 3. 提交数据
    submitData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          addFinance(this.temp).then(() => {
            this.$notify({ title: '成功', message: '记账成功', type: 'success' })
            this.visible = false
            // 关键：告诉父组件“我成功了，你快刷新列表”
            this.$emit('success')
          })
        }
      })
    }
  }
}
</script>
