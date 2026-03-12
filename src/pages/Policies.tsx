import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  Active: 'status-active',
  Void: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Policies = () => {
  const [search, setSearch] = useState('');
  const { policies, setPolicies, proposals, setProposals, quotations } = useData();
  const { toast } = useToast();

  // Credit Approved proposals not yet issued
  const creditApproved = proposals.filter(p => p.status === 'Credit Approved');

  const handleIssuePolicy = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;
    const quot = quotations.find(q => q.quotRef === proposal.quotRef);
    const policyNo = `PL-2026-${String(policies.length + 1).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10);
    setPolicies(prev => [...prev, {
      id: String(policies.length + 1), policyNo, proposalNo: proposal.proposalNo,
      clientName: proposal.clientName, policyHolder: proposal.clientName,
      productName: quot?.productName || 'N/A',
      sumAssured: quot?.sumAssured || 0, totalPremium: quot?.totalPremium || 0,
      premiumFrequency: proposal.premiumFrequency,
      commencementDate: today, expiryDate: expiry.toISOString().split('T')[0], status: 'Active' as const,
    }]);
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'Policy Issued' as const } : p));
    toast({ title: 'Policy issued', description: `${proposal.proposalNo} → ${policyNo}` });
  };

  const filtered = policies.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.policyNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Policies</h1>
        <p className="text-sm text-muted-foreground mt-1">Active policies and policy issuance</p>
      </div>

      {/* Pending Policy Issuance */}
      {creditApproved.length > 0 && (
        <div className="glass-card">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Pending Policy Issuance ({creditApproved.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Proposal No</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Quotation</th>
                  <th className="text-right px-4 py-3">Premium</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {creditApproved.map(p => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{p.proposalNo}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.quotRef}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">OMR {p.totalPremiumDue.toFixed(3)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleIssuePolicy(p.id)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> Issue Policy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy Register */}
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
                <th className="text-left px-4 py-3">Policy Holder</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-right px-4 py-3">Sum Assured</th>
                <th className="text-right px-4 py-3">Premium</th>
                <th className="text-left px-4 py-3">Frequency</th>
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
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-medium">{p.premiumFrequency}</span></td>
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
