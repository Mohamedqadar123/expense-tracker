function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(fields) {
  return fields.map(escapeCsvField).join(',');
}

export function buildReportCsv(report, { start, end }) {
  const lines = [];

  lines.push(csvRow(['Financial Report', start, 'to', end]));
  lines.push('');

  lines.push('Summary');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total Balance', report.summary.totalBalance.toFixed(2)]));
  lines.push(csvRow(['Total Income', report.summary.income.toFixed(2)]));
  lines.push(csvRow(['Total Expenses', report.summary.expenses.toFixed(2)]));
  lines.push(csvRow(['Net Savings', report.summary.savings.toFixed(2)]));
  lines.push(csvRow(['Savings Rate', report.summary.savingsRate === null ? 'N/A' : `${report.summary.savingsRate.toFixed(1)}%`]));
  lines.push('');

  lines.push('Expense by Category');
  lines.push(csvRow(['Category', 'Amount']));
  for (const row of report.expenseByCategory) {
    lines.push(csvRow([row.category, row.amount.toFixed(2)]));
  }
  lines.push('');

  lines.push('Income by Category');
  lines.push(csvRow(['Category', 'Amount']));
  for (const row of report.incomeByCategory) {
    lines.push(csvRow([row.category, row.amount.toFixed(2)]));
  }
  lines.push('');

  lines.push('Daily Cash Flow');
  lines.push(csvRow(['Date', 'Income', 'Expenses', 'Net']));
  for (const row of report.dailyCashFlow) {
    lines.push(csvRow([row.date, row.income.toFixed(2), row.expenses.toFixed(2), row.net.toFixed(2)]));
  }
  lines.push('');

  lines.push('Monthly Cash Flow (Last 6 Months)');
  lines.push(csvRow(['Month', 'Income', 'Expenses', 'Net']));
  for (const row of report.monthlyCashFlow) {
    lines.push(csvRow([row.month, row.income.toFixed(2), row.expenses.toFixed(2), row.net.toFixed(2)]));
  }
  lines.push('');

  lines.push('Budget Performance');
  lines.push(csvRow(['Name', 'Category', 'Period', 'Amount', 'Spent', 'Remaining', 'Percent Used', 'Status']));
  for (const b of report.budgetProgress) {
    lines.push(csvRow([
      b.name, b.category, b.period, b.amount.toFixed(2), b.spent.toFixed(2),
      b.remaining.toFixed(2), `${b.percentUsed.toFixed(0)}%`, b.status,
    ]));
  }
  lines.push('');

  lines.push('Transactions');
  lines.push(csvRow(['Date', 'Description', 'Category', 'Type', 'Amount']));
  for (const t of report.transactions) {
    lines.push(csvRow([t.date.slice(0, 10), t.description, t.category, t.type, t.amount.toFixed(2)]));
  }

  return lines.join('\n');
}

export function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadReportCsv(report, { start, end }) {
  const csv = buildReportCsv(report, { start, end });
  downloadBlob(csv, `financial-report_${start}_to_${end}.csv`, 'text/csv;charset=utf-8;');
}
