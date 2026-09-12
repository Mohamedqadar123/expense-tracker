import { downloadReportCsv } from '../../utils/exportReport'
import { downloadReportExcel } from '../../utils/exportReportExcel'

function ReportExportToolbar({ report, start, end, disabled }) {
  const handleCsv = () => {
    if (!report) return;
    downloadReportCsv(report, { start, end });
  };

  const handleExcel = () => {
    if (!report) return;
    downloadReportExcel(report, { start, end });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-export-toolbar no-print">
      <button type="button" onClick={handleCsv} disabled={disabled}>Export CSV</button>
      <button type="button" onClick={handleExcel} disabled={disabled}>Export Excel</button>
      <button type="button" onClick={handlePrint} disabled={disabled}>Print / Export PDF</button>
    </div>
  );
}

export default ReportExportToolbar
