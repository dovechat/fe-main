import apiClient from '../services/accountClient'

// Получить список компаний пользователя
export const getTenants = async () => {
  const response = await apiClient.get('/tenant/')
  return response.data
}

// Создать компанию
export const createTenant = async (data) => {
  const response = await apiClient.post('/tenant/create', {
    name: data.name,
    locale: data.locale || 'en_US',
    payment: data.payment || 'acquiring',
    status: data.status || 'active',
  })
  return response.data
}

// Получить компанию по ID
export const getTenant = async (tenantId) => {
  const response = await apiClient.get(`/tenant/${tenantId}`)
  return response.data
}

// Обновить компанию
export const updateTenant = async (tenantId, data) => {
  const response = await apiClient.patch(`/tenant/${tenantId}`, data)
  return response.data
}

// Удалить компанию
export const deleteTenant = async (tenantId) => {
  const response = await apiClient.delete(`/tenant/${tenantId}`)
  return response.data
}

// Switch tenant (переключиться на компанию) - ИСПРАВЛЕНО
export const switchTenant = async (tenantId) => {
  console.log('switchTenant called with:', tenantId) // DEBUG
  
  // Используем query параметр вместо JSON тела
  const response = await apiClient.post(`/auth/switch-tenant?tenant_id=${tenantId}`)
  console.log('Switch tenant response:', response.data) // DEBUG
  return response.data
}

export const updateBankingRu = async (tenantId, data) => {
  const response = await apiClient.patch(`/tenant/${tenantId}/banking/ru`, data)
  return response.data
}