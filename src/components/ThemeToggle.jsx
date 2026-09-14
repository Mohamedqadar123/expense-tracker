import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/useTheme.js'
import './ThemeToggle.css'

function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const OPTIONS = [
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
    { value: 'system', label: t('theme.system') },
  ];

  return (
    <div className={`theme-toggle ${className}`} role="group" aria-label={t('theme.label')}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={theme === opt.value}
          onClick={() => setTheme(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle
