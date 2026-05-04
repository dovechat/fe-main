import { useState, useEffect } from 'react'
import { getTenants, switchTenant } from '../../api/tenants'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'

function TenantList({ currentTenantId, onTenantClick, onCreateClick, onTenantSelected }) {
  const { updateToken } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(null)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const data = await getTenants()
      setTenants(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = async (tenantId, e) => {
    e.stopPropagation() // Останавливаем всплытие, чтобы не сработал onClick карточки
    if (tenantId === currentTenantId) return // Уже активный

    console.log('Switching to tenant:', tenantId) // DEBUG
    
    try {
      setSwitching(tenantId)
      const data = await switchTenant(tenantId)
      console.log('Switch response:', data) // DEBUG
      
      // Обновляем токен через AuthContext
      updateToken(data.access_token, data.refresh_token)
      
      // Уведомляем родительский компонент об изменении активной компании
      if (onTenantSelected) {
        onTenantSelected(tenantId)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return <div className="dashboard">Загрузка компаний...</div>
  }

  if (error) {
    return <div className="dashboard error">{error}</div>
  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <h2 className="section-title">Ваши компании</h2>
      {/* /HEADER */}

      {/* BANNER_NO_ACTIVE */}
      {!currentTenantId && tenants.length > 0 && (
        <p style={{ color: '#e74c3c', fontWeight: '500', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
          Чтобы начать работу — активируйте одну из компаний ниже
        </p>
      )}
      {/* /BANNER_NO_ACTIVE */}


      {tenants.length === 0 ? (
        /* EMPTY */
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            У вас пока нет ни одной компании
          </p>
          <Button variant="success" onClick={onCreateClick}>
            Создать первую компанию
          </Button>
        </div>
        /* /EMPTY */
      ) : (
        <>
          {/* LIST */}
<div style={{ width: '85%', margin: '0', border: '1px solid #e1e4e8', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>

  {/* КАРТОЧКА */}
  {tenants.map((tenant, index) => (
    <div
      key={tenant.id}
      className={`tenant-card ${tenant.id === currentTenantId ? 'active' : ''}`}
      onClick={() => {
        if (!currentTenantId) {
          alert('Активируйте компанию прежде, чем редактировать её')
          return
        }
        onTenantClick(tenant)
      }}
      style={{
        padding: '8px 12px',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >

      {/* ИМЯ */}
      <span style={{ fontWeight: '600', fontSize: '14px', color: '#5e8df4', flexShrink: 1, minWidth: 0, wordBreak: 'break-word' }}>
        {tenant.name}
      </span>
      {/* /ИМЯ */}

      {/* ДЕТАЛИ */}
      <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {tenant.locale} • {tenant.payment} • {tenant.status}
      </span>
      {/* /ДЕТАЛИ */}

      {/* СТАТУС/КНОПКА */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        {tenant.id === currentTenantId ? (
          <span className="tenant-badge">Активный</span>
        ) : (
          <Button
            variant="primary"
            onClick={(e) => handleSelectTenant(tenant.id, e)}
            disabled={switching === tenant.id}
            style={{ padding: '4px 10px', fontSize: '12px', width: 'auto' }}
          >
            {switching === tenant.id ? '...' : 'Активировать'}
          </Button>
        )}
      </div>
      {/* /СТАТУС/КНОПКА */}

    </div>


  ))}
  {/* /КОНЕЦ КАРТОЧКА */}

</div>
{/* /LIST */}

          {/* CREATE_BTN */}
          <Button variant="success" onClick={onCreateClick} style={{ width: '240px', display: 'block', margin: '0' }}>
            + Создать новую компанию
          </Button>
          {/* /CREATE_BTN */}
        </>
      )}
    </div>
  )
}

export default TenantList
