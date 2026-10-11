import './Feedback.css'
import { FeatureIcon } from '../illustrations/Illustrations.jsx'

// What a list shows before it has anything in it. `icon` is one of the
// FeatureIcon names (wallet, bell, target, repeat, sparkles, chart).
function EmptyState({ icon, message }) {
  return (
    <div className="empty-state">
      <FeatureIcon name={icon} />
      <p>{message}</p>
    </div>
  );
}

export default EmptyState
