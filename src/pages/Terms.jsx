import { Link } from 'react-router-dom'
import './Terms.css'

// Shown when the Terms are changed; see "Changes to these Terms".
const LAST_UPDATED = '12 October 2026';

// Public: linked from sign-up and the landing page, readable without an
// account. Sections "Payments" and "Suspension and removal" are the grounds
// admins act on from the Admin dashboard (server/src/constants/moderation.js).
function Terms() {
  return (
    <div className="terms-page">
      <article className="terms-card">
        <Link to="/" className="terms-back">Finance Tracker</Link>
        <h1>Terms and Conditions</h1>
        <p className="terms-updated">Last updated: {LAST_UPDATED}</p>

        <p>
          These Terms and Conditions ("Terms") are the rules for using Finance Tracker (the "app"). By creating an
          account or using the app, you agree to them. If you do not agree, do not use the app.
        </p>

        <section>
          <h2>1. Your account</h2>
          <ul>
            <li>You must give a real email address that belongs to you. Your account is only created once you confirm it.</li>
            <li>One account is for one person. Do not share your account or let someone else use it.</li>
            <li>Keep your password secret. You are responsible for everything done with your account.</li>
            <li>Tell us straight away if you think someone else has used your account.</li>
          </ul>
        </section>

        <section>
          <h2>2. Free trial and plans</h2>
          <ul>
            <li>Your first registration gets a free trial with every feature for a limited number of days, shown when you sign up.</li>
            <li>
              The free trial is given only once per person. An email address that has already had a trial, or another way of
              writing the same address, does not get another one, even if the earlier account was deleted. Creating extra
              accounts to get more free trials breaks these Terms.
            </li>
            <li>After the trial, you need a paid plan to keep using the app. The Standard plan includes everything except Finance AI; the Pro plan includes Finance AI.</li>
            <li>Plans are prepaid for a 30-day period. Prices are shown on the Billing page before you pay.</li>
          </ul>
        </section>

        <section>
          <h2>3. Payments</h2>
          <ul>
            <li>Payments are made by mobile money (such as EVC Plus, Zaad or Sahal) through our payment provider.</li>
            <li>Plans do not renew by themselves. To keep access, you must pay for each new period before the current one ends.</li>
            <li>If you do not pay, your access ends when your trial or paid period runs out. Your data is kept for a reasonable time so you can pay and continue.</li>
            <li>You can unsubscribe at any time. You keep access until the end of the period you paid for. Payments for a period that has started are not refunded.</li>
            <li>
              Reversing a payment, using a phone number or wallet that is not yours, or any other attempt to avoid paying
              is treated as a failure to pay and may lead to suspension or removal of your account.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable use</h2>
          <p>When you use the app, you must not:</p>
          <ul>
            <li>break any law, or use the app to record or hide money from fraud, theft or other crime;</li>
            <li>try to get into another person's account, or into parts of the app you are not allowed to use;</li>
            <li>attack, overload, scan or interfere with the app or its servers, including with automated scripts;</li>
            <li>copy, resell or rent out the app or access to it;</li>
            <li>misuse Finance AI, for example by trying to make it produce harmful content or reveal how it works;</li>
            <li>create accounts with false details, or create a new account after one of yours has been removed.</li>
          </ul>
        </section>

        <section>
          <h2>5. Suspension and removal</h2>
          <p>We may suspend or permanently delete your account if:</p>
          <ul>
            <li>you fail to pay, or try to avoid paying, as described in section 3; or</li>
            <li>you break these Terms, in particular section 4.</li>
          </ul>
          <p>
            A suspended account cannot be signed in to, but its data is kept, and the suspension can be lifted.
            A deleted account and all of its data, including transactions, budgets, goals and payment history, are
            removed permanently and cannot be recovered. If you think your account was suspended by mistake, contact us.
          </p>
        </section>

        <section>
          <h2>6. Your data</h2>
          <ul>
            <li>The financial information you enter belongs to you. We use it only to run the app for you.</li>
            <li>We do not sell your data.</li>
            <li>
              When you use Finance AI, a summary of your figures and your question are sent to our AI provider to
              produce the answer.
            </li>
            <li>You can delete your own records at any time. When an account is deleted, its data is deleted with it.</li>
            <li>
              The one thing kept after deletion is a one-way fingerprint of the email address. It cannot be turned back into
              the address, and it is used only to make sure the free trial is not given twice.
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Not financial advice</h2>
          <p>
            The app, its reports and Finance AI help you understand your own figures. They are for information only and
            are not professional financial, tax or legal advice. Finance AI can make mistakes. Check important figures
            yourself before relying on them.
          </p>
        </section>

        <section>
          <h2>8. Availability and liability</h2>
          <ul>
            <li>We work to keep the app available and your data safe, but we cannot promise it will always be available or free of errors.</li>
            <li>The figures in the app are only as accurate as what you enter. Keep your own copies of important records; the app lets you export them.</li>
            <li>As far as the law allows, we are not liable for indirect losses, or for losses caused by incorrect entries, misuse of your account, or decisions you make based on the app.</li>
          </ul>
        </section>

        <section>
          <h2>9. Changes to these Terms</h2>
          <p>
            We may update these Terms. The date at the top shows when they last changed. If the changes are important,
            we will tell you in the app or by email. Continuing to use the app after a change means you accept the new Terms.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            For questions about these Terms, or about a suspended account, reply to any email the app has sent you.
          </p>
        </section>
      </article>
    </div>
  );
}

export default Terms
