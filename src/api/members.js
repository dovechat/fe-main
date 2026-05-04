import apiClient from '../services/accountClient'

// Получить список сотрудников компании
export const getMembers = async (tenantId) => {
  const response = await apiClient.get(`/tenants/${tenantId}/members`)
  return response.data
}

// Добавить сотрудника
export const addMember = async (tenantId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/members`, data)
  return response.data
}

// Удалить сотрудника
export const removeMember = async (tenantId, userId) => {
  const response = await apiClient.delete(`/tenants/${tenantId}/members/${userId}`)
  return response.data
}