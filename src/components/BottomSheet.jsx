import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './BottomSheet.css'
import { CloseIcon } from './icons/Icons.jsx'

function BottomSheet({ isOpen, onClose, title, children }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-header">
          <h2>{title}</h2>
          <button type="button" className="bottom-sheet-close" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon />
          </button>
        </div>
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default BottomSheet
