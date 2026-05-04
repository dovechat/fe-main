import { useEffect, useRef, useState } from 'react'

const VITE_STORAGE_URL = import.meta.env.VITE_STORAGE_URL

/* ── Иконки по mime_type ── */
function getIcon(mimeType, fileName) {
  if (!mimeType && fileName) {
    const ext = fileName.split('.').pop().toLowerCase()
    if (ext === 'pdf')                    return { icon: '📄', color: '#e53935', label: 'PDF' }
    if (['doc','docx'].includes(ext))     return { icon: '📝', color: '#1565c0', label: 'Word' }
    if (['xls','xlsx'].includes(ext))     return { icon: '📊', color: '#2e7d32', label: 'Excel' }
    if (['zip','rar','7z'].includes(ext)) return { icon: '🗜️', color: '#6d4c41', label: 'Архив' }
    if (ext === 'txt')                    return { icon: '📃', color: '#546e7a', label: 'TXT' }
    return { icon: '📎', color: '#546e7a', label: ext.toUpperCase() }
  }

  if (mimeType === 'application/pdf')
    return { icon: '📄', color: '#e53935', label: 'PDF' }
  if (mimeType?.includes('word') || mimeType?.includes('msword'))
    return { icon: '📝', color: '#1565c0', label: 'Word' }
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('ms-excel'))
    return { icon: '📊', color: '#2e7d32', label: 'Excel' }
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z'))
    return { icon: '🗜️', color: '#6d4c41', label: 'Архив' }
  if (mimeType === 'text/plain')
    return { icon: '📃', color: '#546e7a', label: 'TXT' }
  return { icon: '📎', color: '#546e7a', label: 'Файл' }
}
/* ── /Иконки по mime_type ── */

export default function FileAttachment({ mimeType, fileName, fileId }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  /* ── IntersectionObserver — показываем только при появлении в viewport ── */
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '100px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  /* ── /IntersectionObserver ── */

  const { icon, color, label } = getIcon(mimeType, fileName)
  const url = `${VITE_STORAGE_URL}/${fileId}`

  return (
    <div ref={ref} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      background: 'rgba(0,0,0,0.05)',
      borderRadius: 10,
      minWidth: 160,
      maxWidth: 220,
    }}>
      {visible ? (
        <>
          {/* ── Иконка ── */}
          <div style={{
            fontSize: 28,
            lineHeight: 1,
            minWidth: 32,
            textAlign: 'center',
          }}>
            {icon}
          </div>

          {/* ── Имя и скачать ── */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 11,
              color: '#555',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 150,
            }}>
              {fileName || 'Файл'}
            </div>
            <a href={url} download={fileName}
              style={{ fontSize: 11, color: '#1976d2', textDecoration: 'none' }}>
              Скачать
            </a>
          </div>
        </>
      ) : (
        <div style={{ width: 160, height: 48 }} />
      )}
    </div>
  )
}