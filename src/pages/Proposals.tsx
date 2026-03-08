import { Search, MoreHorizontal, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  'Pending UW': 'status-pending',
  'UW Approved': 'bg-info/15 text-info border border-info/20',
  'Credit Approved': 'bg-primary/15 text-primary border border-primary/20',
  'Policy Issued': 'status-active',
};

const Proposals = () => {
  const [search, setSearch] = useState('');
  const { proposals, setProposals, policies, setPolicies, quotations } = useData();
  const { toast } = useToast();

  const handleUWApprove = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, uwDecision: 'Approved', status: 'UW Approved' as const } : p));
    toast({ title: 'UW Approved' });
  };

  const handleCreditApprove = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'Credit Approved' as const } : p));
    toast({ title: 'Credit Approved' });
  };

  const handleConvertToPolicy = (id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;
    const quot = quotations.find(q => q.quotRef === proposal.quotRef);
    const policyNo = `PL-2026-${String(policies.length + 1).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10);

    setPolicies(prev => [...prev, {
      id: String(policies.length + 1), policyNo, proposalNo: proposal.proposalNo,
      clientName: proposal.clientName, productName: quot?.productName || 'N/A',
      sumAssured: quot?.sumAssured || 0, totalPremium: quot?.totalPremium || 0,
      commencementDate: today, expiryDate: expiry.toISOString().split('T')[0], status: 'Active' as const,
    }]);
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'Policy Issued' as const } : p));
    toast({ title: 'Policy issued', description: `${proposal.proposalNo} → ${policyNo}` });
  };

  const filtered = proposals.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNo.toLowerCase().includes(search.toLowerCase())
  );

  const getActions = (p: typeof proposals[0]) => {
    if (p.status === 'Pending UW') return [
      { label: 'UW Approve', icon: CheckCircle, action: () => handleUWApprove(p.id) },
    ];
    if (p.status === 'UW Approved') return [
      { label: 'Credit Approve', icon: CheckCircle, action: () => handleCreditApprove(p.id) },
    ];
    if (p.status === 'Credit Approved') return [
      { label: 'Issue Policy', icon: ArrowRight, action: () => handleConvertToPolicy(p.id) },
    ];
    return [];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">Underwriting approval, credit workflow & policy issuance</p>
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
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const actions = getActions(p);
                return (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{p.proposalNo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.quotRef}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.uwDecision}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      {actions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map(a => (
                              <DropdownMenuItem key={a.label} onClick={a.action} className="gap-2">
                                <a.icon className="w-4 h-4" /> {a.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Proposals;
