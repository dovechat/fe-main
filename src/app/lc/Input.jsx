function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default Input