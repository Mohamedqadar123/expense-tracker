import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Billing.css'
import { useAuth } from '../context/useAuth.js'
import { getBillingStatus, subscribe } from '../api/billing'

function Billing() {
  const { refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [phone, setPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [paid, setPaid] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setStatus(await getBillingStatus());
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPayError(null);
    setPaid(false);
    setIsPaying(true);
    try {
      await subscribe(selectedPlan, phone);
      setPaid(true);
      setPhone('');
      await refreshUser();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setIsPaying(false);
      load();
    }
  };

  if (loadError) {
    return (
      <div className="dashboard-error">
        <p>{loadError}</p>
        <button type="button" onClick={load}>{t('common.retry')}</button>
      </div>
    );
  }

  if (!status) {
    return <p className="dashboard-status">{t('common.loading')}</p>;
  }

  const { access, pricing, paymentsEnabled, payments } = status;
  const formatDate = (value) => new Date(value).toLocaleDateString(i18n.language);
  const formatPrice = (amount) => `${amount} ${pricing.currency}`;
  const planNames = {
    trial: t('billing.planTrial'),
    standard: t('billing.planStandard'),
    pro: t('billing.planPro'),
    expired: t('billing.planExpired'),
  };
  const isPaidPlan = access.plan === 'standard' || access.plan === 'pro';
  const chosen = pricing.plans.find((plan) => plan.id === selectedPlan);

  return (
    <div className="billing-page">
      <h1>{t('billing.title')}</h1>

      <div className="section-card">
        <span className={`billing-plan billing-plan-${access.plan}`}>{planNames[access.plan]}</span>
        {access.plan === 'trial' && <p>{t('billing.trialEnds', { date: formatDate(access.trialEndsAt) })}</p>}
        {isPaidPlan && (
          <p>{t('billing.paidUntil', { plan: planNames[access.plan], date: formatDate(access.paidUntil) })}</p>
        )}
        {access.plan === 'expired' && <p>{t('billing.expired')}</p>}
      </div>

      <div className="section-card">
        <h2>{t('billing.choosePlan')}</h2>
        <form className="billing-form" onSubmit={handleSubmit}>
          <div className="billing-plans">
            {pricing.plans.map((plan) => (
              <label
                key={plan.id}
                className={`billing-plan-option ${selectedPlan === plan.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlan === plan.id}
                  onChange={() => setSelectedPlan(plan.id)}
                  disabled={isPaying}
                />
                <span className="billing-plan-name">{planNames[plan.id]}</span>
                <span className="billing-plan-price">
                  {t('billing.perPeriod', { price: formatPrice(plan.price), days: pricing.periodDays })}
                </span>
                <span className="billing-note">
                  {plan.financeAI ? t('billing.proFeatures') : t('billing.standardFeatures')}
                </span>
              </label>
            ))}
          </div>
          <p className="billing-note">{t('billing.switchNote', { days: pricing.periodDays })}</p>

          {paymentsEnabled ? (
            <>
              <label htmlFor="billing-phone">{t('billing.phoneLabel')}</label>
              <input
                id="billing-phone"
                type="tel"
                inputMode="tel"
                placeholder="61 5551234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPaying}
                required
              />
              {isPaying && <p className="billing-note">{t('billing.paying')}</p>}
              {payError && <p className="billing-error">{payError}</p>}
              {paid && <p className="billing-success">{t('billing.success')}</p>}
              <button type="submit" disabled={isPaying}>
                {t('billing.payButton', { price: formatPrice(chosen.price) })}
              </button>
            </>
          ) : (
            <p className="billing-error">{t('billing.notConfigured')}</p>
          )}
        </form>
      </div>

      <div className="section-card">
        <h2>{t('billing.history')}</h2>
        {payments.length === 0 ? (
          <p className="list-empty">{t('billing.noPayments')}</p>
        ) : (
          <ul className="billing-history">
            {payments.map((payment) => (
              <li key={payment.id}>
                <span>{formatDate(payment.createdAt)}</span>
                <span>{planNames[payment.plan]}</span>
                <span>{payment.amount} {payment.currency}</span>
                <span className={`billing-status billing-status-${payment.status}`}>
                  {t(`billing.status.${payment.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Billing
