import { useTranslation } from 'react-i18next'
import { useLanguage } from '../context/useLanguage.js'
import './LanguageSelector.css'

const OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'so', label: 'Soomaali' },
  { value: 'ar', label: 'العربية' },
];

function LanguageSelector({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <select
      className={`language-selector ${className}`}
      aria-label={t('language.label')}
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
    >
      {OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default LanguageSelector
