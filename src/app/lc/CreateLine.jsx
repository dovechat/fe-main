import { useState, useEffect } from 'react'
import { createLine, addChannel, renewChannel } from '../../api/lines'
import { getTariffs } from '../../api/tariffs'
import Input from './Input'
import Button from './Button'

const CHANNEL_TYPES = [
  { value: 'telegram_bot', label: 'Telegram Bot', icon: '🤖' },
  { value: 'telegram_user', label: 'Telegram User', icon: '👤' },
  { value: 'whatsapp_green', label: 'WhatsApp Green', icon: '📲' },
  { value: 'waba', label: 'WhatsApp Business', icon: '💼' },
  // { value: 'vk', label: 'VK', icon: '👥' },
]

// channelSelections: { [channel_type]: { enabled: bool, period: 'month'|'year', is_demo: bool } }
function buildInitialSelections() {
  return Object.fromEntries(
    CHANNEL_TYPES.map(c => [c.value, { enabled: false, period: 'month', is_demo: false }])
  )
}

function findTariff(tariffs, channelType, period) {
  return tariffs.find(t =>
    t.channel_type === channelType &&
    ((period === 'month' && t.period_days === 30) ||
     (period === 'year' && t.period_days === 365))
  ) || null
}

/**
 * CreateLine
 *
 * Режим 1 — новая линия:
 *   <CreateLine tenantId={...} onCreated={...} onCancel={...} />
 *
 * Режим 2 — добавить канал к существующей линии:
 *   <CreateLine tenantId={...} lineId={...} existingChannels={['telegram_bot']} onCreated={...} onCancel={...} />
 */
function CreateLine({ tenantId, lineId, existingChannels = [], renewMode = false, onCreated, onCancel }) {
  const isAddMode = Boolean(lineId)

  const [name, setName] = useState(() => parseInt(crypto.randomUUID().slice(-12), 16).toString().slice(-7))
  const [tariffs, setTariffs] = useState([])
  const [loadingTariffs, setLoadingTariffs] = useState(true)
  const [selections, setSelections] = useState(buildInitialSelections)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Провайдеры, доступные для выбора (в режиме добавления — исключаем уже купленных)
  const existingTypes = existingChannels.map(a => a.channel_type || a)
  const availableChannels = renewMode
    ? CHANNEL_TYPES.filter(c => existingTypes.includes(c.value))
    : CHANNEL_TYPES.filter(c => !existingTypes.includes(c.value))

  useEffect(() => {
    getTariffs()
      .then(setTariffs)
      .catch(e => setError(e.message))
      .finally(() => setLoadingTariffs(false))
  }, [])

  const toggleChannel = (channelType) => {
    setSelections(prev => ({
      ...prev,
      [channelType]: { ...prev[channelType], enabled: !prev[channelType].enabled }
    }))
    setError('')
  }

  const updateSelection = (channelType, field, value) => {
    setSelections(prev => ({
      ...prev,
      [channelType]: { ...prev[channelType], [field]: value }
    }))
  }

  const selectedChannels = availableChannels.filter(c => selections[c.value].enabled)

  const totalPrice = selectedChannels.reduce((sum, c) => {
    const sel = selections[c.value]
    if (sel.is_demo) return sum
    const tariff = findTariff(tariffs, c.value, sel.period)
    return sum + (tariff ? parseFloat(tariff.price) : 0)
  }, 0)

  const canSubmit = selectedChannels.length > 0 && (!isAddMode ? name.trim() : true)

  const onSubmit = async (e) => {
    e.preventDefault()
    console.log('onSubmit called', { canSubmit, selectedChannels })
    if (!canSubmit) return

    setLoading(true)
    setError('')
    try {
      let targetLineId = lineId

      if (!isAddMode) {
        const newLine = await createLine(tenantId, { name: name.trim() })
        targetLineId = newLine.id
      }

      // Добавляем каналы последовательно
      for (const channel of selectedChannels) {
        const sel = selections[channel.value]
        if (renewMode) {
          const tariff = findTariff(tariffs, channel.value, sel.period)
          await renewChannel(tenantId, targetLineId, {
            channel_type: channel.value,
            subscription_period: sel.period,
          })
          } else {
            const tariff = findTariff(tariffs, channel.value, sel.period)
            await addChannel(tenantId, targetLineId, {
              channel_type: channel.value,
              subscription_period: sel.period,
              is_demo: sel.is_demo,
            })
          }
      }






      // onCreated(targetLineId)



      const orderLines = selectedChannels.map(channel => {
        const sel = selections[channel.value]
        const tariff = findTariff(tariffs, channel.value, sel.period)
        return { channelType: channel.value, period: sel.period, price: tariff?.price ?? 0 }
      })
      const totalAmount = orderLines.reduce((sum, l) => sum + Number(l.price), 0)
      onCreated({ lineId: targetLineId, lineName: name, channels: orderLines, amount: totalAmount })





    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '640px', margin: '40px auto' }}>
      <h2>{renewMode ? 'Продлить подписку' : isAddMode ? 'Добавить канал к линии' : 'Покупка линии'}</h2>

      <form onSubmit={onSubmit} autoComplete="off">

        {/* Название — только для новой линии */}
        {!isAddMode && (
          <Input
            label="Название линии"
            type="text"
            name="name"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            required
            placeholder="Моя линия поддержки"
          />
        )}

        {/* Выбор провайдеров */}
        <div className="form-group">
          <label>
            {isAddMode
              ? 'Выберите провайдеров для добавления'
              : 'Выберите провайдеров'}
          </label>

          {loadingTariffs ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
              Загрузка тарифов...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {availableChannels.map(channel => {
                const sel = selections[channel.value]
                const tariff = findTariff(tariffs, channel.value, sel.period)
                const isSelected = sel.enabled

                return (
                  <div
                    key={channel.value}
                    style={{
                      border: `2px solid ${isSelected ? '#4A90E2' : '#e1e4e8'}`,
                      borderRadius: '10px',
                      background: isSelected ? '#f0f7ff' : 'white',
                      transition: 'all 0.2s',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Заголовок карточки — кликабельный */}
                    <div
                      onClick={() => toggleChannel(channel.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? '#4A90E2' : '#ccc'}`,
                        background: isSelected ? '#4A90E2' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '22px' }}>{channel.icon}</span>
                      <span style={{ fontWeight: '500', fontSize: '15px', flex: 1 }}>{channel.label}</span>


                      {renewMode && (() => {
                        const acc = existingChannels.find(a => (a.channel_type || a) === channel.value)
                        if (!acc?.expires_at) return null
                        const date = new Date(acc.expires_at)
                        const active = date > new Date()
                        return (
                          <span style={{ fontSize: '12px', color: active ? '#155724' : '#721c24', background: active ? '#d4edda' : '#f8d7da', padding: '2px 8px', borderRadius: '4px' }}>
                            {(() => {
                              const sel = selections[channel.value]
                              const t = findTariff(tariffs, channel.value, sel.period)
                              const days = t?.period_days || 30
                              const base = date > new Date() ? date : new Date()
                              const newDate = new Date(base)
                              newDate.setDate(newDate.getDate() + days)
                              return isSelected
                                ? `будет до ${newDate.toLocaleDateString('ru-RU')}`
                                : active ? `до ${date.toLocaleDateString('ru-RU')}` : `истёк ${date.toLocaleDateString('ru-RU')}`
                            })()}
                                                      </span>
                        )
                      })()}


                      {isSelected && !sel.is_demo && tariff && (
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                          {parseFloat(tariff.price).toFixed(2)} ₽
                        </span>
                      )}
                      {isSelected && sel.is_demo && (
                        <span style={{ fontSize: '13px', color: '#856404', background: '#fff3cd', padding: '2px 8px', borderRadius: '4px' }}>
                          демо
                        </span>
                      )}
                    </div>

                    {/* Настройки канала — только если выбран */}
                    {isSelected && (
                      <div style={{ borderTop: '1px solid #e1e4e8', padding: '14px 16px', background: '#fafcff' }}>
                        {/* Период */}
                        {!sel.is_demo && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>Период</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {['month', 'year'].map(period => {
                                const t = findTariff(tariffs, channel.value, period)
                                return (
                                  <div
                                    key={period}
                                    onClick={() => updateSelection(channel.value, 'period', period)}
                                    style={{
                                      flex: 1,
                                      border: `2px solid ${sel.period === period ? '#4A90E2' : '#e1e4e8'}`,
                                      borderRadius: '8px',
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      background: sel.period === period ? '#e8f2ff' : 'white',
                                      transition: 'all 0.2s',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                      {period === 'month' ? 'Месяц' : 'Год'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {t ? `${parseFloat(t.price).toFixed(2)} ₽` : 'нет тарифа'}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Демо */}
                        {/*
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                          <input
                            type="checkbox"
                            checked={sel.is_demo}
                            onChange={e => updateSelection(channel.value, 'is_demo', e.target.checked)}
                          />
                          Демо-режим (бесплатно, 7 дней, с ограничениями)
                        </label>
                        */}

                        {/* Предупреждение если нет тарифа */}
                        {!sel.is_demo && !findTariff(tariffs, channel.value, sel.period) && (
                          <div style={{ marginTop: '10px', color: '#721c24', fontSize: '13px', background: '#f8d7da', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                            Нет доступного тарифа для этого канала и периода
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {!renewMode && availableChannels.length === 0 && (
                <div>Все доступные провайдеры уже подключены к этой линии</div>
              )}
            </div>
          )}
        </div>

        {/* Итог */}
        {selectedChannels.length > 0 && (
          <div style={{
            background: '#f0f7ff',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4A90E2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#555' }}>
                Выбрано провайдеров: {selectedChannels.length}
              </div>
              <div style={{ fontSize: '13px', color: '#555' }}>
                {selectedChannels.map(c => c.label).join(', ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#555' }}>Итого</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>
                {totalPrice.toFixed(2)} ₽
              </div>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            type="submit"
            variant="success"
            loading={loading}
            disabled={!canSubmit}
            style={{ flex: 1 }}
          >
            {isAddMode
              ? `Добавить ${selectedChannels.length > 0 ? `(${selectedChannels.length})` : ''}`
              : selectedChannels.length > 0
                ? `Купить (${selectedChannels.length})`
                : 'Купить линию'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Отмена
          </Button>
        </div>

      </form>
    </div>
  )
}

export default CreateLine