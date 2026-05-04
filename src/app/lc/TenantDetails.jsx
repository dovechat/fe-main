import Button from './Button'
import MembersList from './MembersList'

function TenantDetails({ tenant, onEdit, onEditBanking, onBack }) {
  return (
    <div className="dashboard">
      <div style={{ marginBottom: '20px' }}>
        <Button variant="secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Назад к списку
        </Button>
        
        <h2>{tenant.name}</h2>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
          Основная информация
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <strong>Название:</strong> {tenant.name}
          </div>
          <div>
            <strong>ID:</strong> <code style={{ fontSize: '12px', background: '#f5f7fa', padding: '2px 6px', borderRadius: '4px' }}>{tenant.id}</code>
          </div>
          <div>
            <strong>Локаль:</strong> {tenant.locale}
          </div>
          <div>
            <strong>Способ оплаты:</strong> {tenant.payment}
          </div>
          <div>
            <strong>Статус:</strong> {tenant.status}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Button variant="primary" onClick={onEdit}>
            Редактировать
          </Button>
        </div>
      </div>

      {/* Банковские реквизиты */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
          Банковские реквизиты (RU)
        </h3>

        {tenant.banking_details ? (
          <>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              <div>
                <strong>Банк:</strong> {tenant.banking_details.bank_name}
              </div>
              <div>
                <strong>Номер счёта:</strong> {tenant.banking_details.account_number}
              </div>
              <div>
                <strong>БИК:</strong> {tenant.banking_details.bic}
              </div>
              <div>
                <strong>Корр. счёт:</strong> {tenant.banking_details.corr_account}
              </div>
              <div>
                <strong>КПП:</strong> {tenant.banking_details.kpp}
              </div>
              <div>
                <strong>Валюта:</strong> {tenant.banking_details.currency}
              </div>
              <div>
                <strong>Основной счёт:</strong> {tenant.banking_details.is_primary ? 'Да' : 'Нет'}
              </div>
            </div>
            <Button variant="primary" onClick={onEditBanking}>
              Редактировать реквизиты
            </Button>
          </>
        ) : (
          <div>
            <p style={{ color: '#666', marginBottom: '16px' }}>Реквизиты не заполнены</p>
            <Button variant="success" onClick={onEditBanking}>
              Добавить реквизиты
            </Button>
          </div>
        )}
      </div>

      {/* Сотрудники */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <MembersList tenantId={tenant.id} />
      </div>
    </div>
  )
}

export default TenantDetails