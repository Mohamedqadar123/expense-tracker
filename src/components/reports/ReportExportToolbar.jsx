import { useTranslation } from 'react-i18next'
import { downloadReportCsv } from '../../utils/exportReport'
import { downloadReportExcel } from '../../utils/exportReportExcel'

function ReportExportToolbar({ report, start, end, disabled }) {
  const { t } = useTranslation();

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
      <button type="button" onClick={handleCsv} disabled={disabled}>{t('reports.exportCsv')}</button>
      <button type="button" onClick={handleExcel} disabled={disabled}>{t('reports.exportExcel')}</button>
      <button type="button" onClick={handlePrint} disabled={disabled}>{t('reports.printExport')}</button>
    </div>
  );
}

export default ReportExportToolbar
