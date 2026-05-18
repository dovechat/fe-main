import { Clock, CheckCheck } from 'lucide-react';
import FileAttachment from './FileAttachment'

const VITE_STORAGE_URL = import.meta.env.VITE_STORAGE_URL;

export default function MessageList({ messages }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px' }}>
      {messages.map((msg) => {
        const isOutgoing = msg.direction === 'outgoing' || msg.direction === 'outbound';
        const isInbound = msg.direction === 'incoming' || msg.direction === 'inbound';

        let mimeType = undefined;
        if (msg.mime_type) {
          mimeType = msg.mime_type;
        }
        if (msg.raw_content && msg.raw_content.mime_type) {
          mimeType = msg.raw_content.mime_type;
        } else if (msg.raw_content && msg.raw_content.media) {
          if (msg.raw_content.media.document) {
            if (msg.raw_content.media.document.mime_type) {
              console.log('document.mime_type: define ', msg.raw_content.media.document.mime_type);
              mimeType = msg.raw_content.media.document.mime_type;
            }
          }
        }

        console.log("document.mime_type mimeType ", mimeType);
        console.log('document.mime_type msg:', msg);

        return (
          <div key={msg.id} className={`dc-conv-msg-row ${isOutgoing ? 'agent' : ''}`}>

            {isOutgoing && msg.media?.length > 0 && !msg.id.toString().startsWith('temp-') && (
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: '14px' }}>
                {msg.media.map((m) => (
                  <div key={m.id} style={{ width: '200px', background: '#00088222', marginBottom: '4px' }}>
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={`${VITE_STORAGE_URL}/${m.id}`} style={{ maxWidth: '200px' }} />
                    ) : (
                      <FileAttachment mimeType={m.mime_type} fileName={m.file_name} fileId={m.id} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={`dc-conv-bubble ${isOutgoing ? 'agent' : 'customer'}`}>

              {isOutgoing && (msg.user_full_name || msg.user_email) && (
                <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8, color: '#cce4ff' }}>
                  {msg.user_full_name || msg.user_email}
                </div>
              )}

              <p style={{ margin: 0 }}>{msg.text}</p>

              <div className="dc-conv-bubble-meta">
                <Clock size={12} />
                <span>
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                {isOutgoing && (
                  <>
                    <CheckCheck size={14} />
                    <span style={{ fontSize: '0.6875rem' }}>
                      {msg.status === 'sent' && 'sent'}
                      {msg.status === 'delivered' && 'delivered'}
                      {msg.status === 'read' && 'read'}
                      {msg.status === 'failed' && 'failed'}
                      {msg.status === 'noAccount' && 'noAccount'}
                      {msg.status === 'yellowCard' && 'yellowCard'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isInbound && msg.media?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '14px' }}>
                {msg.media.map((m) => (
                  <div key={m.id} style={{ width: '200px', background: '#00088222', marginBottom: '4px' }}>
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={`${VITE_STORAGE_URL}/${m.id}`} style={{ maxWidth: '200px' }} />
                    ) : (
                      <FileAttachment mimeType={m.mime_type} fileName={m.file_name} fileId={m.id} />
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}