export default function AuthLayout({ title, children, footer }) {
  return (
    <div className="login-page">
      <div className="login-background-simple" />
      <div className="login-background-bird" />
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🕊</span>
          <span className="login-logo-text">DoveChat</span>
        </div>
        <h2 className="login-title">{title}</h2>
        {children}
        {footer && <div className="login-footer">{footer}</div>}
      </div>
    </div>
  )
}
