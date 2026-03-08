import { useState } from 'react';
import { mockReinsurance, ReinsuranceCession } from '@/lib/mockData';
import { Building2, Search, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  Active: 'status-active',
  Settled: 'status-pending',
  Void: 'status-draft',
};

const Reinsurance = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<ReinsuranceCession[]>(mockReinsurance);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const filtered = data.filter(r =>
    r.cessionRef.toLowerCase().includes(search.toLowerCase()) ||
    r.reinsurer.toLowerCase().includes(search.toLowerCase()) ||
    r.policyNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newItem: ReinsuranceCession = {
      id: String(data.length + 1),
      cessionRef: `RI-2026-${String(data.length + 1).padStart(4, '0')}`,
      policyNo: fd.get('policyNo') as string,
      reinsurer: fd.get('reinsurer') as string,
      treatyName: fd.get('treatyName') as string,
      cededPremium: Number(fd.get('cededPremium')),
      cededSA: Number(fd.get('cededSA')),
      retentionPct: Number(fd.get('retentionPct')),
      cessionPct: 100 - Number(fd.get('retentionPct')),
      status: 'Active',
      effectiveDate: new Date().toISOString().split('T')[0],
    };
    setData([...data, newItem]);
    setOpen(false);
    toast({ title: 'Cession created', description: `${newItem.cessionRef} added successfully` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reinsurance</h1>
          <p className="text-sm text-muted-foreground mt-1">RI register and cession distribution</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Cession
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Reinsurance Cession</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'policyNo', label: 'Policy No', placeholder: 'PL-2026-0001' },
                { name: 'reinsurer', label: 'Reinsurer', placeholder: 'Swiss Re' },
                { name: 'treatyName', label: 'Treaty Name', placeholder: 'Surplus Treaty 2026' },
                { name: 'cededPremium', label: 'Ceded Premium (OMR)', placeholder: '0.000', type: 'number' },
                { name: 'cededSA', label: 'Ceded Sum Assured (OMR)', placeholder: '0', type: 'number' },
                { name: 'retentionPct', label: 'Retention %', placeholder: '50', type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required step={f.type === 'number' ? '0.001' : undefined}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Create Cession</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Cessions</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {data.reduce((s, r) => s + r.cededPremium, 0).toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">Total Ceded Premium</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {data.reduce((s, r) => s + r.cededSA, 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Ceded SA</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search cessions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Cession Ref</th>
                <th className="text-left px-4 py-3">Policy</th>
                <th className="text-left px-4 py-3">Reinsurer</th>
                <th className="text-left px-4 py-3">Treaty</th>
                <th className="text-right px-4 py-3">Ceded Premium</th>
                <th className="text-right px-4 py-3">Ceded SA</th>
                <th className="text-right px-4 py-3">Retention %</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{r.cessionRef}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.policyNo}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{r.reinsurer}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.treatyName}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {r.cededPremium.toFixed(3)}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">OMR {r.cededSA.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{r.retentionPct}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.effectiveDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reinsurance;
