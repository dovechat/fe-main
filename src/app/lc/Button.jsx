function Button({ children, variant = 'primary', loading, ...props }) {
  const variantClass = {
    primary: 'btn-primary',
    success: 'btn-success',
    danger: 'btn-danger',
    secondary: 'btn-secondary',
  }[variant]

  return (
    <button 
      className={`btn ${variantClass}`} 
      disabled={loading || props.disabled}
      // style={{ padding: '8px 16px', maxWidth: '200px' }}
      {...props}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  )
}

export default Button