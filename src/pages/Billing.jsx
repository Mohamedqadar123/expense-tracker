import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Billing.css'
import { useAuth } from '../context/useAuth.js'
import { getBillingStatus, getPlans, subscribe, unsubscribe, resubscribe } from '../api/billing'
import PlanSlides from '../components/PlanSlides.jsx'
import { PLAN_ORDER } from '../constants/plans'
import ThemeToggle from '../components/ThemeToggle.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'

// Public page: visitors pick a plan here and are sent on to sign up with it;
// signed-in users see their current plan here and pay for the next period.
function Billing() {
  const { user, isLoading: isAuthLoading, logout, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get('plan');
  const [activePlan, setActivePlan] = useState(PLAN_ORDER.includes(requestedPlan) ? requestedPlan : 'free');
  const [pricing, setPricing] = useState(null);
  const [status, setStatus] = useState(null);
  const [phone, setPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [paid, setPaid] = useState(false);
  const [planError, setPlanError] = useState(null);
  const phoneInput = useRef(null);
  const userId = user?.id;

  // Visitors only need the public price list; members also get their own
  // subscription and payment history. Failing to load either still leaves
  // the slides usable with the default prices.
  const load = useCallback(() => {
    if (!userId) {
      return getPlans().then(setPricing).catch(() => {});
    }
    return getBillingStatus()
      .then((result) => {
        setStatus(result);
        setPricing(result.pricing);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!isAuthLoading) load();
  }, [isAuthLoading, load]);

  const handleLogout = async () => {
    await logout();
    navigate('/billing');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPayError(null);
    setPaid(false);
    setIsPaying(true);
    try {
      await subscribe(activePlan, phone);
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

  // Unsubscribing never cuts access short, so the confirmation says exactly
  // what will happen: the plan runs to the date already paid for, then ends.
  const handleUnsubscribe = async () => {
    const until = new Date(user.access.paidUntil).toLocaleDateString(i18n.language);
    if (!window.confirm(t('billing.unsubscribeConfirm', { date: until }))) return;
    setPlanError(null);
    try {
      await unsubscribe();
      await refreshUser();
    } catch (err) {
      setPlanError(err.message);
    }
  };

  const handleResubscribe = async () => {
    setPlanError(null);
    try {
      await resubscribe();
      await refreshUser();
    } catch (err) {
      setPlanError(err.message);
    }
  };

  if (isAuthLoading) {
    return <p className="dashboard-status">{t('common.loading')}</p>;
  }

  const access = user?.access;
  const formatDate = (value) => new Date(value).toLocaleDateString(i18n.language);
  const planNames = {
    free: t('billing.planTrial'),
    trial: t('billing.planTrial'),
    standard: t('billing.planStandard'),
    pro: t('billing.planPro'),
    expired: t('billing.planExpired'),
  };
  const isPaidSlide = activePlan !== 'free';
  const chosen = pricing?.plans.find((plan) => plan.id === activePlan);
  const chosenPrice = chosen ? `${chosen.price} ${pricing.currency}` : '';
  const trialDays = pricing?.trialDays ?? 7;

  const renderAction = (planId) => {
    if (!user) {
      return planId === 'free'
        ? <Link to="/signup">{t('billing.startTrial')}</Link>
        : <Link to={`/signup?plan=${planId}`}>{t('billing.signUpFor', { plan: planNames[planId] })}</Link>;
    }
    if (planId === 'free') {
      return access.plan === 'trial'
        ? t('billing.trialEnds', { date: formatDate(access.trialEndsAt) })
        : t('billing.trialUsed');
    }
    return (
      <button type="button" onClick={() => phoneInput.current?.focus()}>
        {t('billing.payFor', { plan: planNames[planId] })}
      </button>
    );
  };

  return (
    <div className="billing-page">
      <header className="billing-header">
        <Link to="/" className="billing-brand">Finance Tracker</Link>
        <div className="billing-header-actions">
          <LanguageSelector />
          <ThemeToggle />
          {user ? (
            <>
              {access.hasAccess && <Link to="/dashboard">{t('nav.home')}</Link>}
              <button type="button" className="billing-logout" onClick={handleLogout}>{t('common.logOut')}</button>
            </>
          ) : (
            <Link to="/login">{t('billing.logIn')}</Link>
          )}
        </div>
      </header>

      <div className="billing-intro">
        <h1>{t('billing.choosePlan')}</h1>
        <p>{t('billing.intro', { days: trialDays })}</p>
      </div>

      {user && (
        <div className="section-card billing-current">
          <span className={`billing-plan billing-plan-${access.plan}`}>{planNames[access.plan]}</span>
          {access.plan === 'trial' && <span>{t('billing.trialEnds', { date: formatDate(access.trialEndsAt) })}</span>}
          {(access.plan === 'standard' || access.plan === 'pro') && !access.cancelled && (
            <>
              <span>{t('billing.paidUntil', { plan: planNames[access.plan], date: formatDate(access.paidUntil) })}</span>
              <button type="button" className="billing-unsubscribe" onClick={handleUnsubscribe}>
                {t('billing.unsubscribe')}
              </button>
            </>
          )}
          {access.cancelled && (
            <>
              <span>{t('billing.unsubscribed', { plan: planNames[access.plan], date: formatDate(access.paidUntil) })}</span>
              <button type="button" className="billing-unsubscribe" onClick={handleResubscribe}>
                {t('billing.keepPlan')}
              </button>
            </>
          )}
          {access.plan === 'expired' && <span>{t('billing.expired')}</span>}
          {planError && <p className="billing-error">{planError}</p>}
        </div>
      )}

      <PlanSlides
        pricing={pricing}
        activePlan={activePlan}
        onActivePlanChange={setActivePlan}
        renderAction={renderAction}
      />

      {user && (
        <div className="section-card billing-pay">
          {!isPaidSlide && <p className="billing-note">{t('billing.pickPaidPlan')}</p>}
          {isPaidSlide && (
            <form className="billing-form" onSubmit={handleSubmit}>
              <h2>{t('billing.payFor', { plan: planNames[activePlan] })}</h2>
              <p className="billing-note">{t('billing.switchNote', { days: pricing?.periodDays ?? 30 })}</p>
              {status?.paymentsEnabled === false ? (
                <p className="billing-error">{t('billing.notConfigured')}</p>
              ) : (
                <>
                  <label htmlFor="billing-phone">{t('billing.phoneLabel')}</label>
                  <input
                    id="billing-phone"
                    ref={phoneInput}
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
                  <button type="submit" disabled={isPaying || !chosen}>
                    {t('billing.payButton', { price: chosenPrice })}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}

      {user && status && (
        <div className="section-card">
          <h2>{t('billing.history')}</h2>
          {status.payments.length === 0 ? (
            <p className="list-empty">{t('billing.noPayments')}</p>
          ) : (
            <ul className="billing-history">
              {status.payments.map((payment) => (
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
      )}
    </div>
  );
}

export default Billing
