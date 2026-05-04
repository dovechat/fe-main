import { useState, useRef } from 'react';
import { sf, colors, styles } from '../../styles/apple';

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
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: colors.background, borderRadius: '20px', fontFamily: sf }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение"
          disabled={disabled}
          style={{ ...styles.input, background: 'transparent', border: 'none', padding: '0', flex: 1 }}
        />
        
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '20px', cursor: 'pointer', color: colors.primary  }}>
          📎
        </button>
        
        <button
          type="submit"
          disabled={(!input.trim() && files.length === 0) || disabled}
          style={(input.trim() || files.length > 0) && !disabled ? styles.buttonPrimary : styles.buttonDisabled}
        >
          ↑
        </button>
      </form>
      
      {files.length > 0 && (
        <div style={{ padding: '8px 14px', fontSize: '13px', color: colors.secondaryText }}>
          {files.map((f, i) => <div key={i}>📎 {f.name}</div>)}
        </div>
      )}
      
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
    </div>
  );
}