import { useState } from 'react';
import { mockClaims } from '@/lib/mockData';
import { Claim } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  'Registered': 'status-draft',
  'Under Assessment': 'status-pending',
  'Approved': 'bg-info/15 text-info border border-info/20',
  'Paid': 'status-active',
  'Rejected': 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Claims = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Claim[]>(mockClaims);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const filtered = data.filter(c =>
    c.claimRef.toLowerCase().includes(search.toLowerCase()) ||
    c.claimant.toLowerCase().includes(search.toLowerCase()) ||
    c.policyNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newClaim: Claim = {
      id: String(data.length + 1),
      claimRef: `CL-2026-${String(data.length + 1).padStart(4, '0')}`,
      policyNo: fd.get('policyNo') as string,
      claimant: fd.get('claimant') as string,
      claimType: fd.get('claimType') as string,
      amountClaimed: Number(fd.get('amountClaimed')),
      status: 'Registered',
      claimDate: new Date().toISOString().split('T')[0],
    };
    setData([...data, newClaim]);
    setOpen(false);
    toast({ title: 'Claim registered', description: `${newClaim.claimRef} for ${newClaim.claimant}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">Claims register and settlement tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Claim
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Claim</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'policyNo', label: 'Policy No', placeholder: 'PL-2026-0001' },
                { name: 'claimant', label: 'Claimant Name', placeholder: 'Ahmed Al Balushi' },
                { name: 'claimType', label: 'Claim Type', placeholder: 'Death / PTD / Maturity' },
                { name: 'amountClaimed', label: 'Amount Claimed (OMR)', placeholder: '100000', type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required step={f.type === 'number' ? '0.001' : undefined}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Register Claim</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
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
              {filtered.map(c => (
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
