import { Receipt } from 'lucide-react';

const VATReports = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">VAT Reports</h1>
      <p className="text-sm text-muted-foreground mt-1">Premium VAT, commission VAT, and combined return</p>
    </div>
    <div className="glass-card p-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Box 1 — Output VAT (Premiums)', value: 'OMR 6.619' },
          { label: 'Box 2 — Output VAT (Commission)', value: 'OMR 0.000' },
          { label: 'Box 3 — Input VAT', value: 'OMR 0.000' },
          { label: 'Box 4 — Net Payable', value: 'OMR 6.619' },
        ].map(box => (
          <div key={box.label} className="stat-card">
            <p className="text-xs text-muted-foreground">{box.label}</p>
            <p className="text-lg font-display font-bold text-foreground mt-2">{box.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default VATReports;
