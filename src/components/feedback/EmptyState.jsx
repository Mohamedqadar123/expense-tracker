import './Feedback.css'
import { FeatureIcon } from '../illustrations/Illustrations.jsx'

// What a list or page shows before it has anything in it. `icon` is one of
// the FeatureIcon names (wallet, bell, target, repeat, sparkles, chart).
// A `title` and an action (passed as children) are optional.
function EmptyState({ icon, title, message, children }) {
  return (
    <div className="empty-state">
      <FeatureIcon name={icon} />
      {title && <h3 className="empty-state-title">{title}</h3>}
      <p>{message}</p>
      {children && <div className="empty-state-action">{children}</div>}
    </div>
  );
}

export default EmptyState
