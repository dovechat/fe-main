import { useState, useEffect } from 'react'
import Button from './Button'
import { getTenant } from '../../api/tenants'
import { createPayment } from '../../api/billing'

const CHANNEL_LABELS = {
  telegram_bot: 'Telegram Bot',
  telegram_user: 'Telegram User',
  whatsapp_green: 'WhatsApp Green',
  waba: 'WABA',
  vk: 'VK',
}

export default function PaymentForm({ tenantId, lineId, order, onPaid }) {
  const [banking, setBanking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tenantId) {
      getTenant(tenantId).then(t => setBanking(t.banking_details)).catch(() => {})
    }
  }, [tenantId])

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      await createPayment(tenantId, order?.amount ?? 0)
      onPaid()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '32px', padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Левая часть */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ margin: 0 }}>Оплата</h2>

        {/* Способ оплаты */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              flex: 1, padding: '12px', border: '2px solid #2563eb',
              borderRadius: '8px', background: '#eff6ff', cursor: 'pointer',
              fontWeight: 600, color: '#2563eb',
            }}
          >
            По реквизитам
          </button>
          <button
            disabled
            style={{
              flex: 1, padding: '12px', border: '2px solid #e5e7eb',
              borderRadius: '8px', background: '#f9fafb', cursor: 'not-allowed',
              fontWeight: 600, color: '#9ca3af',
            }}
          >
            Платёжная система
          </button>
        </div>

        {/* Реквизиты */}
        {banking ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <h3 style={{ margin: '0 0 8px' }}>Реквизиты</h3>
            {[
              ['Банк', banking.bank_name],
              ['Счёт', banking.account_number],
              ['БИК', banking.bic],
              ['Корр. счёт', banking.corr_account],
              ['КПП', banking.kpp],
              ['Валюта', banking.currency],
            ].map(([label, value]) => value ? (
              <div key={label} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#6b7280', minWidth: '100px' }}>{label}:</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ) : null)}
          </div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>Загрузка реквизитов...</div>
        )}

        {/* Связь с бухгалтером */}
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Связь с бухгалтером</h3>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#374151' }}>
            <span>test@test.com</span>
          </div>
        </div>
      </div>

      {/* Правая часть — заказ */}
      <div style={{
        width: '280px', display: 'flex', flexDirection: 'column', gap: '16px',
        background: '#f9fafb', borderRadius: '12px', padding: '20px',
      }}>
        <h3 style={{ margin: 0 }}>Ваш заказ</h3>
        <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 600 }}>{order?.lineName || 'Линия'}</div>
          {(order?.channels || []).map((ch, i) => (
            <div key={i} style={{ color: '#6b7280', paddingLeft: '8px' }}>
              {CHANNEL_LABELS[ch.channelType] || ch.channelType}
              {ch.price ? ` — ${ch.price} ₽` : ''}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
            <span>Итого</span>
            <span>{order?.amount ?? 0} ₽</span>
          </div>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: '13px' }}>{error}</div>}

        <Button variant="success" loading={loading} onClick={handlePay}>
          Оплатить
        </Button>
      </div>
    </div>
  )
}