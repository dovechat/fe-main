/**
 * Локальный mock account API на :8070 — только для разработки без Docker.
 * Запуск: npm run mock:api
 */

import http from 'node:http'

const PORT = 8070
const MOCK_TENANT = 'mock-tenant-00000000-0000-0000-0000-000000000001'

const users = new Map()

const mockLines = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    tenant_id: MOCK_TENANT,
    name: 'Поддержка WhatsApp',
    channel_type: 'whatsapp_green',
    status: 'active',
    is_demo: false,
    expires_at: isoDays(30),
    created_at: isoDays(-14),
    connection_status: 'connected',
    days_until_expiry: 30,
    connection_state: { phone: '+79991234567' },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    tenant_id: MOCK_TENANT,
    name: 'Telegram Bot',
    channel_type: 'telegram_bot',
    status: 'active',
    is_demo: true,
    expires_at: isoDays(7),
    created_at: isoDays(-3),
    connection_status: 'connected',
    days_until_expiry: 7,
    connection_state: { phone: null },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    tenant_id: MOCK_TENANT,
    name: 'VK сообщество',
    channel_type: 'vk',
    status: 'disabled',
    is_demo: false,
    expires_at: isoDays(-2),
    created_at: isoDays(-60),
    connection_status: 'disconnected',
    days_until_expiry: -2,
    connection_state: { phone: null },
  },
]

const mockAccounts = {
  '11111111-1111-1111-1111-111111111111': {
    channels: [{
      channel_type: 'whatsapp_green',
      connection_status: 'connected',
      phone: '+79991234567',
      expires_at: isoDays(30),
      message_count: 128,
    }],
  },
  '22222222-2222-2222-2222-222222222222': {
    channels: [{
      channel_type: 'telegram_bot',
      connection_status: 'connected',
      external_id: '@support_bot',
      expires_at: isoDays(7),
      message_count: 42,
    }],
  },
  '33333333-3333-3333-3333-333333333333': {
    channels: [{
      channel_type: 'vk',
      connection_status: 'disconnected',
      external_id: 'vk.com/mock_group',
      expires_at: isoDays(-2),
      message_count: 0,
    }],
  },
}

const mockTariffs = [
  { id: 'aaaa0001-0000-0000-0000-000000000001', name: 'WhatsApp месяц', channel_type: 'whatsapp_green', period_days: 30, price: '990.00', is_active: true },
  { id: 'aaaa0002-0000-0000-0000-000000000002', name: 'WhatsApp год', channel_type: 'whatsapp_green', period_days: 365, price: '9900.00', is_active: true },
  { id: 'aaaa0003-0000-0000-0000-000000000003', name: 'Telegram Bot месяц', channel_type: 'telegram_bot', period_days: 30, price: '790.00', is_active: true },
  { id: 'aaaa0004-0000-0000-0000-000000000004', name: 'Telegram Bot год', channel_type: 'telegram_bot', period_days: 365, price: '7900.00', is_active: true },
  { id: 'aaaa0005-0000-0000-0000-000000000005', name: 'Telegram User месяц', channel_type: 'telegram_user', period_days: 30, price: '890.00', is_active: true },
  { id: 'aaaa0006-0000-0000-0000-000000000006', name: 'WABA месяц', channel_type: 'waba', period_days: 30, price: '1490.00', is_active: true },
  { id: 'aaaa0007-0000-0000-0000-000000000007', name: 'VK месяц', channel_type: 'vk', period_days: 30, price: '690.00', is_active: true },
]

const CONV_WA = 'conv-1111-1111-1111-111111111111'
const CONV_TG = 'conv-2222-2222-2222-222222222222'

const mockConversations = [
  {
    id: CONV_WA,
    line_id: '11111111-1111-1111-1111-111111111111',
    line_name: 'Поддержка WhatsApp',
    crm_type: 'whatsapp_green',
    channel_type: 'whatsapp_green',
    crm_chat_id: '+79995554433',
    client_phone: '+79995554433',
    is_closed: false,
    meta: null,
    created_at: isoDays(-5),
    updated_at: isoDays(0),
    unread_count: 2,
    last_message: {
      id: 3,
      conversation_id: CONV_WA,
      direction: 'inbound',
      status: 'delivered',
      text: 'Здравствуйте, подскажите по заказу №1234',
      created_at: isoDays(0),
    },
  },
  {
    id: CONV_TG,
    line_id: '22222222-2222-2222-2222-222222222222',
    line_name: 'Telegram Bot',
    crm_type: 'telegram_bot',
    channel_type: 'telegram_bot',
    crm_chat_id: '@client_user',
    client_phone: '@client_user',
    is_closed: false,
    meta: null,
    created_at: isoDays(-2),
    updated_at: isoDays(-1),
    unread_count: 0,
    last_message: {
      id: 10,
      conversation_id: CONV_TG,
      direction: 'outbound',
      status: 'read',
      text: 'Спасибо, всё понятно!',
      user_email: 'dev@mock.local',
      created_at: isoDays(-1),
    },
  },
]

const mockMessages = {
  [CONV_WA]: [
    {
      id: 1,
      conversation_id: CONV_WA,
      direction: 'inbound',
      status: 'read',
      text: 'Добрый день!',
      created_at: isoDays(-1),
    },
    {
      id: 2,
      conversation_id: CONV_WA,
      direction: 'outbound',
      status: 'delivered',
      text: 'Здравствуйте! Чем могу помочь?',
      user_email: 'dev@mock.local',
      user_full_name: 'Mock User',
      created_at: isoDays(-1),
    },
    {
      id: 3,
      conversation_id: CONV_WA,
      direction: 'inbound',
      status: 'delivered',
      text: 'Здравствуйте, подскажите по заказу №1234',
      created_at: isoDays(0),
    },
  ],
  [CONV_TG]: [
    {
      id: 10,
      conversation_id: CONV_TG,
      direction: 'inbound',
      status: 'read',
      text: 'Как подключить бота?',
      created_at: isoDays(-2),
    },
    {
      id: 11,
      conversation_id: CONV_TG,
      direction: 'outbound',
      status: 'read',
      text: 'Спасибо, всё понятно!',
      user_email: 'dev@mock.local',
      created_at: isoDays(-1),
    },
  ],
}

let nextMessageId = 100

function linesWithChannels() {
  return mockLines
    .filter((l) => l.status === 'active')
    .map((l) => ({
      id: l.id,
      name: l.name,
      channels: (mockAccounts[l.id]?.channels || []).map((c) => ({ channel_type: c.channel_type })),
    }))
}

function filterConversations(url) {
  let list = [...mockConversations]
  const lineId = url.searchParams.get('line_id')
  const channelType = url.searchParams.get('channel_type')
  const isClosed = url.searchParams.get('is_closed')
  if (lineId) list = list.filter((c) => c.line_id === lineId)
  if (channelType) list = list.filter((c) => c.crm_type === channelType || c.channel_type === channelType)
  if (isClosed === 'true') list = list.filter((c) => c.is_closed)
  if (isClosed === 'false') list = list.filter((c) => !c.is_closed)
  return list
}

function conversationDetail(id) {
  const conv = mockConversations.find((c) => c.id === id)
  if (!conv) return null
  const line = mockLines.find((l) => l.id === conv.line_id)
  return {
    ...conv,
    messages: mockMessages[id] || [],
    my_phone: line?.connection_state?.phone || '+79991234567',
  }
}

function isoDays(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

function fakeJwt(email) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: email,
    tenant_id: MOCK_TENANT,
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).toString('base64url')
  return `${header}.${payload}.mock`
}

function tokens(email) {
  return {
    access_token: fakeJwt(email),
    refresh_token: fakeJwt(`${email}:refresh`),
    token_type: 'bearer',
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      if (!data) return resolve(null)
      const ct = req.headers['content-type'] || ''
      if (ct.includes('application/json')) {
        try { resolve(JSON.parse(data)) } catch { resolve(null) }
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        resolve(Object.fromEntries(new URLSearchParams(data)))
      } else {
        resolve(data)
      }
    })
  })
}

function mockTenant() {
  return {
    id: MOCK_TENANT,
    name: 'Mock Company',
    locale: 'ru',
    payment: 'card',
    address: 'ул. Тестовая, 1',
    phone: '+79991234567',
    email: 'company@mock.local',
    inn: '7700000000',
    employee_count: 5,
    banking_details: {
      bank_name: 'Mock Bank',
      account_number: '40702810000000001234',
      bic: '044525225',
      corr_account: '30101810400000000225',
      kpp: '770001001',
      currency: 'RUB',
    },
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok', mock: true })
    return
  }

  // ── Auth ──
  if (req.method === 'POST' && path === '/api/v1/auth/register') {
    const body = await parseBody(req)
    if (!body?.email) { sendJson(res, 422, { detail: 'email required' }); return }
    users.set(body.email, { password: null, phone: body.phone || '' })
    sendJson(res, 201, tokens(body.email))
    return
  }

  if (req.method === 'POST' && path === '/api/v1/auth/login') {
    const body = await parseBody(req)
    const user = users.get(body?.username)
    if (!user?.password || user.password !== body?.password) {
      sendJson(res, 401, { detail: 'Неверный email или пароль' })
      return
    }
    sendJson(res, 200, tokens(body.username))
    return
  }

  if (req.method === 'POST' && path.startsWith('/api/v1/auth/verify')) {
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && path === '/api/v1/auth/set-password') {
    const body = await parseBody(req)
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      const entry = users.get(payload.sub) || { phone: '' }
      entry.password = body?.password || 'mockpass123'
      users.set(payload.sub, entry)
      sendJson(res, 200, tokens(payload.sub))
    } catch {
      sendJson(res, 400, { detail: 'Invalid token' })
    }
    return
  }

  if (req.method === 'GET' && path === '/api/v1/auth/users/me') {
    sendJson(res, 200, {
      email: 'dev@mock.local',
      full_name: 'Mock User',
      phone: '+79990000000',
      role: 'owner',
    })
    return
  }

  if (req.method === 'PATCH' && path === '/api/v1/auth/users/me') {
    const body = await parseBody(req)
    sendJson(res, 200, {
      email: 'dev@mock.local',
      full_name: body?.full_name || 'Mock User',
      phone: body?.phone || '+79990000000',
      role: 'owner',
    })
    return
  }

  if (req.method === 'POST' && path.startsWith('/api/v1/auth/switch-tenant')) {
    sendJson(res, 200, tokens('dev@mock.local'))
    return
  }

  // ── Tenants ──
  if (req.method === 'GET' && path === '/api/v1/tenant/') {
    sendJson(res, 200, [mockTenant()])
    return
  }

  if (req.method === 'GET' && path.match(/^\/api\/v1\/tenant\/[^/]+$/)) {
    sendJson(res, 200, mockTenant())
    return
  }

  // ── Lines ──
  const linesListMatch = path.match(/^\/api\/v1\/tenants\/[^/]+\/lines\/$/)
  if (req.method === 'GET' && linesListMatch) {
    sendJson(res, 200, mockLines)
    return
  }

  const lineDetailMatch = path.match(/^\/api\/v1\/tenants\/[^/]+\/lines\/([^/]+)$/)
  if (req.method === 'GET' && lineDetailMatch) {
    const line = mockLines.find(l => l.id === lineDetailMatch[1])
    if (!line) { sendJson(res, 404, { detail: 'Line not found' }); return }
    sendJson(res, 200, line)
    return
  }

  if (req.method === 'PATCH' && lineDetailMatch) {
    const line = mockLines.find(l => l.id === lineDetailMatch[1])
    if (!line) { sendJson(res, 404, { detail: 'Line not found' }); return }
    const body = await parseBody(req)
    if (body?.name) line.name = body.name
    if (body?.status) line.status = body.status
    sendJson(res, 200, line)
    return
  }

  const lineAccountMatch = path.match(/^\/api\/v1\/tenants\/[^/]+\/lines\/([^/]+)\/account\/$/)
  if (req.method === 'GET' && lineAccountMatch) {
    sendJson(res, 200, mockAccounts[lineAccountMatch[1]] || { channels: [] })
    return
  }

  // ── Billing ──
  if (req.method === 'GET' && path.match(/\/billing\/balance$/)) {
    sendJson(res, 200, {
      tenant_id: MOCK_TENANT,
      main_balance: '12500.00',
      bonus_balance: '500.00',
      updated_at: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && path.match(/\/billing\/balance\/history/)) {
    sendJson(res, 200, [
      { id: 1, tenant_id: MOCK_TENANT, amount: '-990.00', balance_type: 'main', description: 'Оплата линии WhatsApp', created_at: isoDays(-5) },
      { id: 2, tenant_id: MOCK_TENANT, amount: '15000.00', balance_type: 'main', description: 'Пополнение баланса', created_at: isoDays(-10) },
    ])
    return
  }

  if (req.method === 'GET' && path.match(/\/billing\/payments/)) {
    sendJson(res, 200, [
      { id: 'pay-0001-0000-0000-0000-000000000001', tenant_id: MOCK_TENANT, amount: '990.00', status: 'paid', payment_method: 'card', created_at: isoDays(-5), updated_at: isoDays(-5) },
      { id: 'pay-0002-0000-0000-0000-000000000002', tenant_id: MOCK_TENANT, amount: '790.00', status: 'pending', payment_method: 'card', created_at: isoDays(-1), updated_at: isoDays(-1) },
    ])
    return
  }

  // ── Tariffs ──
  if (req.method === 'GET' && path === '/api/v1/tariffs/') {
    sendJson(res, 200, mockTariffs)
    return
  }

  // ── Members ──
  if (req.method === 'GET' && path.match(/\/members$/)) {
    sendJson(res, 200, [
      { id: 'mem-0001', user: { email: 'dev@mock.local' }, role: 'owner', name: 'Mock User' },
      { id: 'mem-0002', user: { email: 'manager@mock.local' }, role: 'member', name: 'Manager' },
    ])
    return
  }

  // ── Notifications ──
  if (req.method === 'GET' && path.match(/\/notifications\/settings$/)) {
    sendJson(res, 200, [
      { id: 'ns-001', notification_type: 'line_expiration', channel: 'email', target: 'dev@mock.local', enabled: true },
    ])
    return
  }

  if (req.method === 'GET' && path.match(/\/notifications\/history/)) {
    sendJson(res, 200, [])
    return
  }

  // ── Chat ──
  if (req.method === 'GET' && path === '/api/v1/conversations') {
    sendJson(res, 200, filterConversations(url))
    return
  }

  if (req.method === 'GET' && path === '/api/v1/lines-with-channels') {
    sendJson(res, 200, linesWithChannels())
    return
  }

  if (req.method === 'GET' && path === '/api/v1/lines') {
    sendJson(res, 200, mockLines.filter((l) => l.status === 'active').map((l) => ({
      id: l.id,
      name: l.name,
      channel_type: l.channel_type,
      status: l.status,
      created_at: l.created_at,
    })))
    return
  }

  const convDetailMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)$/)
  if (req.method === 'GET' && convDetailMatch) {
    const detail = conversationDetail(convDetailMatch[1])
    if (!detail) { sendJson(res, 404, { detail: 'Conversation not found' }); return }
    sendJson(res, 200, detail)
    return
  }

  const convMessagesMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)\/messages$/)
  if (req.method === 'GET' && convMessagesMatch) {
    sendJson(res, 200, mockMessages[convMessagesMatch[1]] || [])
    return
  }

  const convStatusMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)\/status$/)
  if (req.method === 'PATCH' && convStatusMatch) {
    const conv = mockConversations.find((c) => c.id === convStatusMatch[1])
    if (!conv) { sendJson(res, 404, { detail: 'Conversation not found' }); return }
    const body = await parseBody(req)
    conv.is_closed = Boolean(body?.is_closed)
    sendJson(res, 200, conv)
    return
  }

  if (req.method === 'POST' && path === '/api/v1/conversations') {
    const body = await parseBody(req)
    const channelType = body?.channel_type || body?.crm_type || 'whatsapp_green'
    const line = mockLines.find((l) => l.id === body?.line_id) || mockLines[0]
    const id = `conv-${Date.now()}`
    const phone = body?.client_phone || body?.crm_chat_id || '+79990000000'
    const conv = {
      id,
      line_id: line.id,
      line_name: line.name,
      crm_type: channelType,
      channel_type: channelType,
      crm_chat_id: phone,
      client_phone: phone,
      is_closed: false,
      meta: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: 0,
      last_message: null,
    }
    mockConversations.unshift(conv)
    mockMessages[id] = []
    sendJson(res, 201, conversationDetail(id))
    return
  }

  if (req.method === 'POST' && path.match(/^\/api\/v1\/messages\//)) {
    await parseBody(req)
    sendJson(res, 200, {
      id: nextMessageId++,
      direction: 'outbound',
      status: 'sent',
      text: 'Сообщение отправлено (mock)',
      created_at: new Date().toISOString(),
    })
    return
  }

  console.log(`[mock] ${req.method} ${path} → 404`)
  sendJson(res, 404, { detail: `Mock: no handler for ${req.method} ${path}` })
})

server.listen(PORT, () => {
  console.log(`\n  Mock account API: http://localhost:${PORT}`)
  console.log(`  Health:           http://localhost:${PORT}/health`)
  console.log(`  Lines:            ${mockLines.length} demo lines`)
  console.log(`  Chats:            ${mockConversations.length} demo conversations`)
  console.log(`  Verify code:      любой (например 123456)\n`)
})
