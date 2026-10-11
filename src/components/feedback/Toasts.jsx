import { createPortal } from 'react-dom'
import './Feedback.css'
import { CheckIcon } from '../icons/Icons.jsx'

// Short "it worked" messages. The region is always in the page, even when
// empty, so screen readers announce a message the moment it appears.
function Toasts({ toasts }) {
  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <CheckIcon />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}

export default Toasts
