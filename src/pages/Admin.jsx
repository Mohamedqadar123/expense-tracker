import { useState, useEffect, useCallback } from 'react'
import '../styles/shared.css'
import './Admin.css'
import { getAdminOverview, suspendUser, unsuspendUser, deleteUser } from '../api/admin'
import BottomSheet from '../components/BottomSheet.jsx'
import Field from '../components/Field.jsx'
import { useFeedback } from '../context/useFeedback.js'

// The grounds for suspending or deleting an account, as set out in the Terms.
const REASON_LABELS = { non_payment: 'Missed payments', terms_violation: 'Violated the Terms and Conditions' };

const PLAN_LABELS = { trial: 'Free trial', standard: 'Standard', pro: 'Pro', expired: 'Expired' };
const STATUS_LABELS = { approved: 'Paid', failed: 'Failed', pending: 'Pending', unknown: 'Unconfirmed' };
const PLAN_FILTERS = ['all', 'trial', 'standard', 'pro', 'expired'];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
const formatDateTime = (value) => new Date(value).toLocaleString();

// Asks why before suspending or permanently deleting an account.
// action is 'suspend' or 'delete'.
function ModerationSheet({ user, action, onClose, onDone }) {
  const [reason, setReason] = useState(user.plan === 'expired' ? 'non_payment' : 'terms_violation');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDelete = action === 'delete';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await (isDelete ? deleteUser(user.id, reason) : suspendUser(user.id, reason));
      onDone(isDelete ? `${user.email} was deleted` : `${user.email} was suspended`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen onClose={onClose} title={isDelete ? 'Delete user' : 'Suspend user'}>
      <form className="admin-moderation-form" onSubmit={handleSubmit}>
        <p>
          <strong>{user.name || user.email}</strong>
          {user.name && <span className="admin-user-email">{user.email}</span>}
        </p>
        <Field label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <p className="admin-moderation-warning">
          {isDelete
            ? 'This permanently deletes the account and all of its data, including its payment history. It cannot be undone.'
            : 'The user is signed out straight away and cannot sign in until you lift the suspension. Their data is kept.'}
        </p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="admin-moderation-actions">
          <button type="submit" className="btn-danger" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : (isDelete ? 'Delete permanently' : 'Suspend')}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
        </div>
      </form>
    </BottomSheet>
  );
}

function Admin() {
  const { confirm, notify } = useFeedback();
  // { user, action } while the suspend/delete sheet is open.
  const [moderating, setModerating] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => (
    getAdminOverview()
      .then((overview) => {
        setData(overview);
        setError(null);
      })
      .catch((err) => setError(err.message))
  ), []);

  useEffect(() => {
    load();
  }, [load]);

  const handleModerationDone = (message) => {
    setModerating(null);
    notify(message);
    load();
  };

  const handleUnsuspend = async (user) => {
    if (!(await confirm(`Let ${user.email} sign in again?`, 'Lift suspension'))) return;
    try {
      await unsuspendUser(user.id);
      notify(`${user.email} can sign in again`);
      load();
    } catch (err) {
      notify(err.message);
    }
  };

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button type="button" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return <p className="dashboard-status">Loading...</p>;
  }

  const { stats, users, payments } = data;
  const money = (amount) => `${amount} ${stats.currency}`;
  const query = search.trim().toLowerCase();
  const visibleUsers = users.filter((user) => (
    (planFilter === 'all' || user.plan === planFilter)
    && (!query || user.email.toLowerCase().includes(query) || (user.name || '').toLowerCase().includes(query))
  ));

  return (
    <div className="admin-page">
      <div className="admin-title">
        <h1>Admin Dashboard</h1>
        <button type="button" onClick={load}>Refresh</button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-label">Registered users</span>
          <span className="admin-stat-value">{stats.totalUsers}</span>
          <span className="admin-stat-note">{stats.newUsersLast7Days} new in the last 7 days</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Paying now</span>
          <span className="admin-stat-value">{stats.planCounts.standard + stats.planCounts.pro}</span>
          <span className="admin-stat-note">{stats.planCounts.standard} Standard, {stats.planCounts.pro} Pro</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">On free trial</span>
          <span className="admin-stat-value">{stats.planCounts.trial}</span>
          <span className="admin-stat-note">{stats.planCounts.expired} expired</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Revenue</span>
          <span className="admin-stat-value">{money(stats.revenueTotal)}</span>
          <span className="admin-stat-note">
            {money(stats.revenueLast30Days)} in the last 30 days, {stats.approvedPayments} payments
          </span>
        </div>
      </div>

      <div className="section-card">
        <h2>Users</h2>
        <div className="admin-filters">
          <input
            type="search"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} aria-label="Filter by plan">
            {PLAN_FILTERS.map((plan) => (
              <option key={plan} value={plan}>{plan === 'all' ? 'All plans' : PLAN_LABELS[plan]}</option>
            ))}
          </select>
        </div>
        {visibleUsers.length === 0 ? (
          <p className="list-empty">No users match.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Registered</th>
                  <th>Plan</th>
                  <th>Ends</th>
                  <th>Days left</th>
                  <th>Total paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} className={user.suspendedAt ? 'admin-row-suspended' : undefined}>
                    <td>
                      <span className="admin-user-name">{user.name || '-'}</span>
                      <span className="admin-user-email">
                        {user.email}{!user.emailVerified && ' (unverified)'}
                      </span>
                    </td>
                    <td>{formatDate(user.registeredAt)}</td>
                    <td>
                      <span className={`admin-plan admin-plan-${user.plan}`}>{PLAN_LABELS[user.plan]}</span>
                      {user.cancelled && <span className="admin-user-email">Unsubscribed</span>}
                      {user.suspendedAt && (
                        <span className="admin-suspended">
                          Suspended {formatDate(user.suspendedAt)}: {REASON_LABELS[user.suspensionReason] || user.suspensionReason}
                        </span>
                      )}
                    </td>
                    <td>{formatDate(user.accessEndsAt)}</td>
                    <td>{user.daysLeft}</td>
                    <td>{money(user.totalPaid)}</td>
                    <td>
                      {user.isAdmin ? (
                        <span className="admin-user-email">Admin</span>
                      ) : (
                        <div className="admin-row-actions">
                          {user.suspendedAt ? (
                            <button type="button" className="btn-secondary" onClick={() => handleUnsuspend(user)}>
                              Unsuspend
                            </button>
                          ) : (
                            <button type="button" className="btn-secondary" onClick={() => setModerating({ user, action: 'suspend' })}>
                              Suspend
                            </button>
                          )}
                          <button type="button" className="btn-danger" onClick={() => setModerating({ user, action: 'delete' })}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section-card">
        <h2>Recent payments</h2>
        {payments.length === 0 ? (
          <p className="list-empty">No payments yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDateTime(payment.createdAt)}</td>
                    <td>{payment.userEmail}</td>
                    <td>{PLAN_LABELS[payment.plan]}</td>
                    <td>{payment.amount} {payment.currency}</td>
                    <td>{payment.phone}</td>
                    <td>
                      <span className={`admin-status-${payment.status}`}>{STATUS_LABELS[payment.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {moderating && (
        <ModerationSheet
          user={moderating.user}
          action={moderating.action}
          onClose={() => setModerating(null)}
          onDone={handleModerationDone}
        />
      )}
    </div>
  );
}

export default Admin
