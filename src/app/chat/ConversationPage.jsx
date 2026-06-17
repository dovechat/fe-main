import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { Paperclip, Smile, Send, Clock, CheckCheck } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { fetchConversation, fetchMessages, setConversationStatus } from './api'
import api from './api'

export default function ConversationPage({ conversationId }) {
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectDelay = useRef(1000)
  const isMounted = useRef(true)

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (!conversationId || !conversation) return

    function connect() {
      if (!isMounted.current) return
      const token = localStorage.getItem('token')
      const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/chat/${conversationId}?token=${token}`)
      ws.current = socket

      socket.onopen = () => {
        if (!isMounted.current) return
        setConnectionStatus(true)
        reconnectDelay.current = 1000
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'new_message') {
          setMessages(prev => {
            if (prev.some(m => String(m.id) === String(data.data.id))) return prev
            if (data.data.direction === 'outbound') {
              const tempIdx = prev.findIndex(m =>
                String(m.id).startsWith('temp-') &&
                m.text === data.data.text &&
                m.direction === 'outbound'
              )
              if (tempIdx !== -1) {
                const next = [...prev]
                next[tempIdx] = data.data
                return next
              }
            }
            return [...prev, data.data]
          })
        } else if (data.type === 'message_status') {
          setMessages(prev => prev.map(msg =>
            String(msg.id) === String(data.data.message_id)
              ? { ...msg, status: data.data.status, media: data.data.media?.length ? data.data.media : msg.media }
              : msg
          ))
        }
      }

      socket.onclose = (event) => {
        if (!isMounted.current) return
        setConnectionStatus(false)
        if (event.code === 1000 || event.code === 1008) return
        const delay = reconnectDelay.current
        reconnectTimeout.current = setTimeout(() => {
          reconnectDelay.current = Math.min(delay * 2, 30000)
          connect()
        }, delay)
      }

      socket.onerror = (err) => console.error('WS error:', err)
    }

    connect()
    return () => {
      clearTimeout(reconnectTimeout.current)
      ws.current?.close(1000)
    }
  }, [conversationId, conversation?.client_phone])

  useEffect(() => {
    if (conversationId) loadConversation()
  }, [conversationId])

  async function loadConversation() {
    try {
      setLoading(true)
      const [convData, messagesData] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ])
      setConversation(convData)
      setMessages(messagesData)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (text, files) => {
    if (!conversation) return
    if (!text.trim() && files.length === 0) return
    const user_email = localStorage.getItem('user_email')
    const mediaItems = files.map(f => ({ id: uuidv4(), file_name: f.name, mime_type: f.type }))
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text,
      direction: 'outbound',
      created_at: new Date().toISOString(),
      user_email,
      status: 'sent',
      media: mediaItems,
    }
    setMessages(prev => [...prev, tempMessage])
    const endpoints = {
      telegram_user: '/messages/tguser',
      telegram_bot: '/messages/tgbot',
      whatsapp_green: '/messages/whatsapp/green',
      waba: '/messages/waba',
      vk: '/messages/vk',
    }
    const endpoint = endpoints[conversation?.channel_type] || '/messages/tguser'
    const formData = new FormData()
    formData.append('data', JSON.stringify({
      conversation_id: conversationId,
      text,
      direction: 'outbound',
      phone: conversation?.client_phone,
      channel_msg_id: '',
      media: mediaItems.length > 0 ? mediaItems : null,
      raw_content: {},
    }))
    files.forEach(f => formData.append('files', f))
    try {
      const response = await api.post(endpoint, formData)
      if (response.data?.id) {
        setMessages(prev => prev.map(m =>
          m.id === tempMessage.id ? response.data : m
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleToggleClose = async () => {
    const newStatus = !conversation.is_closed
    await setConversationStatus(conversationId, newStatus)
    setConversation(prev => ({ ...prev, is_closed: newStatus }))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
      Загрузка...
    </div>
  )

  return (
    <div className="dc-conv-main">
      <div className="dc-conv-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="dc-conv-avatar" style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.75rem' }}>
              {(conversation?.client_phone || '?').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                {conversation?.client_phone || 'Без номера'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                {conversation?.channel_type} • {conversation?.crm_chat_id}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleToggleClose}
              className={`dc-btn dc-btn-sm ${conversation?.is_closed ? 'dc-btn-outline' : ''}`}
              style={{ background: conversation?.is_closed ? undefined : '#ef4444', color: conversation?.is_closed ? undefined : '#fff', borderColor: conversation?.is_closed ? undefined : 'transparent' }}
            >
              {conversation?.is_closed ? 'Открыть' : 'Закрыть'}
            </button>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: connectionStatus ? '#22c55e' : '#ef4444',
              boxShadow: connectionStatus ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
            }} />
          </div>
        </div>
      </div>

      <div className="dc-conv-messages">
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="dc-conv-input-bar">
        <MessageInput onSend={handleSendMessage} disabled={!connectionStatus} />
      </div>
    </div>
  )
}