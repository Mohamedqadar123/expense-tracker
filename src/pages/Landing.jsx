import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { HeroIllustration, FeatureIcon } from '../components/illustrations/Illustrations.jsx'
import PlanSlides from '../components/PlanSlides.jsx'
import { getPlans } from '../api/billing'

const PLAN_LABELS = { standard: 'Standard', pro: 'Pro' };

const FEATURES = [
  { icon: 'wallet', tone: 'info', title: 'Track every shilling and dollar', body: 'Log income and expenses in seconds, across all your accounts: bank, EVC, cash.' },
  { icon: 'bell', tone: 'warning', title: 'Budgets that warn you early', body: 'Set a budget per category and get alerted before you overspend, not after.' },
  { icon: 'target', tone: 'success', title: 'Savings goals', body: 'Put a target and a date on what you are saving for and watch the progress.' },
  { icon: 'repeat', tone: 'info', title: 'Recurring transactions', body: 'Rent, salary and subscriptions are recorded automatically on schedule.' },
  { icon: 'sparkles', tone: 'warning', title: 'Finance AI', body: 'Ask questions about your own money in plain language and get answers from your data.', pro: true },
  { icon: 'chart', tone: 'success', title: 'Reports and exports', body: 'Cash-flow and category reports you can export to Excel or CSV.' },
];

function Landing() {
  const [pricing, setPricing] = useState(null);
  const [activePlan, setActivePlan] = useState('free');

  useEffect(() => {
    // The server is the source of truth for prices; the defaults below only
    // show if it can't be reached.
    getPlans().then(setPricing).catch(() => {});
  }, []);

  const trialDays = pricing?.trialDays ?? 7;

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-brand">Finance Tracker</span>
        <div className="landing-header-actions">
          <ThemeToggle />
          <Link to="/login">Log in</Link>
          <Link to="/billing" className="landing-button">Start free trial</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
        <h1>Know where your money goes.</h1>
        <p>
          Track spending, set budgets and reach your savings goals in English, Somali or Arabic.
          Try everything free for {trialDays} days. No payment needed to start.
        </p>
        <Link to="/billing" className="landing-button landing-button-large">Start your {trialDays}-day free trial</Link>
        </div>
        <HeroIllustration />
      </section>

      <section className="landing-section">
        <h2>Everything you need to manage your money</h2>
        <div className="landing-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-card">
              <FeatureIcon name={feature.icon} tone={feature.tone} />
              <h3>
                {feature.title}
                {feature.pro && <span className="landing-pro-tag">Pro</span>}
              </h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="pricing">
        <h2>Simple pricing</h2>
        <PlanSlides
          pricing={pricing}
          activePlan={activePlan}
          onActivePlanChange={setActivePlan}
          renderAction={(planId) => (
            <Link to={`/billing?plan=${planId}`}>
              {planId === 'free' ? 'Start free trial' : `Choose ${PLAN_LABELS[planId]}`}
            </Link>
          )}
        />
        <p className="landing-pricing-note">
          Every plan starts with the {trialDays}-day free trial. Pay with EVC Plus, Zaad or Sahal.
        </p>
      </section>

      <footer className="landing-footer">
        <span>Finance Tracker</span>
        <Link to="/login">Log in</Link>
      </footer>
    </div>
  );
}

export default Landing
