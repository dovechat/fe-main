import { useState } from 'react'
import { createTenant } from '../../api/tenants'
import Input from './Input'
import Button from './Button'

function CreateTenant({ onCreated, onCancel }) {
  const [values, setValues] = useState({
    name: '',
    locale: 'ru_RU',
    payment: 'acquiring',
    status: 'active',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const newTenant = await createTenant(values)
      onCreated(newTenant)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h2>Создать компанию</h2>

      <form onSubmit={onSubmit} autoComplete="off">
        <Input
          label="Название компании"
          type="text"
          name="name"
          value={values.name}
          onChange={handleChange}
          required
          placeholder="Моя компания"
        />

        <div className="form-group">
          <label>Локаль</label>
          <select
            name="locale"
            value={values.locale}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #e1e4e8',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="ru_RU">Русский (ru_RU)</option>
            <option value="en_US">English (en_US)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Способ оплаты</label>
          <select
            name="payment"
            value={values.payment}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #e1e4e8',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="acquiring">Эквайринг</option>
            <option value="wire">Счёт</option>
          </select>
        </div>

        <div className="form-group">
          <label>Статус</label>
          <select
            name="status"
            value={values.status}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #e1e4e8',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="success" loading={loading} style={{ flex: 1 }}>
            Создать
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CreateTenant