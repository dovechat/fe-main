import apiClient from '../services/accountClient'

// Получить список линий компании
export const getLines = async (tenantId) => {
  const response = await apiClient.get(`/tenants/${tenantId}/lines/`)
  return response.data
}

// Получить линию
export const getLine = async (tenantId, lineId) => {
  const response = await apiClient.get(`/tenants/${tenantId}/lines/${lineId}`)
  return response.data
}

// Создать линию
export const createLine = async (tenantId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/lines/`, {
    name: data.name,
  })
  return response.data
}

// Получить детали линии
export const getChannelAccount = async (tenantId, lineId) => {
  const response = await apiClient.get(`/tenants/${tenantId}/lines/${lineId}/account/`)
  return response.data
}

// Добавить канал к линии
export const addChannel = async (tenantId, lineId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/lines/${lineId}/channels`, {
    channel_type: data.channel_type,
    subscription_period: data.subscription_period || 'month',
    is_demo: data.is_demo || false,
  })
  return response.data
}

// Продлить канал
export const renewChannel = async (tenantId, lineId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/lines/${lineId}/channels/renew`, {
    channel_type: data.channel_type,
    subscription_period: data.subscription_period || 'month',
    amount: data.amount || 0,

  })
  return response.data
}

// Обновить линию
export const updateLine = async (tenantId, lineId, data) => {
  const response = await apiClient.patch(`/tenants/${tenantId}/lines/${lineId}`, data)
  return response.data
}

// Удалить линию
export const deleteLine = async (tenantId, lineId) => {
  const response = await apiClient.delete(`/tenants/${tenantId}/lines/${lineId}`)
  return response.data
}

// Переключение статуса канала
export const toggleChannelConnection = async (tenantId, lineId, channelType) => {
  const response = await apiClient.patch(`/tenants/${tenantId}/lines/${lineId}/account/toggle/${channelType}`)
  return response.data
}


// Обновить credentials Telegram Bot
export const updateTelegramBot = async (tenantId, lineId, data) => {
  const response = await apiClient.patch(`/tenants/${tenantId}/lines/${lineId}/account/telegram-bot`, data)
  return response.data
}

// Обновить credentials Telegram User
export const updateTelegramUser = async (tenantId, lineId, data) => {
  console.log('updateTelegramUser вызывается с:', { tenantId, lineId, data })
  const response = await apiClient.patch(`/tenants/${tenantId}/lines/${lineId}/account/telegram-user`, data)
  console.log('updateTelegramUser ответ:', response)
  return response.data
}

// Обновить credentials VK
export const updateVk = async (tenantId, lineId, data) => {
  const response = await apiClient.patch(`/tenants/${tenantId}/lines/${lineId}/account/vk`, data)
  return response.data
}

export const updateWhatsAppGreen = async (tenantId, lineId, data) => {
  const response = await apiClient.post(`/tenants/${tenantId}/lines/${lineId}/account/whatsapp-green`, {
    id_instance: data.idInstance,
    api_token: data.apiTokenInstance
  })
  return response.data
}

export async function updateWaba(tenantId, lineId, data) {
  const response = await apiClient.post(`/tenants/${tenantId}/lines/${lineId}/account/waba`, data);
  return response.data;
}