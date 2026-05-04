import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { fetchConversation, fetchMessages, setConversationStatus } from './api';
import { sf, colors, styles } from '../../styles/apple';
import api from './api';

export default function ConversationPage({ conversationId }) {
  const { tenantId, lineId } = useParams();
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectDelay = useRef(1000);
  const isMounted = useRef(true);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const messagesEndRef = useRef(null);

  const myPhone = conversation?.my_phone || '';
  const peerPhone = conversation?.client_phone || '';

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!conversationId || !conversation) return;

    const isBot = conversation?.crm_type === 'telegram_bot';
    const token = localStorage.getItem('token');
    console.log('******* WS connect token:', token);
    const params = `token=${token}`;

  function connect() {
    if (!isMounted.current) return;
    const token = localStorage.getItem('token');
    const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/chat/${conversationId}?token=${token}`);
      ws.current = socket;

      socket.onopen = () => {
        if (!isMounted.current) return;
        setConnectionStatus(true);
        reconnectDelay.current = 1000;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'new_message') {
          setMessages(prev => {
            if (data.data.direction === 'outbound') {
              const hasTemp = prev.some(m =>
                m.id.toString().startsWith('temp-') && m.text === data.data.text
              );
              if (hasTemp) {
                return prev.map(m =>
                  m.id.toString().startsWith('temp-') && m.text === data.data.text
                    ? { ...data.data, id: data.data.id }
                    : m
                );
              }
            }
            return prev.some(m => m.id === data.data.id) ? prev : [...prev, data.data];
          });
        } else if (data.type === 'message_status') {
          setMessages(prev => prev.map(msg =>
            String(msg.id) === String(data.data.message_id)
              ? { ...msg, status: data.data.status, mime_type: data.data.mime_type }
              : msg
          ));
        }
      };

      socket.onclose = (event) => {
        if (!isMounted.current) return;
        setConnectionStatus(false);
        if (event.code === 1000) return;
        if (event.code === 1008) return; // auth error - не переподключаться
        const delay = reconnectDelay.current;
        reconnectTimeout.current = setTimeout(() => {
          reconnectDelay.current = Math.min(delay * 2, 30000);
          connect();
        }, delay);
      };

      socket.onerror = (err) => {
        console.error('WS error:', err);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      ws.current?.close(1000);
    };
  }, [conversationId, conversation?.client_phone]);

  useEffect(() => {
    if (conversationId) loadConversation();
  }, [conversationId]);

  async function loadConversation() {
    try {
      setLoading(true);
      const [convData, messagesData] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ]);
      setConversation(convData);
      console.log('convData ', convData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text, files) => {
    if (!conversation) return;
    if (!text.trim() && files.length === 0) return;
    const user_email = localStorage.getItem('user_email');
    const mediaItems = files.map(f => ({ id: uuidv4(), file_name: f.name, mime_type: f.type }));
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: text,
      direction: 'outbound',
      created_at: new Date().toISOString(),
      user_email: user_email,
      status: 'sent',
      media: mediaItems,
    };
    setMessages(prev => [...prev, tempMessage]);
    const endpoints = {
      telegram_user: '/messages/tguser',
      telegram_bot: '/messages/tgbot',
      whatsapp_green: '/messages/whatsapp/green',
      waba: '/messages/waba',
    };
    const endpoint = endpoints[conversation?.crm_type] || '/messages/tguser';
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      conversation_id: conversationId,
      text: text,
      direction: 'outbound',
      phone: conversation?.client_phone,
      channel_msg_id: '',
      media: mediaItems.length > 0 ? mediaItems : null,
      raw_content: {},
    }));
    files.forEach(f => formData.append('files', f));
    try {
      await api.post(endpoint, formData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };


  const handleToggleClose = async () => {
      const newStatus = !conversation.is_closed;
      await setConversationStatus(conversationId, newStatus);
      setConversation(prev => ({ ...prev, is_closed: newStatus }));
  };



  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: sf, color: colors.secondaryText }}>
      Загрузка...
    </div>
  );
return (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: sf, background: colors.white }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.white }}>
      <div>
        <div style={{ fontSize: '17px', fontWeight: '600', color: colors.text }}>
          {conversation?.client_phone || 'Без номера'}
        </div>
        <div style={{ fontSize: '13px', color: colors.secondaryText, marginTop: '2px' }}>
          {conversation?.crm_type} • {conversation?.crm_chat_id}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleToggleClose}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            background: conversation?.is_closed ? colors.green : colors.red,
            color: '#fff',
          }}
        >
          {conversation?.is_closed ? 'Открыть' : 'Закрыть'}
        </button>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: connectionStatus ? colors.green : colors.red,
          boxShadow: connectionStatus ? `0 0 6px rgba(52,199,89,0.5)` : `0 0 6px rgba(255,59,48,0.5)`,
        }} />
      </div>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', background: colors.white }}>
      <MessageList messages={messages} />
      <div ref={messagesEndRef} />
    </div>
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, background: colors.white }}>
      <MessageInput onSend={handleSendMessage} disabled={!connectionStatus} />
    </div>
  </div>
);
}