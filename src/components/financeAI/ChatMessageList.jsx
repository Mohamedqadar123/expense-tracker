import { useTranslation } from 'react-i18next'

function ChatMessageList({ history, isLoading, error, isSending }) {
  const { t } = useTranslation();

  if (isLoading) return <p className="list-empty">{t('financeAI.loadingConversation')}</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (history.length === 0 && !isSending) {
    return <p className="list-empty">{t('financeAI.emptyPrompt')}</p>;
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
