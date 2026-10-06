import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { getPlans } from '../api/billing'

const FEATURES = [
  { title: 'Track every shilling and dollar', body: 'Log income and expenses in seconds, across all your accounts: bank, EVC, cash.' },
  { title: 'Budgets that warn you early', body: 'Set a budget per category and get alerted before you overspend, not after.' },
  { title: 'Savings goals', body: 'Put a target and a date on what you are saving for and watch the progress.' },
  { title: 'Recurring transactions', body: 'Rent, salary and subscriptions are recorded automatically on schedule.' },
  { title: 'Finance AI', body: 'Ask questions about your own money in plain language and get answers from your data.', pro: true },
  { title: 'Reports and exports', body: 'Cash-flow and category reports you can export to Excel or CSV.' },
];

function Landing() {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    // The server is the source of truth for prices; the defaults below only
    // show if it can't be reached.
    getPlans().then(setPricing).catch(() => {});
  }, []);

  const trialDays = pricing?.trialDays ?? 7;
  const periodDays = pricing?.periodDays ?? 30;
  const currency = pricing?.currency ?? 'USD';
  const priceOf = (planId, fallback) => {
    const price = pricing?.plans.find((plan) => plan.id === planId)?.price ?? fallback;
    return `${price} ${currency} / ${periodDays} days`;
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-brand">Finance Tracker</span>
        <div className="landing-header-actions">
          <ThemeToggle />
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="landing-button">Start free trial</Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>Know where your money goes.</h1>
        <p>
          Track spending, set budgets and reach your savings goals in English, Somali or Arabic.
          Try everything free for {trialDays} days. No payment needed to start.
        </p>
        <Link to="/signup" className="landing-button landing-button-large">Start your {trialDays}-day free trial</Link>
      </section>

      <section className="landing-section">
        <h2>Everything you need to manage your money</h2>
        <div className="landing-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-card">
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
        <div className="landing-pricing">
          <div className="landing-card">
            <h3>Free</h3>
            <p className="landing-price">{trialDays}-day trial</p>
            <ul>
              <li>Every feature, including Finance AI</li>
              <li>No payment details needed</li>
              <li>Ends after {trialDays} days, then choose a plan</li>
            </ul>
            <Link to="/signup" className="landing-button">Start free trial</Link>
          </div>
          <div className="landing-card">
            <h3>Standard</h3>
            <p className="landing-price">{priceOf('standard', 5)}</p>
            <ul>
              <li>Transactions, accounts and budgets</li>
              <li>Savings goals and recurring transactions</li>
              <li>Reports and exports</li>
            </ul>
            <Link to="/signup" className="landing-button">Get Standard</Link>
          </div>
          <div className="landing-card landing-card-highlight">
            <h3>Pro</h3>
            <p className="landing-price">{priceOf('pro', 10)}</p>
            <ul>
              <li>Everything in Standard</li>
              <li>Finance AI assistant</li>
              <li>Ask questions about your own money</li>
            </ul>
            <Link to="/signup" className="landing-button">Get Pro</Link>
          </div>
        </div>
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
