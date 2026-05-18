import { Search } from 'lucide-react'

function initials(str) {
  if (!str) return '?'
  return str.slice(0, 2).toUpperCase()
}

function dotClass(crm_type) {
  if (crm_type === 'whatsapp_green' || crm_type === 'waba') return 'wa'
  if (crm_type === 'telegram_user' || crm_type === 'telegram_bot') return 'tg'
  return 'wa'
}

const SEARCH_FIELDS = { phone: 'Телефон', message: 'Сообщение', line: 'Линия', channel: 'Канал', status: 'Статус' };

export default function ConversationList({ conversations, activeConversationId, onSelect, onSearch, searchField, onSearchFieldChange }) {
  return (
    <>
      <div className="dc-conv-list-head dc-conv-list-head--border">
        <div className="dc-conv-search-row">
          <div className="dc-conv-search-wrap">
            <Search className="dc-conv-search-icon" />
            <input
              type="search"
              className="dc-conv-search"
              placeholder={`Поиск: ${SEARCH_FIELDS[searchField]}`}
              aria-label="Поиск"
              onChange={e => onSearch?.(e.target.value)}
            />
          </div>
            <select
              className="dc-conv-search-field"
              value={searchField}
              onChange={e => onSearchFieldChange(e.target.value)}
              title={SEARCH_FIELDS[searchField]}
            >
            <option value="phone">Телефон</option>
            <option value="message">Сообщение</option>
            <option value="line">Линия</option>
            <option value="channel">Канал</option>  
            <option value="status">Статус</option>
          </select>
        </div>
      </div>

      <div className="dc-conv-scroll">
        {conversations.length === 0 ? (
          <div className="dc-empty">Нет активных диалогов</div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              className={`dc-conv-item ${conv.id === activeConversationId ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="dc-conv-item-inner">
                <div className="dc-conv-avatar">
                  {initials(conv.client_phone)}
                  <span className={`dc-conv-dot ${dotClass(conv.crm_type)}`} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.client_phone || 'Без номера'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
                      {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message?.text || (conv.last_message?.media?.length > 0 ? 📎 conv.last_message.media[0].mime_type : '')}
                    </span>
                    {conv.unread_count > 0 && (
                      <span style={{ minWidth: '1.25rem', height: '1.25rem', borderRadius: '9999px', background: 'linear-gradient(90deg, #3b82f6, #9333ea)', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.35rem', flexShrink: 0 }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: '#94a3b8' }}>
                    {conv.line_name} • {conv.crm_type} 
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  )
}