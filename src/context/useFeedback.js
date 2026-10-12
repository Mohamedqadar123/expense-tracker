import { useContext } from 'react'
import FeedbackContext from './feedbackContext.js'

// A component rendered on its own, outside a FeedbackProvider, still works:
// questions go to the browser's own prompt and messages are dropped.
const STANDALONE = {
  confirm: (message) => Promise.resolve(window.confirm(message)),
  notify: () => {},
};

export function useFeedback() {
  return useContext(FeedbackContext) || STANDALONE;
}
