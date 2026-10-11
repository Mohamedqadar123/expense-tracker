import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './Feedback.css'

// Asks before something that cannot be undone. Opened through
// useFeedback().confirm rather than rendered directly. Focus starts on
// Cancel, so pressing Enter by reflex never deletes anything.
function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return createPortal(
    <div className="confirm-backdrop" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel} autoFocus>
            {t('common.cancel')}
          </button>
          <button type="button" className="confirm-accept" onClick={onConfirm}>
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog
