import { useNavigate, useParams } from 'react-router-dom';
import { sf, colors } from '../../styles/apple';

export default function ConversationList({ conversations, tenantId, activeConversationId, onSelect }) {
  const navigate = useNavigate();
  const { lineId } = useParams();

  return (
    <div style={{ fontFamily: sf, overflowY: 'auto', height: '100%' }}>
      {conversations.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.secondaryText, fontSize: '15px' }}>
          Нет активных диалогов
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <li key={conv.id}>
                <div
                  onClick={() => onSelect(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    background: isActive ? colors.background : 'transparent',
                    borderLeft: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = colors.background; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.white, fontSize: '17px', fontWeight: '600',
                    flexShrink: 0, marginRight: '12px',
                  }}>
                    {(conv.client_phone || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: '15px', fontWeight: isActive ? '700' : '600', color: colors.text }}>
                        {conv.client_phone || 'Без номера'}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.secondaryText, marginLeft: '8px', flexShrink: 0 }}>
                        {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ fontSize: '13px', color: colors.secondaryText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message?.text || `${conv.crm_type} • ${conv.crm_chat_id}`}
                      </div>
                      {conv.unread_count > 0 && (
                        <div style={{ background: colors.primary, color: colors.white, borderRadius: '12px', padding: '2px 7px', fontSize: '12px', fontWeight: '600', marginLeft: '8px', flexShrink: 0 }}>
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      <span style={{ color: colors.primary }}>{conv.line_name}</span>
                      {' • '}
                      <span style={{ color: colors.secondaryText }}>{conv.crm_type}</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}