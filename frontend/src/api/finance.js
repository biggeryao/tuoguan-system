import request from '@/utils/request'

export function getFinanceList () {
  return request({ url: '/finance', method: 'get' })
}

export function addFinance (data) {
  return request({ url: '/finance', method: 'post', data })
}

export function deleteFinance (id) {
  return request({ url: `/finance/${id}`, method: 'delete' })
}
