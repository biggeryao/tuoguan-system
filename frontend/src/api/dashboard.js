import request from '@/utils/request'

export function getTopStats () {
  return request({ url: '/dashboard/stats', method: 'get' })
}
export function getFinanceChart () {
  return request({ url: '/dashboard/chart/finance', method: 'get' })
}
export function getStudentChart () {
  return request({ url: '/dashboard/chart/student', method: 'get' })
}
