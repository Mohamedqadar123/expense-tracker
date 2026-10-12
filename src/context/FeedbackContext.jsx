import { useState, useCallback, useMemo, useRef } from 'react'
import FeedbackContext from './feedbackContext.js'
import ConfirmDialog from '../components/feedback/ConfirmDialog.jsx'
import Toasts from '../components/feedback/Toasts.jsx'

const TOAST_MS = 3500;

// How the app talks back about an action: `confirm` asks before something
// that cannot be undone and resolves to true or false; `notify` shows a short
// message that it worked.
export function FeedbackProvider({ children }) {
  const [question, setQuestion] = useState(null);
  const [toasts, setToasts] = useState([]);
  const nextToastId = useRef(0);

  const confirm = useCallback((message, confirmLabel) => new Promise((resolve) => {
    setQuestion({ message, confirmLabel, resolve });
  }), []);

  const answer = (value) => {
    question.resolve(value);
    setQuestion(null);
  };

  const notify = useCallback((message) => {
    const id = nextToastId.current++;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {question && (
        <ConfirmDialog
          message={question.message}
          confirmLabel={question.confirmLabel}
          onConfirm={() => answer(true)}
          onCancel={() => answer(false)}
        />
      )}
      <Toasts toasts={toasts} />
    </FeedbackContext.Provider>
  );
}
