import { useState, useRef } from 'react';
import { Paperclip, Send, FileText } from 'lucide-react';

const WABA_TEMPLATES = [
  { name: 'disclaimer', language: 'ru', components: [] },
  { name: 'first_welcome_messsage', language: 'en', components: [{ type: 'body', parameters: [{ type: 'text', text: 'DoveChat' }] }] },
];

export default function MessageInput({ onSend, onSendTemplate, disabled, channelType }) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
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

  const handleTemplateClick = (tpl) => {
    setShowTemplates(false);
    onSendTemplate(tpl);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {showTemplates && (
        <div className="dc-template-menu">
          {WABA_TEMPLATES.map(tpl => (
            <button key={tpl.name} className="dc-template-item" onClick={() => handleTemplateClick(tpl)}>
              {tpl.name}
            </button>
          ))}
        </div>
      )}
      <div className="dc-conv-input-row">
        <button type="button" className="dc-conv-icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Вложение">
          <Paperclip size={20} />
        </button>
        {channelType === 'waba' && (
          <button type="button" className="dc-conv-icon-btn" onClick={() => setShowTemplates(v => !v)} aria-label="Шаблон">
            <FileText size={20} />
          </button>
        )}
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