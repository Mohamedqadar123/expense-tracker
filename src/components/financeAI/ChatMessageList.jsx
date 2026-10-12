import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'

function ChatMessageList({ history, isLoading, error, isSending }) {
  const { t } = useTranslation();

  if (isLoading) return <ListSkeleton label={t('financeAI.loadingConversation')} />;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (history.length === 0 && !isSending) {
    return <EmptyState icon="sparkles" message={t('financeAI.emptyPrompt')} />;
  }

  return (
    <ul className="finance-ai-messages">
      {history.map(m => (
        <li key={m.id} className={`finance-ai-message finance-ai-message-${m.role}`}>
          <span className="finance-ai-message-content">{m.content}</span>
        </li>
      ))}
      {isSending && (
        <li className="finance-ai-message finance-ai-message-assistant finance-ai-message-pending">
          <span className="finance-ai-message-content">{t('financeAI.thinking')}</span>
        </li>
      )}
    </ul>
  );
}

export default ChatMessageList
