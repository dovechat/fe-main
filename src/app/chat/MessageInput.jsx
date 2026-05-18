import { useState, useRef } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';

export default function MessageInput({ onSend, disabled }) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !disabled) {
      onSend(input, files);
      setInput('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e) => {
    setFiles(Array.from(e.target.files));
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="dc-conv-input-row">
        <button type="button" className="dc-conv-icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Вложение">
          <Paperclip size={20} />
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="dc-conv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
            placeholder="Написать сообщение…"
            disabled={disabled}
          />
          {/*
          <button
            type="button"
            className="dc-conv-icon-btn"
            style={{ position: 'absolute', right: '0.15rem', top: '50%', transform: 'translateY(-50%)' }}
            aria-label="Эмодзи"
          >
            <Smile size={18} />
          </button>
          */}
        </div>

        <button
          type="button"
          className="dc-conv-send"
          disabled={(!input.trim() && files.length === 0) || disabled}
          onClick={handleSubmit}
          aria-label="Отправить"
        >
          <Send size={18} />
        </button>
      </div>

      {files.length > 0 && (
        <div style={{ padding: '8px 14px', fontSize: '13px', color: '#6b7280' }}>
          {files.map((f, i) => <div key={i}>📎 {f.name}</div>)}
        </div>
      )}

      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
    </div>
  );
}