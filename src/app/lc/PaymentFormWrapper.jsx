import { useLocation, useNavigate } from 'react-router-dom'
import PaymentForm from './PaymentForm'

export default function PaymentFormWrapper({ tenantId }) {
  const { state } = useLocation()
  const navigate = useNavigate()
  return <PaymentForm tenantId={tenantId} order={state} onPaid={() => navigate('/lc/lines')} />
}