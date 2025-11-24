<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span style="font-weight: bold">👨‍🏫 教师与薪资管理</span>
        <el-button style="float: right" type="primary" size="small" icon="el-icon-plus" @click="handleCreate">新增教师</el-button>
      </div>

      <el-table :data="list" border v-loading="loading">
        <el-table-column prop="name" label="姓名" width="100"></el-table-column>
        <el-table-column prop="job_title" label="职位"></el-table-column>
        <el-table-column prop="phone" label="电话" width="120"></el-table-column>
        <el-table-column label="底薪" width="100">
            <template slot-scope="scope">￥{{ scope.row.base_salary }}</template>
        </el-table-column>
        <el-table-column label="医社保方案" width="140">
            <template slot-scope="scope">
                <el-tag v-if="scope.row.insurance_type===1" type="success">拿补贴(1070)</el-tag>
                <el-tag v-else type="warning">学校代缴</el-tag>
            </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="280">
          <template slot-scope="scope">
            <el-button type="success" size="mini" icon="el-icon-money" @click="handleSalary(scope.row)">发工资</el-button>
            <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">离职</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 1. 编辑/新增 教师弹窗 (保持不变) -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px">
      <el-form :model="temp" label-width="100px">
        <el-form-item label="姓名"><el-input v-model="temp.name"></el-input></el-form-item>
        <el-form-item label="电话"><el-input v-model="temp.phone"></el-input></el-form-item>
        <el-form-item label="职位"><el-input v-model="temp.job_title"></el-input></el-form-item>
        <el-form-item label="底薪">
            <el-input v-model="temp.base_salary" type="number"><template slot="append">元</template></el-input>
        </el-form-item>
        <el-divider content-position="left">医社保配置</el-divider>
        <el-form-item label="方案选择">
            <el-radio-group v-model="temp.insurance_type">
                <el-radio :label="1">不交社保 (发1070补贴)</el-radio>
                <el-radio :label="2">学校代缴 (需扣个人部分)</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="代缴扣款" v-if="temp.insurance_type === 2">
            <el-input v-model="temp.insurance_deduction" type="number"><template slot="append">元</template></el-input>
        </el-form-item>
        <el-form-item label="入职日期">
            <el-date-picker v-model="temp.entry_date" type="date" value-format="yyyy-MM-dd" style="width:100%"></el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTeacher">确定</el-button>
      </div>
    </el-dialog>

    <!-- 2. 💰 发工资 & 历史记录 弹窗 -->
    <el-dialog title="薪资管理" :visible.sync="salaryDialogVisible" width="700px" top="5vh">
        <el-tabs type="border-card">
            <el-tab-pane label="💸 智能计算工资">
                <el-form :model="salaryTemp" label-width="110px">
                    <el-row>
                         <el-col :span="12">
                            <el-form-item label="工资月份">
                                <el-date-picker v-model="salaryTemp.month" type="month" value-format="yyyy-MM" :clearable="false" @change="loadPreview"></el-date-picker>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="底薪 (固定)">
                                <el-input v-model="salaryTemp.base_amount" disabled></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <div style="background: #f4f4f5; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                        <el-form-item label="本月班级业绩" style="margin-bottom: 10px;">
                            <el-input v-model="classPerformance" type="number" placeholder="输入该老师班级总学费" @input="calculateCommission">
                                <template slot="prepend">￥</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="提成 (6%)" style="margin-bottom: 0;">
                            <el-input v-model="salaryTemp.commission" style="color: green; font-weight: bold"></el-input>
                        </el-form-item>
                    </div>

                    <el-row>
                        <el-col :span="12">
                             <el-form-item label="医社保补贴">
                                <el-input v-model="salaryTemp.subsidy"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="扣款(含社保)">
                                <el-input v-model="salaryTemp.deduction"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-alert type="success" :closable="false" style="margin-bottom: 15px;">
                        <div style="font-size: 18px; font-weight: bold; text-align: center;">
                            实发总计：￥ {{ computedTotal }}
                        </div>
                    </el-alert>

                    <el-form-item label="备注">
                        <el-input v-model="salaryTemp.remark" type="textarea"></el-input>
                    </el-form-item>

                    <div style="display:flex; justify-content: space-between;">
                         <!-- 新增按钮：生成工资条 -->
                         <el-button type="warning" icon="el-icon-picture" @click="handleGenerateSlip">生成工资条图片</el-button>
                         <el-button type="primary" icon="el-icon-check" @click="submitPay">确认发放并记账</el-button>
                    </div>
                </el-form>
            </el-tab-pane>

            <el-tab-pane label="📜 历史工资条">
                <el-table :data="salaryHistory" border height="300">
                    <el-table-column prop="month" label="月份" width="100"></el-table-column>
                    <el-table-column prop="total" label="实发" width="100">
                        <template slot-scope="scope"><b style="color:#f56c6c">{{ scope.row.total }}</b></template>
                    </el-table-column>
                    <el-table-column label="明细" show-overflow-tooltip>
                        <template slot-scope="scope">
                            底{{scope.row.base_amount}} / 提{{scope.row.commission}} / 补{{scope.row.subsidy}} / 扣{{scope.row.deduction}}
                        </template>
                    </el-table-column>
                     <el-table-column prop="pay_date" label="发放时间" width="100">
                        <template slot-scope="scope">{{ scope.row.pay_date.substring(0,10) }}</template>
                     </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>

    <!-- 3. 🖼️ 隐藏的工资条模板 (用于截图) -->
    <!-- 只有点击生成时，会在弹窗里显示 -->
    <el-dialog title="📷 微信发送预览 (右键复制图片)" :visible.sync="imageDialogVisible" width="400px" append-to-body>
        <div style="text-align: center; margin-bottom: 10px; color: #999;">
            请长按或右键点击下方图片保存
        </div>
        <div style="display: flex; justify-content: center;">
            <img v-if="generatedImageUrl" :src="generatedImageUrl" style="width: 100%; border: 1px solid #eee; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);">
        </div>
    </el-dialog>

    <!-- 真正的 HTML 结构 (截图源)，平时隐藏 -->
    <div style="position: absolute; left: -9999px; top: 0;">
        <div id="salary-slip-node" class="salary-slip">
            <div class="slip-header">
                <div class="slip-title">小学生托管中心 · 工资单</div>
                <div class="slip-month">{{ salaryTemp.month }}</div>
            </div>
            <div class="slip-info">
                <span>姓名：{{ salaryTemp.teacher_name }}</span>
                <span>发放日：{{ new Date().toISOString().substring(0,10) }}</span>
            </div>

            <table class="slip-table">
                <tr>
                    <th>项目</th>
                    <th style="text-align:right">金额</th>
                </tr>
                <tr>
                    <td>基本工资</td>
                    <td class="amount">￥{{ salaryTemp.base_amount }}</td>
                </tr>
                <tr>
                    <td>带班提成 <span style="font-size:10px;color:#999">(业绩{{classPerformance||0}})</span></td>
                    <td class="amount">￥{{ salaryTemp.commission }}</td>
                </tr>
                <tr>
                    <td>医社保补贴</td>
                    <td class="amount">￥{{ salaryTemp.subsidy }}</td>
                </tr>
                <tr style="color: #f56c6c">
                    <td>扣除 (社保/考勤)</td>
                    <td class="amount">- ￥{{ salaryTemp.deduction }}</td>
                </tr>
            </table>

            <div class="slip-total">
                <div class="label">实发工资</div>
                <div class="number">￥{{ computedTotal }}</div>
            </div>

            <div class="slip-footer">
                <p>备注：{{ salaryTemp.remark || '无' }}</p>
                <p>感谢您的辛勤付出！❤</p>
            </div>
        </div>
    </div>

  </div>
</template>

<script>
import { getTeacherList, addTeacher, updateTeacher, deleteTeacher, getSalaryHistory, paySalary, calcSalaryPreview } from '@/api/teachers'
import html2canvas from 'html2canvas' // 引入截图插件

export default {
  name: 'TeacherList',
  data () {
    return {
      list: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '',
      temp: { id: undefined, name: '', phone: '', job_title: '', base_salary: 0, insurance_type: 1, insurance_deduction: 0, entry_date: '' },

      // 工资数据
      salaryDialogVisible: false,
      currentTeacherId: null,
      classPerformance: '',
      salaryTemp: {
        teacher_id: '', teacher_name: '', month: '', base_amount: 0, commission: 0, subsidy: 0, deduction: 0, remark: ''
      },
      salaryHistory: [],

      // 图片生成相关
      imageDialogVisible: false,
      generatedImageUrl: ''
    }
  },
  computed: {
    computedTotal () {
      const base = parseFloat(this.salaryTemp.base_amount) || 0
      const comm = parseFloat(this.salaryTemp.commission) || 0
      const sub = parseFloat(this.salaryTemp.subsidy) || 0
      const ded = parseFloat(this.salaryTemp.deduction) || 0
      return (base + comm + sub - ded).toFixed(2)
    }
  },
  created () {
    this.fetchList()
  },
  methods: {
    fetchList () {
      this.loading = true
      getTeacherList().then(res => { this.list = res.data; this.loading = false })
    },
    handleCreate () {
      this.temp = { base_salary: 0, insurance_type: 1, insurance_deduction: 0 }
      this.dialogTitle = '新增教师'; this.dialogVisible = true
    },
    handleEdit (row) {
      this.temp = { ...row }; this.dialogTitle = '编辑教师'; this.dialogVisible = true
    },
    submitTeacher () {
      const api = this.temp.id ? updateTeacher : addTeacher
      api(this.temp).then(() => { this.$message.success('操作成功'); this.dialogVisible = false; this.fetchList() })
    },
    handleDelete (row) {
      this.$confirm('确认离职?').then(() => { deleteTeacher(row.id).then(() => { this.$message.success('已离职'); this.fetchList() }) })
    },

    // === 工资逻辑 ===
    handleSalary (row) {
      this.currentTeacherId = row.id
      this.salaryDialogVisible = true
      this.classPerformance = ''
      this.salaryTemp = {
        teacher_id: row.id,
        teacher_name: row.name,
        month: new Date().toISOString().substring(0, 7),
        base_amount: 0,
        commission: 0,
        subsidy: 0,
        deduction: 0,
        remark: ''
      }
      this.loadPreview()
      getSalaryHistory(row.id).then(res => { this.salaryHistory = res.data })
    },
    loadPreview () {
      // 把月份也传过去，因为后台要根据月份算业绩
      const postData = {
        teacher_id: this.currentTeacherId,
        month: this.salaryTemp.month
      }

      calcSalaryPreview(postData).then(res => {
        const data = res.data

        // 1. 填入基础信息
        this.salaryTemp.base_amount = data.base_salary
        this.salaryTemp.subsidy = data.subsidy
        this.salaryTemp.deduction = data.insurance_deduction

        // 2. ⭐️ 填入自动计算的班级业绩
        this.classPerformance = data.class_performance

        // 3. 立即触发一次提成计算 (算 6%)
        this.calculateCommission()

        if (data.class_performance > 0) {
          this.$notify({
            title: '自动计算',
            message: `系统检测到本月该班级缴费 ${data.class_performance} 元，已自动计算提成`,
            type: 'success',
            duration: 3000
          })
        }
      })
    },
    calculateCommission () {
      if (!this.classPerformance) { this.salaryTemp.commission = 0; return }
      this.salaryTemp.commission = (parseFloat(this.classPerformance) * 0.06).toFixed(2)
    },
    submitPay () {
      this.salaryTemp.total = this.computedTotal
      paySalary(this.salaryTemp).then(res => {
        this.$message.success(res.msg); this.salaryDialogVisible = false
      })
    },

    // === 📸 生成工资条图片核心代码 ===
    handleGenerateSlip () {
      const dom = document.getElementById('salary-slip-node')
      // 使用 html2canvas 截图
      html2canvas(dom, {
        scale: 2, // 高清模式
        backgroundColor: '#ffffff' // 确保背景是白色
      }).then(canvas => {
        // 转成 Base64 图片
        this.generatedImageUrl = canvas.toDataURL('image/png')
        this.imageDialogVisible = true
      })
    }
  }
}
</script>

<style scoped>
/* 工资条样式 - 模仿纸质单据 */
.salary-slip {
    width: 350px; /* 手机屏幕宽度 */
    padding: 20px;
    background: #fff;
    color: #333;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
    border-top: 5px solid #409EFF; /* 顶部装饰条 */
}
.slip-header {
    text-align: center;
    margin-bottom: 20px;
}
.slip-title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}
.slip-month {
    font-size: 14px;
    color: #606266;
    margin-top: 5px;
}
.slip-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;
    border-bottom: 1px dashed #ebeef5;
    padding-bottom: 10px;
}
.slip-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}
.slip-table th {
    text-align: left;
    font-size: 12px;
    color: #909399;
    padding-bottom: 8px;
}
.slip-table td {
    font-size: 14px;
    padding: 8px 0;
    border-bottom: 1px solid #f2f6fc;
}
.slip-table .amount {
    text-align: right;
    font-weight: 500;
}
.slip-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 2px solid #303133;
}
.slip-total .label {
    font-weight: bold;
    font-size: 14px;
}
.slip-total .number {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
}
.slip-footer {
    margin-top: 20px;
    font-size: 12px;
    color: #909399;
    text-align: center;
    line-height: 1.5;
}
</style>
