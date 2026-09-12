import * as XLSX from 'xlsx'

export function downloadReportExcel(report, { start, end }) {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: 'Total Balance', Value: report.summary.totalBalance },
    { Metric: 'Total Income', Value: report.summary.income },
    { Metric: 'Total Expenses', Value: report.summary.expenses },
    { Metric: 'Net Savings', Value: report.summary.savings },
    { Metric: 'Savings Rate', Value: report.summary.savingsRate === null ? 'N/A' : `${report.summary.savingsRate.toFixed(1)}%` },
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const expenseSheet = XLSX.utils.json_to_sheet(
    report.expenseByCategory.map(r => ({ Category: r.category, Amount: r.amount }))
  );
  XLSX.utils.book_append_sheet(wb, expenseSheet, 'Expense by Category');

  const incomeSheet = XLSX.utils.json_to_sheet(
    report.incomeByCategory.map(r => ({ Category: r.category, Amount: r.amount }))
  );
  XLSX.utils.book_append_sheet(wb, incomeSheet, 'Income by Category');

  const dailySheet = XLSX.utils.json_to_sheet(
    report.dailyCashFlow.map(r => ({ Date: r.date, Income: r.income, Expenses: r.expenses, Net: r.net }))
  );
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Cash Flow');

  const monthlySheet = XLSX.utils.json_to_sheet(
    report.monthlyCashFlow.map(r => ({ Month: r.month, Income: r.income, Expenses: r.expenses, Net: r.net }))
  );
  XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Cash Flow');

  const budgetSheet = XLSX.utils.json_to_sheet(
    report.budgetProgress.map(b => ({
      Name: b.name,
      Category: b.category,
      Period: b.period,
      Amount: b.amount,
      Spent: b.spent,
      Remaining: b.remaining,
      'Percent Used': `${b.percentUsed.toFixed(0)}%`,
      Status: b.status,
    }))
  );
  XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budget Performance');

  const transactionsSheet = XLSX.utils.json_to_sheet(
    report.transactions.map(t => ({
      Date: t.date.slice(0, 10),
      Description: t.description,
      Category: t.category,
      Type: t.type,
      Amount: t.amount,
    }))
  );
  XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Transactions');

  XLSX.writeFile(wb, `financial-report_${start}_to_${end}.xlsx`);
}
