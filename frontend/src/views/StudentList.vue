<template>
  <div class="app-container">
    <el-card class="box-card">
      <!-- 1. 在 <el-card> 内部，表格上方，插入这个搜索栏 -->
      <div class="filter-container" style="margin-bottom: 20px">
        <!-- 姓名搜索 -->
        <el-input
          v-model="listQuery.name"
          placeholder="🔍 搜姓名"
          style="width: 150px; margin-right: 10px"
          @keyup.enter.native="handleFilter"
          clearable
          @clear="handleFilter"
        />

        <!-- 老师筛选 -->
        <el-select
          v-if="userRole === 'admin'"
          v-model="listQuery.teacher_id"
          placeholder="👨‍🏫 选择老师"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="handleFilter"
        >
          <el-option
            v-for="item in teacherOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>

        <!-- 学校搜索 -->
        <el-input
          v-model="listQuery.school"
          placeholder="🏫 搜学校"
          style="width: 150px; margin-right: 10px"
          @keyup.enter.native="handleFilter"
          clearable
          @clear="handleFilter"
        />

        <!-- 托管类型 -->
        <el-select
          v-model="listQuery.care_type"
          placeholder="🍱 类型"
          clearable
          style="width: 120px; margin-right: 10px"
          @change="handleFilter"
        >
          <el-option label="午托" :value="1"></el-option>
          <el-option label="晚托" :value="2"></el-option>
          <el-option label="全托" :value="3"></el-option>
        </el-select>

        <el-button type="primary" icon="el-icon-search" @click="handleFilter"
          >查询</el-button
        >
        <el-button icon="el-icon-refresh" @click="resetFilter">重置</el-button>
      </div>
      <div slot="header" class="clearfix">
        <span style="font-weight: bold; font-size: 18px">📋 学生管理</span>
        <div style="float: right">
          <!-- 新增按钮 -->
          <el-button
            type="warning"
            size="small"
            icon="el-icon-upload2"
            @click="handleImportClick"
            >批量导入</el-button
          >
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="handleCreate"
            >新增学生</el-button
          >
          <el-button
            type="success"
            size="small"
            icon="el-icon-refresh"
            @click="fetchData"
            >刷新</el-button
          >
        </div>
      </div>

      <!-- === 1. 新增：年级标签页 === -->
      <!-- tab-click 当你切换标签时触发 -->
      <el-tabs v-model="activeGrade" @tab-click="handleTabClick">
        <el-tab-pane label="全部学生" name="All"></el-tab-pane>
        <el-tab-pane label="一年级" name="一年级"></el-tab-pane>
        <el-tab-pane label="二年级" name="二年级"></el-tab-pane>
        <el-tab-pane label="三年级" name="三年级"></el-tab-pane>
        <el-tab-pane label="四年级" name="四年级"></el-tab-pane>
        <el-tab-pane label="五年级" name="五年级"></el-tab-pane>
        <el-tab-pane label="六年级" name="六年级"></el-tab-pane>
      </el-tabs>

      <el-table v-loading="loading" :data="list" border style="width: 100%">
        <el-table-column prop="name" label="姓名" width="100"></el-table-column>
        <el-table-column label="性别" align="center" width="60">
          <template slot-scope="scope">
            <span
              v-if="scope.row.gender === 1"
              style="color: #409eff; font-weight: bold"
              >男</span
            >
            <span v-else style="color: #f56c6c; font-weight: bold">女</span>
          </template>
        </el-table-column>

        <!-- === 新增：入托时间列 === -->
        <el-table-column label="入托时间" width="110" align="center">
          <template slot-scope="scope">
            {{
              scope.row.enrollment_date
                ? scope.row.enrollment_date.substring(0, 10)
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column label="就读学校" min-width="140">
          <template slot-scope="scope">
            <div>{{ scope.row.school }}</div>
            <div style="font-size: 12px; color: #909399">
              {{ scope.row.grade }} {{ scope.row.class_name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100">
          <template slot-scope="scope">
            <el-tag size="medium">{{ scope.row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="带班老师" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.teacher_name" size="medium" effect="plain">
              {{ scope.row.teacher_name }}
            </el-tag>
            <span v-else style="color: #ddd">未分配</span>
          </template>
        </el-table-column>
        <!-- 托管类型 -->
        <el-table-column label="类型" align="center" width="80">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.care_type === 1" type="warning" size="mini"
              >午托</el-tag
            >
            <el-tag
              v-else-if="scope.row.care_type === 2"
              type="success"
              size="mini"
              >晚托</el-tag
            >
            <el-tag v-else size="mini">全托</el-tag>
          </template>
        </el-table-column>

        <!-- 健康备注 (如果有内容，显示一个小红点提示，鼠标放上去显示详情) -->
        <el-table-column label="健康" align="center" width="60">
          <template slot-scope="scope">
            <el-popover
              v-if="scope.row.health_notes"
              trigger="hover"
              placement="top"
            >
              <p>⚠️ 健康备注: {{ scope.row.health_notes }}</p>
              <div slot="reference" class="name-wrapper">
                <i class="el-icon-first-aid-kit" style="color: red"></i>
              </div>
            </el-popover>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="parent_phone"
          label="家长电话"
          width="140"
        ></el-table-column>

        <!-- === 2. 新增：续费按钮 === -->
        <el-table-column label="快捷操作" align="center" width="120">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="warning"
              icon="el-icon-money"
              @click="handleRenew(scope.row)"
              >续费</el-button
            >
          </template>
        </el-table-column>
        <!-- 原来的在托/退托状态 -->
        <el-table-column label="在托状态" align="center" width="80">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.status === 1 ? '' : 'info'">
              {{ scope.row.status === 1 ? "在管" : "已退" }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- === 智能缴费状态列 === -->
        <el-table-column label="缴费状态 (剩余天数)" align="center" width="160">
          <template slot-scope="scope">
            <!-- 调用一个方法 getStatusTag 来决定显示什么 -->
            <el-tag
              effect="dark"
              :type="getStatusTag(scope.row.expire_date).type"
            >
              {{ getStatusTag(scope.row.expire_date).label }}
            </el-tag>

            <!-- 显示具体到期日期 -->
            <div style="font-size: 12px; color: #909399; margin-top: 5px">
              到期:
              {{
                scope.row.expire_date
                  ? scope.row.expire_date.substring(0, 10)
                  : "未设置"
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="管理操作" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 弹窗 (代码不变) -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增' : '编辑'"
      :visible.sync="dialogVisible"
      width="500px"
    >
<el-form ref="dataForm" :model="temp" :rules="rules" label-width="80px">

  <!-- === 第一部分：基础信息 (姓名、电话、性别、生日) === -->
  <el-divider content-position="left">基础信息</el-divider>
  <el-row :gutter="20">
    <el-col :span="12">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="temp.name" placeholder="请输入姓名"></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="电话" prop="parent_phone">
        <el-input v-model="temp.parent_phone" placeholder="家长联系电话" maxlength="11"></el-input>
      </el-form-item>
    </el-col>
  </el-row>

  <el-row :gutter="20">
    <el-col :span="12">
      <el-form-item label="性别">
        <el-radio-group v-model="temp.gender">
          <el-radio :label="1">男 👦</el-radio>
          <el-radio :label="2">女 👧</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="生日">
        <el-date-picker
          v-model="temp.birthday"
          type="date"
          placeholder="选择出生日期"
          value-format="yyyy-MM-dd"
          style="width: 100%">
        </el-date-picker>
      </el-form-item>
    </el-col>
  </el-row>

  <!-- === 第二部分：就读信息 (学校、年级、班级放一起) === -->
  <el-divider content-position="left">就读信息</el-divider>

  <el-form-item label="就读学校">
    <el-input v-model="temp.school" placeholder="例如: 第一实验小学"></el-input>
  </el-form-item>

  <el-row :gutter="20">
    <el-col :span="12">
      <el-form-item label="年级" prop="grade">
        <el-select v-model="temp.grade" style="width: 100%" placeholder="请选择">
          <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级']" :key="g" :label="g" :value="g"></el-option>
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="班级">
        <el-input v-model="temp.class_name" placeholder="例如: 3班">
          <template slot="append">班</template>
        </el-input>
      </el-form-item>
    </el-col>
  </el-row>

  <!-- === 第三部分：托管信息 (类型、时间、老师) === -->
  <el-divider content-position="left">托管配置</el-divider>

  <el-row :gutter="20">
    <el-col :span="12">
      <el-form-item label="托管类型">
        <el-select v-model="temp.care_type" style="width: 100%">
          <el-option label="🍱 午托" :value="1"></el-option>
          <el-option label="🌙 晚托" :value="2"></el-option>
          <el-option label="🏠 全托" :value="3"></el-option>
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="入托时间">
        <el-date-picker
          v-model="temp.enrollment_date"
          type="date"
          placeholder="选择日期"
          value-format="yyyy-MM-dd"
          style="width: 100%">
        </el-date-picker>
      </el-form-item>
    </el-col>
  </el-row>

  <el-form-item label="负责老师" prop="teacher_id">
    <el-select v-model="temp.teacher_id" placeholder="请选择带班老师 (用于计算提成)" style="width: 100%" clearable filterable>
      <el-option
        v-for="item in teacherOptions"
        :key="item.id"
        :label="item.name"
        :value="item.id">
        <span style="float: left">{{ item.name }}</span>
        <span style="float: right; color: #8492a6; font-size: 13px">{{ item.phone }}</span>
      </el-option>
    </el-select>
  </el-form-item>

  <el-form-item label="健康备注">
    <el-input
      type="textarea"
      v-model="temp.health_notes"
      placeholder="重要：请填写过敏源(如海鲜/花生)、忌口或病史，无则留空"
      :rows="2">
    </el-input>
  </el-form-item>

</el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="dialogStatus === 'create' ? createData() : updateData()"
          >确定</el-button
        >
      </div>
    </el-dialog>
    <!-- 续费弹窗 (单月模式) -->
    <el-dialog
      title="学生续费 (按月)"
      :visible.sync="renewDialogVisible"
      width="400px"
    >
      <el-form :model="renewTemp" label-width="80px">
        <el-form-item label="学生姓名">
          <el-input v-model="renewTemp.studentName" disabled></el-input>
        </el-form-item>

        <!-- 改为单月选择器 -->
        <el-form-item label="续费月份">
          <el-date-picker
            v-model="renewTemp.targetMonth"
            type="month"
            placeholder="请选择月份"
            value-format="yyyy-MM"
            style="width: 100%"
          >
          </el-date-picker>
        </el-form-item>

        <el-form-item label="金额">
          <el-input
            v-model="renewTemp.amount"
            type="number"
            placeholder="例如: 1000"
          >
            <template slot="append">元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            type="textarea"
            v-model="renewTemp.remark"
            placeholder="选填"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRenew">确认续费</el-button>
      </div>
    </el-dialog>
    <!-- 导入弹窗 -->
    <el-dialog
      title="批量导入学生"
      :visible.sync="importDialogVisible"
      width="400px"
    >
      <div style="text-align: center">
        <!-- 步骤1 -->
        <div style="margin-bottom: 20px">
          <p>步骤 1：下载 Excel 模板，按格式填写</p>
          <el-button
            size="small"
            icon="el-icon-download"
            @click="downloadTemplate"
            >下载模板</el-button
          >
        </div>

        <el-divider></el-divider>

        <!-- 步骤2 -->
        <div>
          <p>步骤 2：上传填写好的文件</p>
          <el-upload
            class="upload-demo"
            drag
            action=""
            :http-request="uploadFile"
            :limit="1"
            :file-list="fileList"
            :show-file-list="true"
            accept=".xlsx, .xls"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
// 引入所有需要的接口
import { getStudentList, addStudent, updateStudent, deleteStudent, renewStudent, importStudents } from '@/api/student'
import { getTeacherList } from '@/api/teachers'
export default {
  name: 'StudentList',
  data () {
    return {
      list: [],
      loading: true,
      activeGrade: 'All', // 当前选中的年级标签

      // === 基础增删改数据 ===
      dialogVisible: false,
      dialogStatus: '', // 'create' 或 'update'
      temp: {
        id: undefined,
        name: '',
        gender: 1,
        birthday: '',
        enrollment_date: new Date().toISOString().substring(0, 10),
        grade: '',
        parent_phone: '',
        payment_status: 0 // 默认待缴费
      },
      rules: {
        name: [{ required: true, message: '必填', trigger: 'blur' }],
        parent_phone: [{ required: true, message: '必填', trigger: 'blur' }]
      },

      // === 续费弹窗数据 ===
      renewDialogVisible: false,
      renewTemp: {
        studentId: '',
        studentName: '',
        targetMonth: '', // 变化：只存一个月，例如 '2025-11'
        amount: '',
        remark: '',
        dateRange: [] // [开始日期, 结束日期]
      },
      importDialogVisible: false,
      fileList: [], // 上传组件的文件列表
      uploading: false,
      listQuery: {
        name: '',
        teacher_id: '',
        school: '',
        care_type: ''
      },
      teacherOptions: [],
      userRole: localStorage.getItem('role')
    }
  },
  computed: {
  },
  created () {
    this.getTeachers()
    this.fetchData()
  },
  methods: {
    // 1. 获取数据
    fetchData () {
      this.loading = true
      // 把 listQuery 传进去
      getStudentList(this.listQuery).then(res => {
        this.list = res.data
        this.loading = false
      })
    },
    // 搜索按钮
    handleFilter () {
      this.fetchData()
    },

    // 重置按钮
    resetFilter () {
      this.listQuery = {
        name: '',
        teacher_id: '',
        school: '',
        care_type: ''
      }
      this.fetchData()
    },
    getTeachers () {
      getTeacherList().then(res => {
        this.teacherOptions = res.data
      })
    },
    // 2. 切换标签
    handleTabClick (tab) {
      console.log('切换年级:', tab.label)
    },

    // === 核心：智能状态计算函数 ===
    getStatusTag (expireDate) {
      if (!expireDate) {
        return { type: 'danger', label: '未缴费' }
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0) // 把今天的时分秒去掉，只比日期
      const target = new Date(expireDate)

      // 计算差值（毫秒）
      const diff = target.getTime() - today.getTime()
      // 换算成天数
      const days = Math.ceil(diff / (1000 * 3600 * 24))

      if (days < 0) {
        return { type: 'danger', label: `已欠费 ${Math.abs(days)} 天` }
      } else if (days <= 7) {
        // 剩7天以内，显示橙色预警
        return { type: 'warning', label: `剩 ${days} 天到期` }
      } else {
        // 7天以上，绿色正常
        return { type: 'success', label: `剩余 ${days} 天` }
      }
    },

    // 打开续费弹窗
    handleRenew (row) {
      this.renewTemp = {
        studentId: row.id,
        studentName: row.name,
        targetMonth: '',
        amount: '',
        remark: ''
      }

      // === 智能默认逻辑 ===
      if (row.expire_date) {
        // 如果有到期时间，自动帮他选【下个月】
        // 比如到期是 2025-10-31，这里自动算出 2025-11
        const lastDate = new Date(row.expire_date)
        lastDate.setDate(lastDate.getDate() + 5) // 往后推几天就进入下个月了
        this.renewTemp.targetMonth = lastDate.toISOString().substring(0, 7) // 取 yyyy-MM
      } else {
        // 如果是新学生，默认选【本月】
        this.renewTemp.targetMonth = new Date().toISOString().substring(0, 7)
      }

      this.renewDialogVisible = true
    },

    // 提交续费
    submitRenew () {
      if (!this.renewTemp.amount || !this.renewTemp.targetMonth) {
        this.$message.warning('请选择月份并填写金额')
        return
      }
      const today = new Date().toISOString().substring(0, 10)

      const postData = {
        student_id: this.renewTemp.studentId,
        student_name: this.renewTemp.studentName,
        amount: this.renewTemp.amount,
        target_month: this.renewTemp.targetMonth,
        remark: `${this.renewTemp.remark} (实际收款日: ${today})`
      }

      renewStudent(postData).then(() => {
        this.renewDialogVisible = false
        this.$notify({ title: '成功', message: `续费成功！已计入 ${this.renewTemp.targetMonth} 月账单`, type: 'success' })
        this.fetchData()
      })
    },

    // === 手动切换缴费状态 (用于纠错) ===
    handleTogglePay (row) {
      // 如果当前是 0，就改成 1；是 1 就改成 0
      const newStatus = row.payment_status === 1 ? 0 : 1

      // 复用更新接口，只改 status
      // 注意：这需要后端支持接收 payment_status 字段（见下文第二步）
      const data = { ...row, payment_status: newStatus }

      updateStudent(data).then(() => {
        this.$message.success(newStatus === 1 ? '已标记为已缴费' : '已标记为待缴费')
        this.fetchData()
      })
    },

    // === 基础增删改逻辑 ===
    resetTemp () {
      this.temp = {
        id: undefined,
        name: '',
        gender: 1,
        birthday: '',
        enrollment_date: new Date().toISOString().substring(0, 10),
        grade: '',
        school: '', // 新增
        class_name: '', // 新增
        care_type: 3, // 新增 (默认全托)
        health_notes: '', // 新增
        parent_phone: '',
        payment_status: 0
      }
    },
    handleCreate () {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.dataForm.clearValidate() })
    },
    createData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          addStudent(this.temp).then(() => {
            this.dialogVisible = false
            this.$notify({ title: '成功', message: '创建成功', type: 'success' })
            this.fetchData()
          })
        }
      })
    },
    handleUpdate (row) {
      this.temp = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.dataForm.clearValidate() })
    },
    updateData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          updateStudent(this.temp).then(() => {
            this.dialogVisible = false
            this.$notify({ title: '成功', message: '更新成功', type: 'success' })
            this.fetchData()
          })
        }
      })
    },
    handleDelete (row) {
      this.$confirm('确认删除吗?', '提示', { type: 'warning' }).then(() => {
        deleteStudent(row.id).then(() => {
          this.$notify({ title: '成功', message: '删除成功', type: 'success' })
          this.fetchData()
        })
      })
    },
    handleImportClick () {
      this.importDialogVisible = true
      this.fileList = [] // 清空之前的
    },

    // 下载模板
    downloadTemplate () {
    // 这里假设你的后端地址是 http://localhost:3000/api
    // 如果你配置了代理，可以直接用 /api/students/template
      window.open('http://localhost:3000/api/students/template')
    },

    // 覆盖 ElementUI 默认的上传行为，改用我们自己的 API
    uploadFile (param) {
      this.uploading = true
      const formData = new FormData()
      formData.append('file', param.file) // 'file' 要和后端 multer 配置的一致

      importStudents(formData).then(res => {
        this.$message.success(res.msg)
        this.importDialogVisible = false
        this.fetchData() // 刷新列表
      }).catch(() => {
        this.$message.error('上传失败')
      }).finally(() => {
        this.uploading = false
        this.fileList = [] // 清空文件
      })
    }
  }
}
</script>
