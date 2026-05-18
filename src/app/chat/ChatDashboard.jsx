import { useState, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import { fetchConversations, fetchLinesWithChannels, createConversation } from './api';
import ConversationPage from './ConversationPage';

const CHANNEL_LABELS = {
  telegram_user: 'Telegram User',
  telegram_bot: 'Telegram Bot',
  whatsapp_green: 'WhatsApp Green',
  waba: 'WABA',
  vk: 'VK',
};

export default function ChatDashboard() {
  const [availableLines, setAvailableLines] = useState([]);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [filterLine, setFilterLine] = useState(null);
  const [filterChannel, setFilterChannel] = useState(null);
  const [filterClosed, setFilterClosed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [allConversations, setAllConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('phone');


  useEffect(() => { setLoading(false); }, []);
  useEffect(() => { loadConversations(); }, [filterLine, filterChannel, filterClosed]);
  useEffect(() => {
    fetchLinesWithChannels().then(setAvailableLines).catch(console.error);
  }, []);
  useEffect(() => {
    fetchConversations().then(setAllConversations).catch(console.error);
  }, []);

  const handleSearch = (val) => { window._sq = val; setSearchQuery(val); }

  async function loadConversations() {
    try {
      setLoading(true);
      const params = {};
      if (filterLine) params.line_id = filterLine;
      if (filterChannel) params.crm_type = filterChannel;
      if (filterClosed !== null) params.is_closed = filterClosed;
      const data = await fetchConversations(params);
      console.log('data', data);
      setConversations(data);
      window._conv = data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const wsUrl = `${import.meta.env.VITE_WS_URL}ws/user?token=${token}`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('WS user connected');
    ws.onerror = (e) => console.error('WS user error:', e);
    ws.onclose = (e) => console.log('WS user closed:', e.code, e.reason);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'new_conversation') loadConversations();
    };
    return () => ws.close();
  }, []);

  const openModal = async () => {
    setShowModal(true);
    setSelectedLine(null);
    setSelectedChannel(null);
    setPhoneInput('');
    try {
      const data = await fetchLinesWithChannels();
      setAvailableLines(data);
    } catch (err) {
      console.error('Ошибка загрузки линий:', err);
    }
  };

  const handleSelectLine = (line) => {
    setSelectedLine(line);
    setSelectedChannel(null);
  };

  const createRealConversation = async () => {
    if ((!phoneInput && selectedChannel !== 'telegram_bot') || !selectedLine || !selectedChannel) return;
    try {
      setCreating(true);
      await createConversation({
        line_id: selectedLine.id,
        crm_type: selectedChannel,
        crm_chat_id: phoneInput,
        client_phone: phoneInput,
      });
      setShowModal(false);
      loadConversations();
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const lines = useMemo(() => {
    const map = {};
    allConversations.forEach(c => {
      if (!map[c.line_id]) map[c.line_id] = { id: c.line_id, name: c.line_name };
    });
    return Object.values(map);
  }, [allConversations]);

  const channels = useMemo(() => {
    const set = new Set();
    allConversations.forEach(c => set.add(c.crm_type));
    return [...set].sort();
  }, [allConversations]);


  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => {
      if (searchField === 'phone') return c.client_phone?.toLowerCase().includes(q);
      if (searchField === 'message') return c.last_message?.text?.toLowerCase().includes(q);
      if (searchField === 'line') return c.line_name?.toLowerCase().includes(q);
      if (searchField === 'channel') return c.crm_type?.toLowerCase().includes(q);
      if (searchField === 'status') return !c.is_closed ? 'открыт'.includes(q) : 'закрыт'.includes(q);
      return false;
    });
  }, [conversations, searchQuery, searchField]);


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
      Загрузка...
    </div>
  );

  if (error) return (
    <div style={{ padding: '32px', color: '#ef4444' }}>Ошибка: {error}</div>
  );

  console.log('filteredConversations:', filteredConversations)

  return (
    <div className="dc-conv-wrap">
    <div className="dc-conv-root">
      <div className="dc-conv-inner">

      {/* ЛЕВАЯ КОЛОНКА */}
      <div className="dc-conv-list">
        <div className="dc-conv-list-head">
          <div className="dc-conv-list-title-row">
            <h2 className="dc-conv-list-title">Чаты</h2>
            <button type="button" className="dc-btn dc-btn-primary" style={{ padding: '6px 14px', fontSize: '14px' }} onClick={openModal}>
              + Новый
            </button>
          </div>
          <div
            style={{ position: 'relative', marginTop: '0.5rem' }}
            onMouseLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) { setFilterOpen(false); setHoveredFilter(null); } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" className="dc-btn-ghost" style={{ fontSize: '13px', color: '#2563eb', padding: 0 }} onClick={loadConversations}>
                Обновить
              </button>
              <button type="button" className="dc-btn-sm" onClick={() => setFilterOpen(f => !f)}>
                Фильтры {filterOpen ? '▲' : '▼'}
              </button>
            </div>
            {filterOpen && (
              <div style={{ position: 'absolute', zIndex: 100, top: '28px', right: 0, background: '#fff', border: '1px solid #dbeafe', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex' }}>
                <div style={{ minWidth: '130px', padding: '4px 0' }}>
                  {[
                    { key: 'line', label: 'Линии', active: filterLine },
                    { key: 'channel', label: 'Каналы', active: filterChannel },
                    { key: 'status', label: 'Статус', active: filterClosed !== null },
                  ].map(item => (
                    <div key={item.key} onMouseEnter={() => setHoveredFilter(item.key)}
                      style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: hoveredFilter === item.key ? '#eff6ff' : 'transparent', color: item.active ? '#2563eb' : '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {item.label} <span style={{ color: '#94a3b8' }}>›</span>
                    </div>
                  ))}
                </div>
                {hoveredFilter && (
                  <div style={{ position: 'absolute', top: 0, left: '100%', minWidth: '150px', padding: '4px 0', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    {hoveredFilter === 'line' && (
                      <>
                        <div onMouseDown={() => { setFilterLine(null); setFilterOpen(false); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: !filterLine ? '#2563eb' : '#0f172a' }}>Все линии</div>
                        {lines.map(l => (
                          <div key={l.id} onMouseDown={() => { setFilterLine(l.id === filterLine ? null : l.id); setFilterOpen(false); }}
                            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: filterLine === l.id ? '#eff6ff' : 'transparent', color: filterLine === l.id ? '#2563eb' : '#0f172a' }}>
                            {l.name}
                          </div>
                        ))}
                      </>
                    )}
                    {hoveredFilter === 'channel' && (
                      <>
                        <div onMouseDown={() => { setFilterChannel(null); setFilterOpen(false); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: !filterChannel ? '#2563eb' : '#0f172a' }}>Все каналы</div>
                        {channels.map(c => (
                          <div key={c} onMouseDown={() => { setFilterChannel(c === filterChannel ? null : c); setFilterOpen(false); }}
                            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: filterChannel === c ? '#eff6ff' : 'transparent', color: filterChannel === c ? '#2563eb' : '#0f172a' }}>
                            {CHANNEL_LABELS[c] || c}
                          </div>
                        ))}
                      </>
                    )}
                    {hoveredFilter === 'status' && (
                      <>
                        <div onMouseDown={() => { setFilterClosed(null); setFilterOpen(false); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === null ? '#2563eb' : '#0f172a' }}>Все статусы</div>
                        <div onMouseDown={() => { setFilterClosed(false); setFilterOpen(false); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === false ? '#2563eb' : '#0f172a' }}>Открытые</div>
                        <div onMouseDown={() => { setFilterClosed(true); setFilterOpen(false); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === true ? '#2563eb' : '#0f172a' }}>Закрытые</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="dc-conv-scroll">
          <ConversationList
            conversations={filteredConversations}
            activeConversationId={selectedConversationId}
            onSelect={setSelectedConversationId}
            onSearch={handleSearch}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
          />
        </div>
      </div>
        {/* ПРАВАЯ КОЛОНКА */}
        <div className="dc-conv-main">
          {selectedConversationId
            ? <ConversationPage conversationId={selectedConversationId} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '15px' }}>Выберите диалог</div>
          }
        </div>

      </div>
    </div>

    {/* МОДАЛКА */}
    {showModal && (
      <div className="dc-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
        <div className="dc-modal">
          <div className="dc-modal-header">
            <h3 className="dc-modal-title">Новый диалог</h3>
          </div>
          <div className="dc-modal-body">
            <div className="form-group">
              <label>Линия</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {availableLines.map(line => (
                  <button key={line.id} type="button"
                    className={`dc-btn ${selectedLine?.id === line.id ? 'dc-btn-primary' : 'dc-btn-outline'}`}
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => handleSelectLine(line)}
                  >
                    {line.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedLine && selectedLine.channels.length > 0 && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Канал</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {selectedLine.channels.filter(ch => ch.channel_type !== 'telegram_bot').map(ch => (
                    <button key={ch.channel_type} type="button"
                      className="dc-btn-sm"
                      style={selectedChannel === ch.channel_type ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' } : {}}
                      onClick={() => setSelectedChannel(ch.channel_type)}
                    >
                      {CHANNEL_LABELS[ch.channel_type] || ch.channel_type}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedChannel && selectedChannel !== 'telegram_bot' && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>{selectedChannel === 'vk' ? 'ID пользователя ВКонтакте' : 'Номер телефона'}</label>
                <input type="text" className="dc-prof-input" style={{ marginTop: '8px' }}
                  placeholder={selectedChannel === 'vk' ? '123456789' : '+79991234567'}
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="dc-modal-footer" style={{ gap: '8px' }}>
            <button type="button" className="dc-btn dc-btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            <button type="button" className="dc-btn dc-btn-primary"
              disabled={(!phoneInput && selectedChannel !== 'telegram_bot') || !selectedLine || !selectedChannel || creating}
              onClick={createRealConversation}
            >
              {creating ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}