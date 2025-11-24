import request from '@/utils/request'

export function getUserList () {
  return request({ url: '/users', method: 'get' })
}

export function addUser (data) {
  return request({ url: '/users', method: 'post', data })
}

export function updateUser (data) {
  return request({ url: `/users/${data.id}`, method: 'put', data })
}

export function deleteUser (id) {
  return request({ url: `/users/${id}`, method: 'delete' })
}
