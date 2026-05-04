import { useState } from 'react'
import { updateBankingRu } from '../../api/tenants'
import Input from './Input'
import Button from './Button'

function BankingDetailsRu({ tenant, onSaved, onCancel }) {
  const existing = tenant.banking_details || {}
  
  const [values, setValues] = useState({
    bank_name: existing.bank_name || '',
    account_number: existing.account_number || '',
    bic: existing.bic || '',
    corr_account: existing.corr_account || '',
    kpp: existing.kpp || '',
    currency: existing.currency || 'RUB',
    is_primary: existing.is_primary !== undefined ? existing.is_primary : true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    })
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateBankingRu(tenant.id, values)
      alert('Банковские реквизиты сохранены!')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h2>Банковские реквизиты (RU)</h2>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
        Тенант: <strong>{tenant.name}</strong>
      </p>

      <form onSubmit={onSubmit} autoComplete="off">
        <Input
          label="Название банка"
          type="text"
          name="bank_name"
          value={values.bank_name}
          onChange={handleChange}
          required
          placeholder="Б-Танк"
        />

        <Input
          label="Номер счёта (20 цифр)"
          type="text"
          name="account_number"
          value={values.account_number}
          onChange={handleChange}
          required
          pattern="[0-9]{20}"
          placeholder="00000000000000000000"
        />

        <Input
          label="БИК (9 цифр)"
          type="text"
          name="bic"
          value={values.bic}
          onChange={handleChange}
          required
          pattern="[0-9]{9}"
          placeholder="000000000"
        />

        <Input
          label="Корр. счёт (20 цифр)"
          type="text"
          name="corr_account"
          value={values.corr_account}
          onChange={handleChange}
          required
          pattern="[0-9]{20}"
          placeholder="00000000000000000000"
        />

        <Input
          label="КПП (9 цифр)"
          type="text"
          name="kpp"
          value={values.kpp}
          onChange={handleChange}
          required
          pattern="[0-9]{9}"
          placeholder="000000000"
        />

        <div className="form-group">
          <label>Валюта</label>
          <select
            name="currency"
            value={values.currency}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #e1e4e8',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="RUB">Российский рубль (RUB)</option>
            <option value="USD">Доллар США (USD)</option>
            <option value="EUR">Евро (EUR)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_primary"
              checked={values.is_primary}
              onChange={handleChange}
            />
            Основной счёт
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="success" loading={loading} style={{ flex: 1 }}>
            Сохранить
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BankingDetailsRu