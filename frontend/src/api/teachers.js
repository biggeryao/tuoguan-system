import request from '@/utils/request'

export function getTeacherList () {
  return request({ url: '/teachers', method: 'get' })
}

export function addTeacher (data) {
  return request({ url: '/teachers', method: 'post', data })
}

export function updateTeacher (data) {
  return request({ url: `/teachers/${data.id}`, method: 'put', data })
}

export function deleteTeacher (id) {
  return request({ url: `/teachers/${id}`, method: 'delete' })
}

export function getSalaryHistory (id) {
  return request({ url: `/teachers/${id}/salary`, method: 'get' })
}

// 预计算接口
export function calcSalaryPreview (data) {
  return request({ url: '/teachers/calc-preview', method: 'post', data })
}

export function paySalary (data) {
  return request({ url: '/teachers/pay', method: 'post', data })
}
