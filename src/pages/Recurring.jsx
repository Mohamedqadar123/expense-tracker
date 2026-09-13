import './Recurring.css'
import RecurringTransactionsSection from '../components/recurring/RecurringTransactionsSection.jsx'

function Recurring() {
  return (
    <div className="recurring-page">
      <h1>Recurring Transactions</h1>
      <p className="subtitle">Automate repeating income and expenses</p>
      <RecurringTransactionsSection />
    </div>
  );
}

export default Recurring
