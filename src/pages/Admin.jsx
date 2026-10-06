import { useState, useEffect, useCallback } from 'react'
import '../styles/shared.css'
import './Admin.css'
import { getAdminOverview } from '../api/admin'

const PLAN_LABELS = { trial: 'Free trial', standard: 'Standard', pro: 'Pro', expired: 'Expired' };
const STATUS_LABELS = { approved: 'Paid', failed: 'Failed', pending: 'Pending', unknown: 'Unconfirmed' };
const PLAN_FILTERS = ['all', 'trial', 'standard', 'pro', 'expired'];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
const formatDateTime = (value) => new Date(value).toLocaleString();

function Admin() {
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
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="admin-user-name">{user.name || '-'}</span>
                      <span className="admin-user-email">
                        {user.email}{!user.emailVerified && ' (unverified)'}
                      </span>
                    </td>
                    <td>{formatDate(user.registeredAt)}</td>
                    <td><span className={`admin-plan admin-plan-${user.plan}`}>{PLAN_LABELS[user.plan]}</span></td>
                    <td>{formatDate(user.accessEndsAt)}</td>
                    <td>{user.daysLeft}</td>
                    <td>{money(user.totalPaid)}</td>
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
    </div>
  );
}

export default Admin
