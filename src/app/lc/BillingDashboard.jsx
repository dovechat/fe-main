import { useState, useEffect } from 'react'
import { getBalance, getBalanceHistory, getPayments } from '../../api/billing'

function BillingDashboard({ tenantId }) {
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotal, setHistoryTotal] = useState(0)
  const HISTORY_LIMIT = 50
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState({ balance: true, history: true, payments: true })
  const [error, setError] = useState('')

  useEffect(() => {
    if (tenantId) loadData()
  }, [tenantId])


  const loadData = async () => {
    try {
      setError('')
      let balanceData
      try {
        balanceData = await getBalance(tenantId)
      } catch {
        balanceData = await getBalance(tenantId)
      }
      setBalance(balanceData)
      setLoading(prev => ({ ...prev, balance: false }))

      const historyData = await getBalanceHistory(tenantId, historyPage * HISTORY_LIMIT, HISTORY_LIMIT)
      setHistory(historyData)
      setHistoryTotal(historyData.length === HISTORY_LIMIT ? (historyPage + 2) * HISTORY_LIMIT : historyPage * HISTORY_LIMIT + historyData.length)
      setHistory(historyData)
      setLoading(prev => ({ ...prev, history: false }))

      const paymentsData = await getPayments(tenantId)
      setPayments(paymentsData)
      setLoading(prev => ({ ...prev, payments: false }))
    } catch (err) {
      setError(err.message)
      setLoading({ balance: false, history: false, payments: false })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (error) return (
  <div className="dashboard">
    <div className="error" style={{ marginBottom: '12px' }}>{error}</div>
    <button className="btn btn-secondary" onClick={loadData}>Повторить</button>
  </div>
)

  const cardStyle = {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px'
  }
  const headingStyle = {
    fontSize: '16px', marginBottom: '16px',
    borderBottom: '1px solid #e1e4e8', paddingBottom: '8px'
  }
  const thStyle = { textAlign: 'left', padding: '8px 0', fontSize: '13px', color: '#666' }
  const tdStyle = { padding: '12px 0', fontSize: '13px', borderBottom: '1px solid #f5f7fa' }

  return (
    <div className="dashboard">
      <h2 className="section-title">Биллинг</h2>

      {/* Баланс */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Баланс</h3>
        {loading.balance ? (
          <div>Загрузка...</div>
        ) : balance ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Основной баланс</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                {parseFloat(balance.main_balance).toFixed(2)} ₽
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Бонусный баланс</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#27ae60' }}>
                {parseFloat(balance.bonus_balance).toFixed(2)} ₽
              </div>
            </div>
          </div>
        ) : (
          <div>Нет данных о балансе</div>
        )}
      </div>

      {/* История операций */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>История операций</h3>
        {loading.history ? (
          <div>Загрузка...</div>
        ) : history.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e1e4e8' }}>
                  <th style={thStyle}>Дата</th>
                  <th style={thStyle}>Сумма</th>
                  <th style={thStyle}>Тип</th>
                  <th style={thStyle}>Описание</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{formatDate(item.created_at)}</td>
                    <td style={{ ...tdStyle, color: parseFloat(item.amount) >= 0 ? '#27ae60' : '#e74c3c' }}>
                      {parseFloat(item.amount) >= 0 ? '+' : ''}{parseFloat(item.amount).toFixed(2)} ₽
                    </td>
                    <td style={tdStyle}>{item.balance_type}</td>
                    <td style={{ ...tdStyle, color: '#666' }}>{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>История операций пуста</div>
        )}
        {(historyPage > 0 || history.length === HISTORY_LIMIT) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setHistoryPage(p => p - 1)} disabled={historyPage === 0}>← Назад</button>
            <span style={{ lineHeight: '32px', fontSize: '13px', color: '#666' }}>Стр. {historyPage + 1}</span>
            <button className="btn btn-secondary" onClick={() => setHistoryPage(p => p + 1)} disabled={history.length < HISTORY_LIMIT}>Вперёд →</button>
          </div>
        )}
      </div>

      {/* История платежей */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <h3 style={headingStyle}>История платежей</h3>
        {loading.payments ? (
          <div>Загрузка...</div>
        ) : payments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e1e4e8' }}>
                  <th style={thStyle}>Дата</th>
                  <th style={thStyle}>Сумма</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Метод</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={tdStyle}>{formatDate(payment.created_at)}</td>
                    <td style={tdStyle}>{parseFloat(payment.amount).toFixed(2)} ₽</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                        background:
                          payment.status === 'paid' ? '#d4edda' :
                          payment.status === 'failed' ? '#f8d7da' :
                          payment.status === 'pending' ? '#fff3cd' : '#e2e3e5',
                        color:
                          payment.status === 'paid' ? '#155724' :
                          payment.status === 'failed' ? '#721c24' :
                          payment.status === 'pending' ? '#856404' : '#383d41'
                      }}>
                        {payment.status === 'paid' ? 'Оплачен' :
                         payment.status === 'failed' ? 'Ошибка' :
                         payment.status === 'pending' ? 'Ожидание' : payment.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#666' }}>{payment.payment_method || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>История платежей пуста</div>
        )}
      </div>
    </div>
  )
}

export default BillingDashboard