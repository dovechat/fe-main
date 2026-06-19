import { useState, useEffect } from 'react'
import { Building2, Users, Pencil, Landmark, ArrowLeft } from 'lucide-react'
import MembersList from './MembersList'


function paymentLabel(p) {
  if (p === 'acquiring') return 'Эквайринг'
  if (p === 'invoice') return 'Счёт'
  return p || '—'
}

function statusLabel(s) {
  if (s === 'active') return 'Активна'
  if (s === 'inactive') return 'Неактивна'
  return s || '—'
}

function dash(v) {
  if (v == null || String(v).trim() === '') return null
  return v
}

const PLACEHOLDER = {
  address: 'ул. Тестовая, 1',
  phone: '+7 999 123-45-67',
  email: 'test@example.com',
  inn: '0000000000',
}

function TenantDetails({ tenant, onEdit, onEditBanking, onBack, crmSettings, onEditCrm }) {
  const [showInstruction, setShowInstruction] = useState(false)
  const bd = tenant.banking_details || {}
  const [staffCount, setStaffCount] = useState(
    () => (tenant.employee_count != null ? tenant.employee_count : null),
  )

  useEffect(() => {
    setStaffCount(tenant.employee_count != null ? tenant.employee_count : null)
  }, [tenant.id])

  return (
    <div className="dc-fe-page dc-fe-stack">
      <div className="dc-fe-header">
        <div>
          <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden />
            К списку
          </button>
          <h1 className="dc-fe-title" style={{ marginTop: '0.75rem' }}>
            {tenant.name}
          </h1>
          <p className="dc-fe-subtitle">
            Локаль: {tenant.locale} · Оплата: {paymentLabel(tenant.payment)} · Статус: {statusLabel(tenant.status)}
          </p>
        </div>
      </div>

      <div className="dc-card dc-card-pad">
        <div className="dc-company-row">
          <div style={{ display: 'flex', gap: '1rem', minWidth: 0, flex: 1 }}>
            <div className="dc-icon-tile">
              <Building2 size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="dc-company-title" style={{ marginBottom: '0.75rem' }}>
                Карточка компании
              </h2>
              <div className="dc-field-grid">
                <div>
                  <p className="dc-muted-xs">Адрес</p>
                  <p className="dc-strong">{dash(tenant.address) ?? PLACEHOLDER.address}</p>
                </div>
                <div>
                  <p className="dc-muted-xs">Телефон</p>
                  <p className="dc-strong">{dash(tenant.phone) ?? PLACEHOLDER.phone}</p>
                </div>
                <div>
                  <p className="dc-muted-xs">Email</p>
                  <p className="dc-strong">{dash(tenant.email) ?? PLACEHOLDER.email}</p>
                </div>
                <div>
                  <p className="dc-muted-xs">ИНН</p>
                  <p className="dc-strong">{dash(tenant.inn) ?? PLACEHOLDER.inn}</p>
                </div>
                <div>
                  <p className="dc-muted-xs">Сотрудники</p>
                  <p className="dc-strong" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} style={{ color: '#3b82f6' }} aria-hidden />
                    {staffCount != null ? staffCount : '—'}
                  </p>
                </div>
                <div>
                  <p className="dc-muted-xs">ID</p>
                  <p className="dc-strong" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}>
                    {tenant.id}
                  </p>
                </div>
              </div>

              <div className="dc-req-block">
                <p className="dc-muted-xs" style={{ marginBottom: '0.5rem' }}>Реквизиты</p>
                <div className="dc-req-grid">
                  <div>
                    <span className="dc-muted-xs">Банк: </span>
                    <span className="dc-strong">{bd.bank_name || '—'}</span>
                  </div>
                  <div>
                    <span className="dc-muted-xs">Р/С: </span>
                    <span className="dc-strong">{bd.account_number || '—'}</span>
                  </div>
                  <div>
                    <span className="dc-muted-xs">БИК: </span>
                    <span className="dc-strong">{bd.bic || '—'}</span>
                  </div>
                </div>
                {(bd.corr_account || bd.kpp || bd.currency) && (
                  <div className="dc-req-grid" style={{ marginTop: '0.5rem' }}>
                    <div>
                      <span className="dc-muted-xs">К/С: </span>
                      <span className="dc-strong">{bd.corr_account || '—'}</span>
                    </div>
                    <div>
                      <span className="dc-muted-xs">КПП: </span>
                      <span className="dc-strong">{bd.kpp || '—'}</span>
                    </div>
                    <div>
                      <span className="dc-muted-xs">Валюта: </span>
                      <span className="dc-strong">{bd.currency || '—'}</span>
                    </div>
                  </div>
                )}
              </div>



<div className="dc-req-block">
  <p className="dc-muted-xs" style={{ marginBottom: '0.5rem' }}>Интеграция CRM</p>
  <div className="dc-req-grid">
    <div>
      <span className="dc-muted-xs">При отсутствии сделки: </span>
      <span className="dc-strong">
        {crmSettings?.no_deal_action === 'create_lead' ? 'Создать лид'
          : crmSettings?.no_deal_action === 'create_deal' ? 'Создать сделку'
          : 'Ничего не делать'}
      </span>
    </div>
    <div>
      <span className="dc-muted-xs">Создавать контакт: </span>
      <span className="dc-strong">{crmSettings?.auto_create_contact ? 'Да' : 'Нет'}</span>
    </div>
  </div>
  <button className="dc-btn dc-btn-sm" onClick={() => setShowInstruction(true)} style={{ marginTop: '0.75rem' }}>
    Инструкция по подключению
  </button>
  {showInstruction && (
    <div className="dc-modal-overlay" onClick={() => setShowInstruction(false)}>
      <div className="dc-modal" onClick={e => e.stopPropagation()}>
        <div className="dc-modal-header">
          <span className="dc-modal-title">Инструкция по подключению CRM</span>
          <button className="dc-modal-close" onClick={() => setShowInstruction(false)}>×</button>
        </div>
        <div className="dc-modal-body">
          <p>Текст инструкции</p>
        </div>
      </div>
    </div>
  )}
</div>




              <div className="dc-detail-toolbar">
                <button type="button" className="dc-btn dc-btn-primary" onClick={onEdit}>
                  <Pencil size={16} aria-hidden />
                  Редактировать
                </button>
                <button type="button" className="dc-btn dc-btn-outline" onClick={onEditBanking}>
                  <Landmark size={16} aria-hidden />
                  {bd.bank_name || bd.account_number ? 'Изменить реквизиты' : 'Добавить реквизиты'}
                </button>

<button type="button" className="dc-btn dc-btn-outline" onClick={onEditCrm}>
  Настройки CRM
</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dc-card dc-card-pad">
        <h3 className="dc-company-title" style={{ marginBottom: '0.75rem' }}>
          Сотрудники
        </h3>
        <MembersList tenantId={tenant.id} onCountChange={setStaffCount} />
      </div>
    </div>
  )
}

export default TenantDetails