import apiClient from '../services/accountClient'

// Получить список доступов к линиям для сотрудника (если нужен отдельный эндпоинт)
export const getLinePermissions = async (tenantId, userId) => {
  const response = await apiClient.get(`/tenants/${tenantId}/members/line-permissions?user_id=${userId}`)
  return response.data
}

// Выдать доступ к линии
export const addLinePermission = async (tenantId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/members/line-permissions`, data)
  return response.data
}

// Отозвать доступ к линии
export const removeLinePermission = async (tenantId, userId, lineId) => {
  const response = await apiClient.delete(
    `/tenants/${tenantId}/members/line-permissions/${userId}/${lineId}`
  )
  return response.data
}

// Получить список доступов для сотрудника
export const getUserLinePermissions = async (tenantId, userId) => {
  const response = await apiClient.get(
    `/tenants/${tenantId}/members/line-permissions`,
    { params: { user_id: userId } }
  )
  return response.data
}