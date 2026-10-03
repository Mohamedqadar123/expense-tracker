// Pure, framework-free calculator engine (classic accumulator machine:
// previous value + pending operator + current entry), kept separate from
// Calculator.jsx so the arithmetic itself is easy to unit test in isolation.

export const OPERATORS = ['÷', '×', '−', '+'];
export const MAX_DIGITS = 15;

export function initialCalculatorState() {
  return {
    display: '0',
    previousValue: null,
    operator: null,
    overwrite: true,
    expression: '',
  };
}

// Rounds away long floating-point tails (e.g. 0.1 + 0.2) and formats for
// display, falling back to exponential notation if the result is too wide
// for the digit budget.
export function formatResult(value) {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 1e10) / 1e10;
  let str = String(rounded);
  if (str.replace(/[-.]/g, '').length > MAX_DIGITS) {
    str = rounded.toPrecision(10).replace(/\.?0+$/, '').replace(/\.?0+e/, 'e');
  }
  return str;
}

export function applyOperator(a, b, operator) {
  switch (operator) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

export function inputDigit(state, digit) {
  if (state.display === 'Error') return inputDigit(initialCalculatorState(), digit);
  if (state.overwrite) {
    return { ...state, display: digit, overwrite: false };
  }
  if (state.display === '0') {
    return { ...state, display: digit };
  }
  if (state.display.replace(/[-.]/g, '').length >= MAX_DIGITS) {
    return state;
  }
  return { ...state, display: state.display + digit };
}

export function inputDecimal(state) {
  if (state.display === 'Error') return { ...initialCalculatorState(), display: '0.', overwrite: false };
  if (state.overwrite) {
    return { ...state, display: '0.', overwrite: false };
  }
  if (state.display.includes('.')) return state;
  return { ...state, display: state.display + '.' };
}

export function toggleSign(state) {
  if (state.display === '0' || state.display === 'Error') return state;
  return {
    ...state,
    display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`,
  };
}

export function inputPercent(state) {
  if (state.display === 'Error') return state;
  const value = Number(state.display) / 100;
  return { ...state, display: formatResult(value) ?? '0' };
}

export function backspace(state) {
  if (state.display === 'Error' || state.overwrite) return initialCalculatorState();
  if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith('-'))) {
    return { ...state, display: '0' };
  }
  return { ...state, display: state.display.slice(0, -1) };
}

export function clearAll() {
  return initialCalculatorState();
}

// Chains a new operator: resolves any pending op immediately (so `4 + 3 ×`
// shows the running "4 + 3" before the next operand) and remembers the
// current value as the left-hand side for the next operation.
export function chooseOperator(state, nextOperator) {
  if (state.display === 'Error') return state;
  const current = Number(state.display);

  if (state.operator && !state.overwrite) {
    const result = applyOperator(state.previousValue, current, state.operator);
    const formatted = formatResult(result);
    if (formatted === null) {
      return { ...initialCalculatorState(), display: 'Error' };
    }
    return {
      display: formatted,
      previousValue: Number(formatted),
      operator: nextOperator,
      overwrite: true,
      expression: `${formatted} ${nextOperator}`,
    };
  }

  return {
    ...state,
    previousValue: current,
    operator: nextOperator,
    overwrite: true,
    expression: `${state.display} ${nextOperator}`,
  };
}

// Returns { state, historyEntry } — historyEntry is null when there was
// nothing pending to resolve (e.g. pressing "=" with no operator chosen).
export function calculateResult(state) {
  if (state.operator === null || state.previousValue === null) {
    return { state, historyEntry: null };
  }
  const current = Number(state.display);
  const result = applyOperator(state.previousValue, current, state.operator);
  const formatted = formatResult(result);

  if (formatted === null) {
    return { state: { ...initialCalculatorState(), display: 'Error' }, historyEntry: null };
  }

  const expressionText = `${state.previousValue} ${state.operator} ${current}`;
  return {
    state: {
      display: formatted,
      previousValue: null,
      operator: null,
      overwrite: true,
      expression: '',
    },
    historyEntry: { expression: expressionText, result: formatted },
  };
}
