import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Calculator.css'
import {
  initialCalculatorState,
  inputDigit,
  inputDecimal,
  toggleSign,
  inputPercent,
  backspace,
  clearAll,
  chooseOperator,
  calculateResult,
} from '../utils/calculator'

const HISTORY_STORAGE_KEY = 'calculator:history';
const MAX_HISTORY = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Calculator() {
  const { t } = useTranslation();
  const [state, setState] = useState(initialCalculatorState);
  const [history, setHistory] = useState(loadHistory);

  // Side effect lives in its own effect, never inside a setState updater —
  // React 18 Strict Mode intentionally double-invokes updater functions in
  // dev to catch exactly that kind of impurity, which would otherwise write
  // every history entry twice.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Best-effort only (private browsing / storage disabled) — history
      // just won't persist across reloads, which isn't worth surfacing.
    }
  }, [history]);

  // Plain handlers (not memoized) that read `state` directly from this
  // render's closure, so every call acts on the latest value without
  // needing the setState-updater-function form.
  const handleDigit = (d) => setState(inputDigit(state, d));
  const handleDecimal = () => setState(inputDecimal(state));
  const handleSign = () => setState(toggleSign(state));
  const handlePercent = () => setState(inputPercent(state));
  const handleBackspace = () => setState(backspace(state));
  const handleClear = () => setState(clearAll());
  const handleOperator = (op) => setState(chooseOperator(state, op));
  const handleEquals = () => {
    const { state: next, historyEntry } = calculateResult(state);
    setState(next);
    if (historyEntry) {
      setHistory((prev) => [historyEntry, ...prev].slice(0, MAX_HISTORY));
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) { handleDigit(e.key); return; }
      if (e.key === '.') { handleDecimal(); return; }
      if (e.key === '+') { handleOperator('+'); return; }
      if (e.key === '-') { handleOperator('−'); return; }
      if (e.key === '*') { handleOperator('×'); return; }
      if (e.key === '/') { e.preventDefault(); handleOperator('÷'); return; }
      if (e.key === '%') { handlePercent(); return; }
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); return; }
      if (e.key === 'Backspace') { handleBackspace(); return; }
      if (e.key === 'Escape') { handleClear(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // Re-subscribes on every state change so the listener always closes
    // over the latest `state` — cheap for a calculator's input volume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleClearHistory = () => {
    if (!window.confirm(t('calculator.clearHistoryConfirm'))) return;
    setHistory([]);
  };

  const isError = state.display === 'Error';

  return (
    <div className="calculator-page">
      <h1>{t('calculator.title')}</h1>
      <p className="subtitle">{t('calculator.subtitle')}</p>

      <div className="calculator-layout">
        <div className="calculator-card">
          <div className="calculator-display">
            <div className="calculator-expression">{state.expression || ' '}</div>
            <div className={`calculator-value${isError ? ' calculator-value-error' : ''}`}>
              {isError ? t('calculator.error') : state.display}
            </div>
          </div>

          <div className="calculator-keypad">
            <button type="button" className="calc-btn calc-btn-fn" onClick={handleClear}>AC</button>
            <button type="button" className="calc-btn calc-btn-fn" onClick={handleSign}>±</button>
            <button type="button" className="calc-btn calc-btn-fn" onClick={handlePercent}>%</button>
            <button type="button" className="calc-btn calc-btn-op" onClick={() => handleOperator('÷')}>÷</button>

            <button type="button" className="calc-btn" onClick={() => handleDigit('7')}>7</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('8')}>8</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('9')}>9</button>
            <button type="button" className="calc-btn calc-btn-op" onClick={() => handleOperator('×')}>×</button>

            <button type="button" className="calc-btn" onClick={() => handleDigit('4')}>4</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('5')}>5</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('6')}>6</button>
            <button type="button" className="calc-btn calc-btn-op" onClick={() => handleOperator('−')}>−</button>

            <button type="button" className="calc-btn" onClick={() => handleDigit('1')}>1</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('2')}>2</button>
            <button type="button" className="calc-btn" onClick={() => handleDigit('3')}>3</button>
            <button type="button" className="calc-btn calc-btn-op" onClick={() => handleOperator('+')}>+</button>

            <button type="button" className="calc-btn calc-btn-zero" onClick={() => handleDigit('0')}>0</button>
            <button type="button" className="calc-btn" onClick={handleDecimal}>.</button>
            <button type="button" className="calc-btn calc-btn-backspace" onClick={handleBackspace} aria-label="Backspace">⌫</button>
            <button type="button" className="calc-btn calc-btn-equals" onClick={handleEquals}>=</button>
          </div>
        </div>

        <div className="calculator-history section-card">
          <div className="calculator-history-header">
            <h2>{t('calculator.historyHeading')}</h2>
            {history.length > 0 && (
              <button type="button" onClick={handleClearHistory}>{t('calculator.clearHistory')}</button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="list-empty">{t('calculator.historyEmpty')}</p>
          ) : (
            <ul className="calculator-history-list">
              {history.map((entry, i) => (
                <li key={i}>
                  <span className="calculator-history-expression">{entry.expression}</span>
                  <span className="calculator-history-result">= {entry.result}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Calculator
