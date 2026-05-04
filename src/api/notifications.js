import accountClient from '../services/accountClient'

export const getNotificationSettings = async (tenantId) => {
  const response = await accountClient.get(`/tenants/${tenantId}/notifications/settings`)
  return response.data
}

export const createNotificationSettings = async (tenantId, data) => {
  const response = await accountClient.post(`/tenants/${tenantId}/notifications/settings`, {
    notification_type: data.notification_type,
    channel: data.channel,
    target: data.target,
    enabled: data.enabled !== undefined ? data.enabled : true,
  })
  return response.data
}

export const updateNotificationSettings = async (tenantId, settingsId, data) => {
  const response = await accountClient.patch(`/tenants/${tenantId}/notifications/settings/${settingsId}`, data)
  return response.data
}

export const deleteNotificationSettings = async (tenantId, settingsId) => {
  const response = await accountClient.delete(`/tenants/${tenantId}/notifications/settings/${settingsId}`)
  return response.data
}

export const getNotificationHistory = async (tenantId, params = {}) => {
  const response = await accountClient.get(`/tenants/${tenantId}/notifications/history`, { params })
  return response.data
}