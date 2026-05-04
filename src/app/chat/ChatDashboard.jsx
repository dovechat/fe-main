// frontend_chat/src/pages/ChatDashboard.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import { fetchConversations, fetchLinesWithChannels, createConversation } from './api';
import { sf, colors, styles } from '../../styles/apple';
import ConversationPage from './ConversationPage';

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
  const [messageInput, setMessageInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [filterLine, setFilterLine] = useState(null);
  const [filterChannel, setFilterChannel] = useState(null);
  const [filterClosed, setFilterClosed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [allConversations, setAllConversations] = useState([]);
  const tenantWs = useRef(null);

  useEffect(() => { setLoading(false); }, []);
  useEffect(() => { loadConversations(); }, [filterLine, filterChannel, filterClosed]);
  useEffect(() => {
    fetchLinesWithChannels().then(setAvailableLines).catch(console.error);
}, []);
  useEffect(() => {
    fetchConversations().then(setAllConversations).catch(console.error);
}, []);

  async function loadConversations() {
    try {
      setLoading(true);
      const params = {};
      if (filterLine) params.line_id = filterLine;
      if (filterChannel) params.crm_type = filterChannel;
      if (filterClosed !== null) params.is_closed = filterClosed;
      const data = await fetchConversations(params);
      setConversations(data);
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
        client_phone: phoneInput
      });
      setShowModal(false);
      loadConversations();
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const CHANNEL_LABELS = {
    telegram_user: 'Telegram User',
    telegram_bot: 'Telegram Bot',
    whatsapp_green: 'WhatsApp Green',
    waba: 'WABA',
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: sf, color: colors.secondaryText }}>
      Загрузка...
    </div>
  );

  if (error) return (
    <div style={{ padding: '32px', fontFamily: sf, color: colors.red }}>Ошибка: {error}</div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: sf, background: colors.background }}>

      {/* ЛЕВАЯ КОЛОНКА */}
      <div style={{ width: '320px', flexShrink: 0, background: colors.white, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>

        {/* ШАПКА */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}` }}>

          {/* СТРОКА 1: Диалоги + Новый */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>Диалоги</div>
            <button
              onClick={openModal}
              style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.white, fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: sf }}
            >
              + Новый
            </button>
          </div>
          {/* /СТРОКА 1 */}

          {/* СТРОКА 2: Обновить + Фильтры + выпадашка */}
          <div
            style={{ position: 'relative' }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setFilterOpen(false);
                setHoveredFilter(null);
              }
            }}
          >
            {/* СТРОКА 2 КНОПКИ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => loadConversations()}
                style={{ fontSize: '13px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: sf, padding: 0 }}
              >
                Обновить
              </button>
              <button
                onClick={() => setFilterOpen(f => !f)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', fontSize: '13px', color: colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Фильтры {filterOpen ? '▲' : '▼'}
              </button>
            </div>
            {/* /СТРОКА 2 КНОПКИ */}

            {/* ВЫПАДАШКА */}
            {filterOpen && (
              <div style={{ position: 'absolute', zIndex: 100, top: '28px', right: '0', background: colors.white, border: `1px solid ${colors.border}`, borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

                {/* ВЫПАДАШКА ЛЕВАЯ КОЛОНКА: типы */}
                <div style={{ minWidth: '130px', padding: '4px 0' }}>
                  {[
                    { key: 'line', label: 'Линии', active: filterLine },
                    { key: 'channel', label: 'Каналы', active: filterChannel },
                    { key: 'status', label: 'Статус', active: filterClosed !== null },
                  ].map(item => (
                    <div
                      key={item.key}
                      onMouseEnter={() => setHoveredFilter(item.key)}
                      style={{
                        padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                        background: hoveredFilter === item.key ? colors.background : 'transparent',
                        color: item.active ? colors.primary : colors.text,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                      }}
                    >
                      {item.label} <span style={{ color: colors.secondaryText }}>›</span>
                    </div>
                  ))}
                </div>
                {/* /ВЫПАДАШКА ЛЕВАЯ КОЛОНКА */}

                {/* ВЫПАДАШКА ПРАВАЯ КОЛОНКА: значения */}
                {hoveredFilter && (
                  <div style={{ position: 'absolute', top: 0, left: '100%', minWidth: '150px', padding: '4px 0', border: `1px solid ${colors.border}`, borderRadius: '10px', background: colors.white, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

                    {/* ЗНАЧЕНИЯ: линии */}
                    {hoveredFilter === 'line' && (
                      <>
                        <div onMouseDown={() => { setFilterLine(null); setFilterOpen(false); }}
                          style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: !filterLine ? colors.primary : colors.text }}>
                          Все линии
                        </div>
                        {lines.map(l => (
                          <div key={l.id} onMouseDown={() => { setFilterLine(l.id === filterLine ? null : l.id); setFilterOpen(false); }}
                            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: filterLine === l.id ? colors.background : 'transparent', color: filterLine === l.id ? colors.primary : colors.text }}>
                            {l.name}
                          </div>
                        ))}
                      </>
                    )}
                    {/* /ЗНАЧЕНИЯ: линии */}

                    {/* ЗНАЧЕНИЯ: каналы */}
                    {hoveredFilter === 'channel' && (
                      <>
                        <div onMouseDown={() => { setFilterChannel(null); setFilterOpen(false); }}
                          style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: !filterChannel ? colors.primary : colors.text }}>
                          Все каналы
                        </div>
                        {channels.map(c => (
                          <div key={c} onMouseDown={() => { setFilterChannel(c === filterChannel ? null : c); setFilterOpen(false); }}
                            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: filterChannel === c ? colors.background : 'transparent', color: filterChannel === c ? colors.primary : colors.text }}>
                            {c}
                          </div>
                        ))}
                      </>
                    )}
                    {/* /ЗНАЧЕНИЯ: каналы */}

                    {/* ЗНАЧЕНИЯ: статус */}
                    {hoveredFilter === 'status' && (
                      <>
                        <div onMouseDown={() => { setFilterClosed(null); setFilterOpen(false); }}
                          style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === null ? colors.primary : colors.text }}>
                          Все статусы
                        </div>
                        <div onMouseDown={() => { setFilterClosed(false); setFilterOpen(false); }}
                          style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === false ? colors.primary : colors.text }}>
                          Открытые
                        </div>
                        <div onMouseDown={() => { setFilterClosed(true); setFilterOpen(false); }}
                          style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: filterClosed === true ? colors.primary : colors.text }}>
                          Закрытые
                        </div>
                      </>
                    )}
                    {/* /ЗНАЧЕНИЯ: статус */}

                  </div>
                )}
                {/* /ВЫПАДАШКА ПРАВАЯ КОЛОНКА */}

              </div>
            )}
            {/* /ВЫПАДАШКА */}

          </div>
          {/* /СТРОКА 2 */}

        </div>
        {/* /ШАПКА */}

        {/* СПИСОК ДИАЛОГОВ */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ConversationList
            conversations={conversations}
            activeConversationId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
        </div>
        {/* /СПИСОК ДИАЛОГОВ */}

      </div>
      {/* /ЛЕВАЯ КОЛОНКА */}

      {/* ПРАВАЯ КОЛОНКА: чат */}
      <div style={{ flex: 1 }}>
        {selectedConversationId
          ? <ConversationPage conversationId={selectedConversationId} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.secondaryText, fontSize: '15px' }}>Выберите диалог</div>
        }
      </div>
      {/* /ПРАВАЯ КОЛОНКА */}

      {/* МОДАЛКА: создание диалога */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.white, borderRadius: '16px', padding: '24px', width: '400px', fontFamily: sf }}>
            <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>Новый диалог</div>

            {/* МОДАЛКА: выбор линии */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: colors.secondaryText, marginBottom: '8px' }}>Линия</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableLines.map(line => (
                  <button key={line.id} onClick={() => handleSelectLine(line)}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${selectedLine?.id === line.id ? colors.primary : colors.border}`, background: selectedLine?.id === line.id ? colors.primary + '15' : colors.white, color: colors.text, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: sf }}
                  >
                    {line.name}
                  </button>
                ))}
              </div>
            </div>
            {/* /МОДАЛКА: выбор линии */}

            {/* МОДАЛКА: выбор канала */}
            {selectedLine && selectedLine.channels.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: colors.secondaryText, marginBottom: '8px' }}>Канал</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedLine.channels.filter(ch => ch.channel_type !== 'telegram_bot').map(ch => (
                    <button key={ch.channel_type} onClick={() => setSelectedChannel(ch.channel_type)}
                      style={{ padding: '4px 6px', borderRadius: '10px', border: `1px solid ${selectedChannel === ch.channel_type ? colors.primary : colors.border}`, background: selectedChannel === ch.channel_type ? colors.primary + '15' : colors.white, color: colors.text, fontSize: '13px', cursor: 'pointer', fontFamily: sf }}
                    >
                      {CHANNEL_LABELS[ch.channel_type] || ch.channel_type}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* /МОДАЛКА: выбор канала */}

            {/* МОДАЛКА: ввод телефона */}
            {selectedChannel && selectedChannel !== 'telegram_bot' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: colors.secondaryText, marginBottom: '8px' }}>Номер телефона</div>
                <input
                  type="text"
                  placeholder="+79991234567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{ ...styles.input, width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: sf, boxSizing: 'border-box' }}
                />
              </div>
            )}
            {/* /МОДАЛКА: ввод телефона */}

            {/* МОДАЛКА: кнопки */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.white, color: colors.text, fontSize: '14px', cursor: 'pointer', fontFamily: sf }}
              >
                Отмена
              </button>
              <button
                onClick={createRealConversation}
                disabled={(!phoneInput && selectedChannel !== 'telegram_bot') || !selectedLine || !selectedChannel || creating}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: (phoneInput || selectedChannel === 'telegram_bot') && selectedLine && selectedChannel ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : colors.disabled, color: colors.white, fontSize: '14px', fontWeight: '600', cursor: phoneInput && selectedLine && selectedChannel ? 'pointer' : 'default', fontFamily: sf }}
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
            {/* /МОДАЛКА: кнопки */}

          </div>
        </div>
      )}
      {/* /МОДАЛКА */}

    </div>
  );
}