import './Field.css'

// A visible label stacked over the single control it wraps. Wrapping the
// control is what ties the two together, so no id is needed.
function Field({ label, wide = false, children }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default Field
