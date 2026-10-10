import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './PlanSlides.css'
import { PLAN_ORDER } from '../constants/plans'

// Every service in the app, named with the same labels as the navigation.
const SERVICES = ['transactions', 'accounts', 'budgets', 'goals', 'recurring', 'reports', 'calculator', 'financeAI'];

// Used until the server's prices have loaded (or if it can't be reached).
const DEFAULT_PRICING = {
  currency: 'USD',
  periodDays: 30,
  trialDays: 7,
  plans: [{ id: 'standard', price: 5, financeAI: false }, { id: 'pro', price: 10, financeAI: true }],
};

const SWIPE_THRESHOLD_PX = 40;

function Mark({ included }) {
  return (
    <svg className={`plan-mark ${included ? 'plan-mark-yes' : 'plan-mark-no'}`} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      {included ? <path d="M5.5 10.5l3 3 6-7" /> : <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" />}
    </svg>
  );
}

// One slide per plan (Free trial, Standard, Pro), each listing which services
// it includes. `renderAction(planId)` supplies the button under each slide,
// so the same slides work for visitors (sign up) and for members (pay).
function PlanSlides({ pricing, activePlan, onActivePlanChange, renderAction }) {
  const { t } = useTranslation();
  const touchStartX = useRef(null);
  const { currency, periodDays, trialDays, plans } = pricing || DEFAULT_PRICING;
  const activeIndex = Math.max(0, PLAN_ORDER.indexOf(activePlan));
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const slides = PLAN_ORDER.map((id) => {
    if (id === 'free') {
      return {
        id,
        name: t('billing.planTrial'),
        price: t('billing.trialPrice', { days: trialDays }),
        description: t('billing.freeDesc', { days: trialDays }),
        includes: () => true,
      };
    }
    const plan = plans.find((item) => item.id === id);
    return {
      id,
      name: id === 'pro' ? t('billing.planPro') : t('billing.planStandard'),
      price: t('billing.perPeriod', { price: `${plan.price} ${currency}`, days: periodDays }),
      description: id === 'pro' ? t('billing.proDesc') : t('billing.standardDesc'),
      includes: (service) => service !== 'financeAI' || plan.financeAI,
    };
  });

  const goTo = (index) => {
    const clamped = Math.min(Math.max(index, 0), slides.length - 1);
    onActivePlanChange(PLAN_ORDER[clamped]);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    // Swiping towards the start of the line moves forward, in either direction of text.
    const forward = isRtl ? delta > 0 : delta < 0;
    goTo(activeIndex + (forward ? 1 : -1));
  };

  return (
    <div className="plan-slides" role="group" aria-roledescription="carousel" aria-label={t('billing.choosePlan')}>
      <div className="plan-slides-frame">
        <button
          type="button"
          className="plan-slides-arrow"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label={t('billing.previous')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>

        <div
          className="plan-slides-viewport"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="plan-slides-track"
            style={{ transform: `translateX(${(isRtl ? 1 : -1) * activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <section
                key={slide.id}
                className={`plan-slide plan-slide-${slide.id}`}
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${slides.length}: ${slide.name}`}
                aria-hidden={index !== activeIndex}
                inert={index !== activeIndex}
              >
                <span className="plan-slide-step">{index + 1} / {slides.length}</span>
                <h3>{slide.name}</h3>
                <p className="plan-slide-price">{slide.price}</p>
                <p className="plan-slide-description">{slide.description}</p>
                <ul className="plan-slide-services">
                  {SERVICES.map((service) => {
                    const included = slide.includes(service);
                    return (
                      <li key={service} className={included ? '' : 'plan-service-missing'}>
                        <Mark included={included} />
                        <span>{t(`nav.${service}`)}</span>
                        <span className="plan-visually-hidden">
                          {included ? t('billing.included') : t('billing.notIncluded')}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="plan-slide-action">{renderAction(slide.id)}</div>
              </section>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="plan-slides-arrow"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === slides.length - 1}
          aria-label={t('billing.next')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="plan-slides-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === activeIndex ? 'active' : ''}
            onClick={() => goTo(index)}
            aria-current={index === activeIndex}
          >
            {slide.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlanSlides
