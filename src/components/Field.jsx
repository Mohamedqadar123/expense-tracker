import './Field.css'

// A visible label stacked over the single control it wraps. Wrapping the
// control is what ties the two together, so no id is needed. `error` is the
// message to show under the control when what was entered is not acceptable.
function Field({ label, wide = false, error, children }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''} ${error ? 'field-invalid' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export default Field
