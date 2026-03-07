import { FileBarChart } from 'lucide-react';

const Reports = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
      <p className="text-sm text-muted-foreground mt-1">Report hub and CSV exports</p>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        'Quotation Register', 'Proposal Register', 'Policy Register',
        'Claims Register', 'Commission Report', 'RI Cession Report',
        'Premium Collection', 'Agent Performance', 'Product Summary',
      ].map(report => (
        <div key={report} className="stat-card cursor-pointer hover:glow-border">
          <FileBarChart className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">{report}</p>
          <p className="text-xs text-muted-foreground mt-1">Download CSV</p>
        </div>
      ))}
    </div>
  </div>
);

export default Reports;
