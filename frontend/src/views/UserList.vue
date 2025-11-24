<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span style="font-weight: bold">🛡️ 系统账号管理</span>
        <el-button
          style="float: right"
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="handleCreate"
          >新增账号</el-button
        >
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column
          prop="username"
          label="登录账号"
          width="150"
        ></el-table-column>
        <el-table-column prop="name" label="显示昵称" width="150">
          <template slot-scope="scope">
            <div>{{ scope.row.name }}</div>
            <!-- 如果绑定了档案，显示一个小标签 -->
            <el-tag
              size="mini"
              type="info"
              v-if="scope.row.teacher_profile_name"
            >
              🔗 {{ scope.row.teacher_profile_name }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="角色权限" width="150" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.role === 'admin'" type="danger"
              >超级管理员</el-tag
            >
            <el-tag v-else type="primary">普通老师</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间">
          <template slot-scope="scope">{{ scope.row.created_at }}</template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-edit"
              @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="mini"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              :disabled="scope.row.username === 'admin'"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗：新增/编辑 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="450px">
      <el-form :model="temp" :rules="rules" ref="dataForm" label-width="80px">
        <el-form-item label="账号" prop="username">
          <!-- 编辑模式下禁止改账号 -->
          <el-input
            v-model="temp.username"
            :disabled="!!temp.id"
            placeholder="登录用的用户名"
          ></el-input>
        </el-form-item>

        <el-form-item label="昵称" prop="name">
          <el-input v-model="temp.name" placeholder="如：张校长"></el-input>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="temp.role" style="width: 100%">
            <el-option
              label="普通老师 (仅学生管理)"
              value="teacher"
            ></el-option>
            <el-option label="管理员 (全权限)" value="admin"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联档案" v-if="temp.role === 'teacher'">
          <el-select
            v-model="temp.teacher_id"
            placeholder="请选择对应的教师档案"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="item in teacherOptions"
              :key="item.id"
              :label="item.name + ' (' + item.phone + ')'"
              :value="item.id"
            >
            </el-option>
          </el-select>
          <div style="font-size: 12px; color: #999; line-height: 1.2">
            💡 绑定后，该账号登录只能看到自己班级的学生
          </div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="temp.password"
            type="password"
            placeholder="不修改请留空"
            show-password
          ></el-input>
          <div
            v-if="temp.id"
            style="font-size: 12px; color: #999; line-height: 1.2"
          >
            注：如果不需要重置密码，请保持为空
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUserList, addUser, updateUser, deleteUser } from '@/api/user'
import { getTeacherList } from '@/api/teachers'

export default {
  data () {
    return {
      list: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '',
      teacherOptions: [],
      temp: { id: undefined, username: '', name: '', role: 'teacher', password: '', teacher_id: '' },
      rules: {
        username: [{ required: true, message: '必填', trigger: 'blur' }],
        name: [{ required: true, message: '必填', trigger: 'blur' }],
        role: [{ required: true, message: '必选', trigger: 'change' }]
      }
    }
  },
  created () {
    this.fetchData()
    this.fetchTeachers()
  },
  methods: {
    fetchData () {
      this.loading = true
      getUserList().then(res => {
        this.list = res.data
        this.loading = false
      })
    },
    fetchTeachers () {
      getTeacherList().then(res => {
        this.teacherOptions = res.data
      })
    },
    resetTemp () {
      this.temp = { id: undefined, username: '', name: '', role: 'teacher', password: '', teacher_id: '' }
    },
    handleCreate () {
      this.resetTemp()
      this.dialogTitle = '新增账号'
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.dataForm.clearValidate() })
    },
    handleEdit (row) {
      this.temp = { ...row, password: '' } // 密码置空，防止显示加密字符串
      this.dialogTitle = '编辑/重置密码'
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.dataForm.clearValidate() })
    },
    submitForm () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          // 如果是新增，密码必填
          if (!this.temp.id && !this.temp.password) {
            this.$message.warning('新用户必须设置密码')
            return
          }

          const api = this.temp.id ? updateUser : addUser
          api(this.temp).then(res => {
            this.$message.success(res.msg)
            this.dialogVisible = false
            this.fetchData()
          })
        }
      })
    },
    handleDelete (row) {
      this.$confirm(`确认删除用户 "${row.name}" 吗? 此操作不可恢复！`, '警告', { type: 'warning' })
        .then(() => {
          deleteUser(row.id).then(() => {
            this.$message.success('删除成功')
            this.fetchData()
          })
        })
    }
  }
}
</script>
