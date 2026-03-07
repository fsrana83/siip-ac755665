import { mockProposals } from '@/lib/mockData';
import { Search } from 'lucide-react';
import { useState } from 'react';

const statusStyles: Record<string, string> = {
  'Pending UW': 'status-pending',
  'UW Approved': 'bg-info/15 text-info border border-info/20',
  'Credit Approved': 'bg-primary/15 text-primary border border-primary/20',
  'Policy Issued': 'status-active',
};

const Proposals = () => {
  const [search, setSearch] = useState('');
  const filtered = mockProposals.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">Underwriting approval and credit workflow</p>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Proposal No</th>
                <th className="text-left px-4 py-3">Quotation</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">UW Decision</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{p.proposalNo}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.quotRef}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.uwDecision}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Proposals;
