import apiClient from '../services/accountClient'

export const getTariffs = async () => {
  const response = await apiClient.get('/tariffs/')
  return response.data
}

export const createTariff = async (data) => {
  const response = await apiClient.post('/tariffs/', {
    name: data.name,
    channel_type: data.channel_type,
    period: data.period_days,
    price: data.price,
    is_active: data.is_active !== undefined ? data.is_active : true,
  })
  return response.data
}

export const updateTariff = async (tariffId, data) => {
  const response = await apiClient.patch(`/tariffs/${tariffId}`, data)
  return response.data
}