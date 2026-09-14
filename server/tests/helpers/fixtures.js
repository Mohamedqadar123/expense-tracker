export function transactionPayload(overrides = {}) {
  return {
    description: 'Test transaction',
    amount: 100,
    type: 'expense',
    category: 'Food',
    account: 'Checking',
    ...overrides,
  };
}

export function budgetPayload(overrides = {}) {
  return {
    name: 'Test budget',
    category: 'Food',
    amount: 200,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    ...overrides,
  };
}

export function goalPayload(overrides = {}) {
  return {
    name: 'Test goal',
    targetAmount: 1000,
    savedAmount: 0,
    ...overrides,
  };
}

export function recurringPayload(overrides = {}) {
  return {
    description: 'Test recurring',
    amount: 50,
    type: 'expense',
    category: 'Utilities',
    frequency: 'monthly',
    startDate: '2024-01-01',
    ...overrides,
  };
}
