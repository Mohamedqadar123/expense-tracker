import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './FinanceAI.css'
import { getAiMessages, askAiQuestion, clearAiMessages } from '../api/financeAI'
import ChatMessageList from '../components/financeAI/ChatMessageList.jsx'

function FinanceAI() {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [questionInput, setQuestionInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const load = () => {
    setIsLoading(true);
    setLoadError(null);
    getAiMessages()
      .then(setHistory)
      .catch(() => setLoadError(t('financeAI.loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = questionInput.trim();
    if (!question || isSending) return;

    setSendError(null);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = { id: tempId, role: 'user', content: question, createdAt: new Date().toISOString() };
    setHistory(prev => [...prev, optimisticMessage]);
    setQuestionInput('');
    setIsSending(true);

    try {
      const { userMessage, assistantMessage } = await askAiQuestion(question);
      setHistory(prev => [...prev.filter(m => m.id !== tempId), userMessage, assistantMessage]);
    } catch (err) {
      setHistory(prev => prev.filter(m => m.id !== tempId));
      setQuestionInput(question);
      setSendError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(t('financeAI.clearConfirm'))) return;
    await clearAiMessages();
    setHistory([]);
  };

  return (
    <div className="finance-ai-page">
      <h1>{t('financeAI.title')}</h1>
      <p className="subtitle">{t('financeAI.subtitle')}</p>

      <div className="finance-ai-disclaimer">
        {t('financeAI.disclaimer')}
      </div>

      <div className="section-card">
        <div className="finance-ai-header">
          <h2>{t('financeAI.conversation')}</h2>
          {history.length > 0 && (
            <button type="button" onClick={handleClear}>{t('financeAI.clearHistory')}</button>
          )}
        </div>

        <ChatMessageList history={history} isLoading={isLoading} error={loadError} isSending={isSending} />

        <form className="inline-form finance-ai-input-row" onSubmit={handleSend}>
          <input
            type="text"
            placeholder={t('financeAI.inputPlaceholder')}
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={isSending}
          />
          <button type="submit" disabled={isSending || !questionInput.trim()}>{t('financeAI.send')}</button>
        </form>
        {sendError && <p className="auth-error">{sendError}</p>}
      </div>
    </div>
  );
}

export default FinanceAI
