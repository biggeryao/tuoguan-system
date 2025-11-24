// src/api/student.js
import request from '@/utils/request'

// 获取学生列表
export function getStudentList (params) {
  return request({
    url: '/students', // 对应后端的 /api/students
    method: 'get',
    params
  })
}

// 新增学生
export function addStudent (data) {
  return request({
    url: '/students',
    method: 'post',
    data // post 请求要把数据放在 data 里
  })
}

// 修改学生
export function updateStudent (data) {
  return request({
    url: '/students',
    method: 'put',
    data
  })
}

// 删除学生
export function deleteStudent (id) {
  return request({
    url: `/students/${id}`, // 注意这里是反引号 ` ，因为要拼接 id
    method: 'delete'
  })
}

// 专属续费接口
export function renewStudent (data) {
  return request({
    url: '/students/renew',
    method: 'post',
    data
  })
}
// 导入学生
export function importStudents (data) {
  return request({
    url: '/students/import',
    method: 'post',
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' } // 必填
  })
}
