import { useState } from 'react';
import { mockClaims } from '@/lib/mockData';
import { Claim, Policy } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

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
  const [selectedPolicyNo, setSelectedPolicyNo] = useState('');
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const { toast } = useToast();
  const { policies } = useData();

  const selectedPolicy = policies.find(p => p.policyNo === selectedPolicyNo);

  const filtered = data.filter(c =>
    c.claimRef.toLowerCase().includes(search.toLowerCase()) ||
    c.claimant.toLowerCase().includes(search.toLowerCase()) ||
    c.policyNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    const fd = new FormData(e.currentTarget);
    const newClaim: Claim = {
      id: String(data.length + 1),
      claimRef: `CL-2026-${String(data.length + 1).padStart(4, '0')}`,
      policyNo: selectedPolicy.policyNo,
      claimant: selectedPolicy.policyHolder,
      claimType: fd.get('claimType') as string,
      amountClaimed: Number(fd.get('amountClaimed')),
      status: 'Registered',
      claimDate: new Date().toISOString().split('T')[0],
    };
    setData([...data, newClaim]);
    setOpen(false);
    setSelectedPolicyNo('');
    toast({ title: 'Claim registered', description: `${newClaim.claimRef} for ${newClaim.claimant}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">Claims register and settlement tracking</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedPolicyNo(''); }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Claim
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Claim</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {/* Policy Selection */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Policy No</label>
                <select
                  value={selectedPolicyNo}
                  onChange={(e) => setSelectedPolicyNo(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a policy...</option>
                  {policies.filter(p => p.status === 'Active').map(p => (
                    <option key={p.id} value={p.policyNo}>{p.policyNo} — {p.clientName}</option>
                  ))}
                </select>
              </div>

              {/* Auto-filled details */}
              {selectedPolicy && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Policy Holder</span>
                    <p className="text-sm font-medium text-foreground">{selectedPolicy.policyHolder}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Product</span>
                    <p className="text-sm font-medium text-foreground">{selectedPolicy.productName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sum Assured</span>
                    <p className="text-sm font-medium text-foreground">OMR {selectedPolicy.sumAssured.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Premium</span>
                    <p className="text-sm font-medium text-foreground">OMR {selectedPolicy.totalPremium.toFixed(3)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Claim Type</label>
                <input name="claimType" type="text" placeholder="Death / PTD / Maturity" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Amount Claimed (OMR)</label>
                <input name="amountClaimed" type="number" placeholder="100000" required step="0.001"
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <button type="submit" disabled={!selectedPolicy}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                Register Claim
              </button>
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
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        const pol = policies.find(p => p.policyNo === c.policyNo);
                        if (pol) setViewPolicy(pol);
                        else toast({ title: 'Policy not found', description: c.policyNo, variant: 'destructive' });
                      }}
                      className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                    >
                      {c.policyNo}
                    </button>
                  </td>
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

      {/* Policy Details Dialog */}
      <Dialog open={!!viewPolicy} onOpenChange={(v) => { if (!v) setViewPolicy(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Policy Details — {viewPolicy?.policyNo}</DialogTitle>
          </DialogHeader>
          {viewPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Policy No</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.policyNo}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Proposal No</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.proposalNo}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Client Name</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.clientName}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Policy Holder</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.policyHolder}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Product</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.productName}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sum Assured</span>
                  <p className="text-sm font-medium text-foreground">OMR {viewPolicy.sumAssured.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Premium</span>
                  <p className="text-sm font-medium text-foreground">OMR {viewPolicy.totalPremium.toFixed(3)}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Premium Frequency</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.premiumFrequency}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
                  <p className="text-sm font-medium text-foreground">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${viewPolicy.status === 'Active' ? 'bg-success/15 text-success border border-success/20' : 'bg-destructive/15 text-destructive border border-destructive/20'}`}>
                      {viewPolicy.status}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Commencement Date</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.commencementDate}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Expiry Date</span>
                  <p className="text-sm font-medium text-foreground">{viewPolicy.expiryDate}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Claims;
