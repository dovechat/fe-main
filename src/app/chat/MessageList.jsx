import { sf, colors } from '../../styles/apple';
import { useEffect } from 'react';
import FileAttachment from './FileAttachment'

const VITE_STORAGE_URL = import.meta.env.VITE_STORAGE_URL;

export default function MessageList({ messages }) {
  // console.log('messages before render:', JSON.stringify(messages, null, 2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px', fontFamily: sf }}>
      {messages.map((msg) => {
        const isOutgoing = msg.direction === 'outgoing' || msg.direction === 'outbound';
        const isInbound = msg.direction === 'incoming' || msg.direction === 'inbound';
        const fileName = msg.raw_content?.media?.document?.attributes?.[0]?.file_name || 'Файл';
        console.log('document.mime_type: direction', msg.direction);
        console.log('document.mime_type: id', msg.id);

        let mimeType = undefined;
        if (msg.mime_type) {
          mimeType = msg.mime_type;
        }
        if (msg.raw_content && msg.raw_content.mime_type) {
          mimeType = msg.raw_content.mime_type;
        }
        else if (msg.raw_content && msg.raw_content.media) {
          if (msg.raw_content.media.document) {
            if (msg.raw_content.media.document.mime_type) {
              console.log('document.mime_type: define ', msg.raw_content.media.document.mime_type);
              mimeType = msg.raw_content.media.document.mime_type;
            }
          }
        }
        /*
        if (isInbound && msg.is_new) {
          console.log("document.mime_type mimeType ", mimeType);
        }
        */


        console.log("document.mime_type mimeType ", mimeType);
        console.log('document.mime_type msg:', msg);


        // console.log('msg.raw_content?.media?._, dir :', msg.raw_content?.media?._, msg.direction);


        // console.log('MessageList messages:', JSON.stringify(messages, null, 2));
        return (
          <div key={msg.id} style={{ display: 'flex', justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
           


{isOutgoing && msg.media?.length > 0 && !msg.id.toString().startsWith('temp-') && (
  <div style={{ display: 'flex', flexDirection: 'column', marginRight: '14px' }}>
    {msg.media.map((m) => (
      <div key={m.id} style={{ width: "200px", background: '#00088222', marginBottom: '4px' }}>
        {m.mime_type?.startsWith('image/') ? (
          <img src={`${VITE_STORAGE_URL}/${m.id}`} style={{ maxWidth: '200px' }} />
        ) : (
          <FileAttachment
            mimeType={m.mime_type}
            fileName={m.file_name}
            fileId={m.id}
          />
        )}
      </div>
    ))}
  </div>
)}





{/*

{msg.media_id && msg.raw_content?.media?._ != 'MessageMediaPhoto' && (
  <div style={{ marginBottom: '8px' }}>
    {msg.raw_content?.media?.document?.mime_type?.startsWith('image/') ? (
      <img 
        src={`${import.meta.env.VITE_STORAGE_URL}/${msg.media_id}`}
        alt=""
        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
      />
    ) : (

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        background: 'rgba(0,0,0,0.05)',
        borderRadius: '8px',
        fontSize: '13px'
      }}>
        📎 *** {msg.file_name || 'Файл'}
      </div>

    )}
  </div>
)}


*/}
  


            <div style={{
              maxWidth: '65%',
              padding: '10px 14px',
              borderRadius: isOutgoing ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: isOutgoing ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : colors.background,
              color: isOutgoing ? colors.white : colors.text,
              boxShadow: isOutgoing ? '0 2px 8px rgba(0,122,255,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
              wordBreak: 'break-word',
            }}>




              {isOutgoing && (msg.user_full_name || msg.user_email) && (
                <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8, color: '#cce4ff' }}>
                  {msg.user_full_name || msg.user_email}
                </div>
              )}






              <div style={{ fontSize: '15px', lineHeight: '1.4' }}>{msg.text}</div>

              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7, textAlign: 'right', color: isOutgoing ? '#cce4ff' : colors.secondaryText }}>
                {isOutgoing && (
                  <span style={{ marginRight: '4px' }}>
                    {msg.status === 'sent' && 'sent'}
                    {msg.status === 'delivered' && 'delivered'}
                    {msg.status === 'read' && 'read'}
                    {msg.status === 'failed' && 'failed'}
                    {msg.status === 'noAccount' && 'noAccount'}
                    {msg.status === 'yellowCard' && 'yellowCard'}
                  </span>
                )}
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>

{isInbound && msg.media?.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '14px' }}>
    {msg.media.map((m) => (
      <div key={m.id} style={{ width: "200px", background: '#00088222', marginBottom: '4px' }}>
        {m.mime_type?.startsWith('image/') ? (
          <img src={`${VITE_STORAGE_URL}/${m.id}`} style={{ maxWidth: '200px' }} />
        ) : (
          <FileAttachment
            mimeType={m.mime_type}
            fileName={m.file_name}
            fileId={m.id}
          />
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