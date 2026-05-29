import { useState } from 'react'
import { updateCrmSettings } from '../../api/tenants'

function CrmSettingsModal({ tenantId, settings, onSaved, onClose }) {
  const [noDealAction, setNoDealAction] = useState(settings?.no_deal_action || 'nothing')
  const [autoCreateContact, setAutoCreateContact] = useState(settings?.auto_create_contact ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const updated = await updateCrmSettings(tenantId, {
        no_deal_action: noDealAction,
        auto_create_contact: autoCreateContact,
      })
      onSaved(updated)
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dc-modal-overlay" onClick={onClose}>
      <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="dc-company-title" style={{ marginBottom: '1rem' }}>Настройки CRM</h2>
        <div className="form-group">
          <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>
            При отсутствии сделки
          </label>
          <select className="dc-select" value={noDealAction} onChange={(e) => setNoDealAction(e.target.value)}>
            <option value="nothing">Ничего не делать</option>
            <option value="create_lead">Создать лид</option>
            <option value="create_deal">Создать сделку</option>
          </select>
        </div>
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoCreateContact}
              onChange={(e) => setAutoCreateContact(e.target.checked)}
            />
            <span className="dc-muted-xs">Создавать контакт автоматически</span>
          </label>
        </div>
        {error && <p className="error" style={{ margin: '0.75rem 0 0' }}>{error}</p>}
        <div className="dc-detail-toolbar" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="dc-btn dc-btn-outline" onClick={onClose}>Отмена</button>
          <button type="button" className="dc-btn dc-btn-primary" disabled={loading} onClick={handleSave}>
            {loading ? '…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CrmSettingsModal