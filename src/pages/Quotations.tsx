import { useState } from 'react';
import { mockQuotations } from '@/lib/mockData';
import { Plus, Search, FileText } from 'lucide-react';

const statusStyles: Record<string, string> = {
  Draft: 'status-draft',
  Converted: 'status-active',
};

const Quotations = () => {
  const [search, setSearch] = useState('');
  const filtered = mockQuotations.filter(q =>
    q.clientName.toLowerCase().includes(search.toLowerCase()) ||
    q.quotRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage premium quotations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Ref</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-right px-4 py-3">Sum Assured</th>
                <th className="text-right px-4 py-3">Premium</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{q.quotRef}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{q.clientName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{q.productName}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {q.sumAssured.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {q.totalPremium.toFixed(3)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[q.status]}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{q.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quotations;
