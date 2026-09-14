import { useTranslation } from 'react-i18next'
import './FloatingAddButton.css'
import { PlusIcon } from './icons/Icons.jsx'

function FloatingAddButton({ onClick }) {
  const { t } = useTranslation();

  return (
    <button type="button" className="fab" onClick={onClick} aria-label={t('nav.addTransaction')}>
      <PlusIcon />
    </button>
  );
}

export default FloatingAddButton
