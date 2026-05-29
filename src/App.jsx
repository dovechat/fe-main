import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Shell from './components/Shell'
import Login from './pages/Login'
import Profile from './app/lc/Profile'
import ChatDashboard from './app/chat/ChatDashboard'
import TenantList from './app/lc/TenantList'
import TenantDetails from './app/lc/TenantDetails'
import EditTenant from './app/lc/EditTenant'
import CreateTenant from './app/lc/CreateTenant'
import BankingDetailsRu from './app/lc/BankingDetailsRu'
import { getTenant, getCrmSettings } from './api/tenants'
import LineList from './app/lc/LineList'
import LineDetails from './app/lc/LineDetails'
import CreateLine from './app/lc/CreateLine'
import ChannelAccount from './app/lc/ChannelAccount'
import PaymentFormWrapper from './app/lc/PaymentFormWrapper'
import { getChannelAccount } from './api/lines'
import BillingDashboard from './app/lc/BillingDashboard'
import NotificationHistory from './app/lc/NotificationHistory'
import NotificationSettings from './app/lc/NotificationSettings'
import CrmSettingsModal from './app/lc/CrmSettingsModal'


function CompaniesPage() {
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  const [currentTenant, setCurrentTenant] = useState(null)
  useEffect(() => {
    if (tenantId) setCurrentTenant({ id: tenantId })
  }, [tenantId])
  return (
    <TenantList
      currentTenantId={currentTenant?.id}
      onTenantClick={(tenant) => {
        if (tenant.id !== currentTenant?.id) {
          alert('Активируйте компанию прежде, чем редактировать её')
          return
        }
        navigate(`/lc/companies/${tenant.id}`)
      }}
      onCreateClick={() => navigate('/lc/companies/create')}
      onTenantSelected={(id) => setCurrentTenant({ id })}
    />
  )
}

function NotificationsPage() {
  const { tenantId } = useAuth()
  const [settings, setSettings] = useState([])
  if (!tenantId) return <div style={{padding:'2rem'}}>Сначала активируйте компанию в разделе «Компании»</div>
  return (
    <div>
      <NotificationSettings currentTenantId={tenantId} onSettingsLoaded={setSettings} />
      <NotificationHistory currentTenantId={tenantId} settings={settings} />
    </div>
  )
}

function BillingPage() {
  const { tenantId } = useAuth()
  if (!tenantId) return <div style={{padding:'2rem'}}>Сначала активируйте компанию в разделе «Компании»</div>
  return <BillingDashboard tenantId={tenantId} />
}

function LinesPage() {
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  if (!tenantId) return <div style={{padding:'2rem'}}>Сначала активируйте компанию в разделе «Компании»</div>
  return <LineList tenantId={tenantId} onCreateClick={() => navigate('/lc/lines/create')} onLineClick={(line) => navigate(`/lc/lines/${line.id}`)} />
}

function LinesCreatePage() {
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  if (!tenantId) return null
  return <CreateLine tenantId={tenantId} onCreated={(order) => navigate(`/lc/lines/${order.lineId}/payment`, { state: order })} onCancel={() => navigate('/lc/lines')} />
}

function LineDetailsPage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  if (!tenantId) return null
  return <LineDetails tenantId={tenantId} lineId={lineId} onBack={() => navigate('/lc/lines')} onDeleted={() => navigate('/lc/lines')} />
}

function LineChannelPage() {
  const { lineId, channelType } = useParams()
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  if (!tenantId) return null
  return <ChannelAccount tenantId={tenantId} lineId={lineId} channelType={channelType} onBack={() => navigate(`/lc/lines/${lineId}`)} />
}

function LineRenewPage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  const [accounts, setAccounts] = useState([])
  useEffect(() => {
    if (tenantId) getChannelAccount(tenantId, lineId).then(d => setAccounts(Array.isArray(d) ? d : [d])).catch(() => {})
  }, [tenantId, lineId])
  if (!tenantId) return null
  return <CreateLine tenantId={tenantId} lineId={lineId} existingChannels={accounts} renewMode={true} onCreated={() => navigate(`/lc/lines/${lineId}`)} onCancel={() => navigate(`/lc/lines/${lineId}`)} />
}

function LineAddChannelPage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const { tenantId } = useAuth()
  const [accounts, setAccounts] = useState([])
  useEffect(() => {
    if (tenantId) getChannelAccount(tenantId, lineId).then(d => setAccounts(Array.isArray(d) ? d : [d])).catch(() => {})
  }, [tenantId, lineId])
  if (!tenantId) return null
  return <CreateLine tenantId={tenantId} lineId={lineId} existingChannels={accounts} onCreated={() => navigate(`/lc/lines/${lineId}`)} onCancel={() => navigate(`/lc/lines/${lineId}`)} />
}

function LinePaymentPage() {
  const { tenantId } = useAuth()
  if (!tenantId) return null
  return <PaymentFormWrapper tenantId={tenantId} />
}



function CompaniesCreatePage() {
  const navigate = useNavigate()
  return <CreateTenant onCreated={() => navigate('/lc/companies')} onCancel={() => navigate('/lc/companies')} />
}

function CompaniesDetailsPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [crmSettings, setCrmSettings] = useState(null)
  const [showCrmModal, setShowCrmModal] = useState(false)
  useEffect(() => {
    getTenant(tenantId).then(setTenant).catch(() => {})
    getCrmSettings(tenantId).then(setCrmSettings).catch(() => setCrmSettings(null))
  }, [tenantId])
  if (!tenant) return <div style={{padding:'2rem'}}>Загрузка...</div>
  return (
    <>
      <TenantDetails
        tenant={tenant}
        onEdit={() => navigate(`/lc/companies/${tenantId}/edit`)}
        onEditBanking={() => navigate(`/lc/companies/${tenantId}/banking`)}
        onBack={() => navigate('/lc/companies')}
        crmSettings={crmSettings}
        onEditCrm={() => setShowCrmModal(true)}
      />
      {showCrmModal && (
        <CrmSettingsModal
          tenantId={tenantId}
          settings={crmSettings}
          onSaved={(updated) => { setCrmSettings(updated); setShowCrmModal(false) }}
          onClose={() => setShowCrmModal(false)}
        />
      )}
    </>
  )
}

function CompaniesEditPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  useEffect(() => { getTenant(tenantId).then(setTenant).catch(() => {}) }, [tenantId])
  if (!tenant) return <div style={{padding:'2rem'}}>Загрузка...</div>
  return <EditTenant tenant={tenant} onSaved={() => navigate('/lc/companies')} onCancel={() => navigate(`/lc/companies/${tenantId}`)} />
}

function CompaniesBankingPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  useEffect(() => { getTenant(tenantId).then(setTenant).catch(() => {}) }, [tenantId])
  if (!tenant) return <div style={{padding:'2rem'}}>Загрузка...</div>
  return <BankingDetailsRu tenant={tenant} onSaved={() => navigate('/lc/companies')} onCancel={() => navigate(`/lc/companies/${tenantId}`)} />
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/chats" replace />} />
            <Route path="/chats/*" element={<ChatDashboard />} />
            <Route path="/lc/companies" element={<CompaniesPage />} />
            <Route path="/lc/companies/create" element={<CompaniesCreatePage />} />
            <Route path="/lc/companies/:tenantId" element={<CompaniesDetailsPage />} />
            <Route path="/lc/companies/:tenantId/edit" element={<CompaniesEditPage />} />
            <Route path="/lc/companies/:tenantId/banking" element={<CompaniesBankingPage />} />
            <Route path="/lc/lines" element={<LinesPage />} />
            <Route path="/lc/lines/create" element={<LinesCreatePage />} />
            <Route path="/lc/lines/:lineId" element={<LineDetailsPage />} />
            <Route path="/lc/lines/:lineId/channel/:channelType" element={<LineChannelPage />} />
            <Route path="/lc/lines/:lineId/renew" element={<LineRenewPage />} />
            <Route path="/lc/lines/:lineId/add-channel" element={<LineAddChannelPage />} />
            <Route path="/lc/lines/:lineId/payment" element={<LinePaymentPage />} />
            <Route path="/lc/notifications" element={<NotificationsPage />} />
            <Route path="/lc/billing" element={<BillingPage />} />
            <Route path="/lc/profile" element={<Profile />} />
            <Route path="/lc" element={<Navigate to="/lc/companies" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}