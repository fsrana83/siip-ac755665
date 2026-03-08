import { useState } from 'react';
import { Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const statusStyles: Record<string, string> = {
  Active: 'status-active',
  Void: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Policies = () => {
  const [search, setSearch] = useState('');
  const { policies } = useData();

  const filtered = policies.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.policyNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Policies</h1>
        <p className="text-sm text-muted-foreground mt-1">Active policies and policy register</p>
      </div>
      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search policies..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Policy No</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-right px-4 py-3">Sum Assured</th>
                <th className="text-right px-4 py-3">Premium</th>
                <th className="text-left px-4 py-3">Commencement</th>
                <th className="text-left px-4 py-3">Expiry</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{p.policyNo}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.productName}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {p.sumAssured.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {p.totalPremium.toFixed(3)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.commencementDate}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.expiryDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status] || 'status-active'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Policies;
