import { FileBarChart, FileSpreadsheet, FileDown, FileType } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, REPORT_KEYS } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { toast } = useToast();

  const handleExport = (key: string, format: 'csv' | 'excel' | 'pdf', label: string) => {
    try {
      if (format === 'csv') exportCSV(key as any);
      else if (format === 'excel') exportExcel(key as any);
      else exportPDF(key as any);
      toast({ title: `${label} exported`, description: `Downloaded as ${format.toUpperCase()}` });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Something went wrong', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Report hub — export as CSV, Excel, or PDF</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_KEYS.map(report => (
          <div key={report.key} className="stat-card">
            <FileBarChart className="w-5 h-5 text-primary mb-3" />
            <p className="text-sm font-medium text-foreground mb-3">{report.label}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.key, 'csv', report.label)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <FileDown className="w-3 h-3" /> CSV
              </button>
              <button
                onClick={() => handleExport(report.key, 'excel', report.label)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </button>
              <button
                onClick={() => handleExport(report.key, 'pdf', report.label)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <FileType className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
