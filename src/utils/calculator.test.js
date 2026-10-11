import { describe, it, expect } from 'vitest';
import {
  initialCalculatorState,
  inputDigit,
  inputDecimal,
  toggleSign,
  inputPercent,
  backspace,
  chooseOperator,
  calculateResult,
  formatResult,
} from './calculator';

function type(state, chars) {
  return [...chars].reduce((s, ch) => inputDigit(s, ch), state);
}

describe('calculator engine', () => {
  it('builds up a multi-digit number from individual digit presses', () => {
    const state = type(initialCalculatorState(), '123');
    expect(state.display).toBe('123');
  });

  it('performs basic addition end-to-end', () => {
    let state = type(initialCalculatorState(), '12');
    state = chooseOperator(state, '+');
    state = type(state, '30');
    const { state: final, historyEntry } = calculateResult(state);
    expect(final.display).toBe('42');
    expect(historyEntry).toEqual({ expression: '12 + 30', result: '42' });
  });

  it('respects operator precedence left-to-right like a basic calculator (chained, not algebraic)', () => {
    // 4 + 3 × 2 -> chosen operators resolve immediately in sequence: (4+3)=7, then 7×2=14
    let state = type(initialCalculatorState(), '4');
    state = chooseOperator(state, '+');
    state = type(state, '3');
    state = chooseOperator(state, '×');
    state = type(state, '2');
    const { state: final } = calculateResult(state);
    expect(final.display).toBe('14');
  });

  it('swaps the pending operator when pressed twice without an operand in between', () => {
    let state = type(initialCalculatorState(), '5');
    state = chooseOperator(state, '+');
    state = chooseOperator(state, '×');
    state = type(state, '3');
    const { state: final } = calculateResult(state);
    expect(final.display).toBe('15');
  });

  it('produces Error on divide by zero instead of NaN/Infinity', () => {
    let state = type(initialCalculatorState(), '8');
    state = chooseOperator(state, '÷');
    state = type(state, '0');
    const { state: final, historyEntry } = calculateResult(state);
    expect(final.display).toBe('Error');
    expect(historyEntry).toBeNull();
  });

  it('recovers cleanly from an Error state on the next digit press', () => {
    let state = { ...initialCalculatorState(), display: 'Error' };
    state = inputDigit(state, '7');
    expect(state.display).toBe('7');
  });

  it('avoids floating-point tails like 0.1 + 0.2 = 0.30000000000000004', () => {
    let state = type(initialCalculatorState(), '0');
    state = inputDecimal(state);
    state = inputDigit(state, '1');
    state = chooseOperator(state, '+');
    state = type(state, '0');
    state = inputDecimal(state);
    state = inputDigit(state, '2');
    const { state: final } = calculateResult(state);
    expect(final.display).toBe('0.3');
  });

  it('toggles the sign of the current entry', () => {
    let state = type(initialCalculatorState(), '9');
    state = toggleSign(state);
    expect(state.display).toBe('-9');
    state = toggleSign(state);
    expect(state.display).toBe('9');
  });

  it('does not toggle the sign of zero', () => {
    const state = toggleSign(initialCalculatorState());
    expect(state.display).toBe('0');
  });

  it('converts the current entry to a percentage', () => {
    let state = type(initialCalculatorState(), '50');
    state = inputPercent(state);
    expect(state.display).toBe('0.5');
  });

  it('backspaces one character at a time and bottoms out at "0"', () => {
    let state = type(initialCalculatorState(), '12');
    state = backspace(state);
    expect(state.display).toBe('1');
    state = backspace(state);
    expect(state.display).toBe('0');
  });

  it('ignores "=" when nothing is pending', () => {
    const state = type(initialCalculatorState(), '42');
    const { state: final, historyEntry } = calculateResult(state);
    expect(final.display).toBe('42');
    expect(historyEntry).toBeNull();
  });

  it('formatResult returns null for non-finite values', () => {
    expect(formatResult(Infinity)).toBeNull();
    expect(formatResult(NaN)).toBeNull();
  });
});
