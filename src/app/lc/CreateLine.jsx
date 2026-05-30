import { useState, useEffect } from 'react'
import { createLine, addChannel, renewChannel } from '../../api/lines'
import { getTariffs } from '../../api/tariffs'
import { CHANNEL_TYPES } from '../../utils/channelIcons'
import ChannelIcon from '../../components/ChannelIcon'
import Input from './Input'
import Button from './Button'

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

      for (const channel of selectedChannels) {
        const sel = selections[channel.value]
        if (renewMode) {
          await renewChannel(tenantId, targetLineId, {
            channel_type: channel.value,
            subscription_period: sel.period,
          })
        } else {
          await addChannel(tenantId, targetLineId, {
            channel_type: channel.value,
            subscription_period: sel.period,
            is_demo: sel.is_demo,
          })
        }
      }

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
    <div className="dc-fe-page dc-fe-stack" style={{ maxWidth: '640px' }}>
      <h1 className="dc-fe-title">
        {renewMode ? 'Продлить подписку' : isAddMode ? 'Добавить канал к линии' : 'Покупка линии'}
      </h1>
      <p className="dc-muted">Выбор каналов и срока по тарифам</p>

      <div className="dc-card">
        <div className="dc-card-pad">
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
            <div style={{ marginBottom: '1rem' }}>
              <p className="dc-muted-xs" style={{ marginBottom: '0.75rem' }}>
                {isAddMode ? 'Выберите провайдеров для добавления' : 'Выберите провайдеров'}
              </p>

              {loadingTariffs ? (
                <p className="dc-muted" style={{ textAlign: 'center', padding: '16px' }}>Загрузка тарифов...</p>
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
                          border: `2px solid ${isSelected ? '#3b82f6' : '#e1e4e8'}`,
                          borderRadius: '10px',
                          background: isSelected ? '#eff6ff' : 'white',
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
                            border: `2px solid ${isSelected ? '#3b82f6' : '#ccc'}`,
                            background: isSelected ? '#3b82f6' : 'white',
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
                          <ChannelIcon channelType={channel.value} size={28} />
                          <span style={{ fontWeight: '500', fontSize: '15px', flex: 1 }}>{channel.label}</span>

                          {renewMode && (() => {
                            const acc = existingChannels.find(a => (a.channel_type || a) === channel.value)
                            if (!acc?.expires_at) return null
                            const date = new Date(acc.expires_at)
                            const active = date > new Date()
                            return (
                              <span className={active ? 'dc-badge dc-badge-green' : 'dc-badge dc-badge-red'}>
                                {(() => {
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
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                              {parseFloat(tariff.price).toFixed(2)} ₽
                            </span>
                          )}
                          {isSelected && sel.is_demo && (
                            <span className="dc-badge dc-badge-amber">демо</span>
                          )}
                        </div>

                        {/* Настройки канала — только если выбран */}
                        {isSelected && (
                          <div style={{ borderTop: '1px solid #e1e4e8', padding: '14px 16px', background: '#f8faff' }}>
                            {!sel.is_demo && (
                              <div style={{ marginBottom: '12px' }}>
                                <p className="dc-muted-xs" style={{ marginBottom: '8px' }}>Период</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {['month', 'year'].map(period => {
                                    const t = findTariff(tariffs, channel.value, period)
                                    return (
                                      <div
                                        key={period}
                                        onClick={() => updateSelection(channel.value, 'period', period)}
                                        style={{
                                          flex: 1,
                                          border: `2px solid ${sel.period === period ? '#3b82f6' : '#e1e4e8'}`,
                                          borderRadius: '8px',
                                          padding: '10px 12px',
                                          cursor: 'pointer',
                                          background: sel.period === period ? '#dbeafe' : 'white',
                                          transition: 'all 0.2s',
                                          textAlign: 'center',
                                        }}
                                      >
                                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                          {period === 'month' ? 'Месяц' : 'Год'}
                                        </div>
                                        <div className="dc-muted-xs">
                                          {t ? `${parseFloat(t.price).toFixed(2)} ₽` : 'нет тарифа'}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

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

                            {!sel.is_demo && !findTariff(tariffs, channel.value, sel.period) && (
                              <p style={{ marginTop: '10px', color: '#b91c1c', fontSize: '13px', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                Нет доступного тарифа для этого канала и периода
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {!renewMode && availableChannels.length === 0 && (
                    <p className="dc-muted">Все доступные провайдеры уже подключены к этой линии</p>
                  )}
                </div>
              )}
            </div>

            {/* Итог */}
            {selectedChannels.length > 0 && (
              <div style={{
                background: '#eff6ff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <p className="dc-muted-xs">Выбрано провайдеров: {selectedChannels.length}</p>
                  <p className="dc-muted-xs">{selectedChannels.map(c => c.label).join(', ')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="dc-muted-xs">Итого</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    {totalPrice.toFixed(2)} ₽
                  </p>
                </div>
              </div>
            )}

            {error && <p className="error" style={{ marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="dc-btn dc-btn-primary"
                disabled={!canSubmit || loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Обработка...' : isAddMode
                  ? `Добавить${selectedChannels.length > 0 ? ` (${selectedChannels.length})` : ''}`
                  : selectedChannels.length > 0
                    ? `Купить (${selectedChannels.length})`
                    : 'Купить линию'}
              </button>
              <button type="button" className="dc-btn dc-btn-outline" onClick={onCancel} style={{ flex: 1 }}>
                Отмена
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateLine