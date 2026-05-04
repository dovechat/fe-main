import accountClient from '../services/accountClient'

export const getBalance = async (tenantId) => {
  const response = await accountClient.get(`/tenants/${tenantId}/billing/balance`)
  return response.data
}

export const getBalanceHistory = async (tenantId, skip = 0, limit = 100) => {
  const response = await accountClient.get(`/tenants/${tenantId}/billing/balance/history`, {
    params: { skip, limit }
  })
  return response.data
}

export const getPayments = async (tenantId, skip = 0, limit = 100) => {
  const response = await accountClient.get(`/tenants/${tenantId}/billing/payments`, {
    params: { skip, limit }
  })
  return response.data
}

export const createPayment = async (tenantId, amount) => {
  const response = await accountClient.post(`/tenants/${tenantId}/billing/payments`, {
    amount,
    payment_method: 'invoice',
  })
  return response.data
}