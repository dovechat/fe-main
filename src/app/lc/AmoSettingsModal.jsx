import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function AmoSettingsModal({ tenantId, onSaved, onClose }) {
  const { token } = useAuth()
  const [domain, setDomain] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/crm/api/v1/install/amo/save-tokens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, domain, access_token: accessToken, refresh_token: '' }),
      })
      if (!resp.ok) throw new Error()
      onSaved()
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dc-modal-overlay" onClick={onClose}>
      <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="dc-company-title" style={{ marginBottom: '1rem' }}>Подключение AmoCRM</h2>
        <div className="form-group">
          <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Домен</label>
          <input className="dc-input" placeholder="new1782329019.amocrm.ru" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Долгосрочный токен</label>
          <input className="dc-input" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
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

export default AmoSettingsModal