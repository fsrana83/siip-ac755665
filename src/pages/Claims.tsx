import { mockClaims } from '@/lib/mockData';

const statusStyles: Record<string, string> = {
  'Registered': 'status-draft',
  'Under Assessment': 'status-pending',
  'Approved': 'bg-info/15 text-info border border-info/20',
  'Paid': 'status-active',
  'Rejected': 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Claims = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Claims</h1>
        <p className="text-sm text-muted-foreground mt-1">Claims register and settlement tracking</p>
      </div>

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Claim Ref</th>
                <th className="text-left px-4 py-3">Policy</th>
                <th className="text-left px-4 py-3">Claimant</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount Claimed</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockClaims.map(c => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{c.claimRef}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.policyNo}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.claimant}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.claimType}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {c.amountClaimed.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.claimDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Claims;
