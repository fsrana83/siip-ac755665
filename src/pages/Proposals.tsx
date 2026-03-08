import { Search, MoreHorizontal, ArrowRight, CheckCircle, ClipboardCheck, FileText, Receipt, Plus, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Proposal, UWReview, ReceiptEntry, CreditEntry } from '@/lib/types';

const DEFAULT_UW_REVIEW: UWReview = {
  clientVerified: false,
  quotationReviewed: false,
  documentsChecked: false,
  medicalReviewed: false,
  uwRemarks: '',
  riskRating: '',
};

const statusStyles: Record<string, string> = {
  'Pending UW': 'status-pending',
  'UW Approved': 'bg-info/15 text-info border border-info/20',
  'Credit Approved': 'bg-primary/15 text-primary border border-primary/20',
  'Policy Issued': 'status-active',
};

const Proposals = () => {
  const [search, setSearch] = useState('');
  const { proposals, setProposals, policies, setPolicies, quotations, clients } = useData();
  const { toast } = useToast();

  // UW Review dialog
  const [uwDialogOpen, setUwDialogOpen] = useState(false);
  const [uwProposal, setUwProposal] = useState<Proposal | null>(null);
  const [uwReview, setUwReview] = useState<UWReview>(DEFAULT_UW_REVIEW);

  // Credit/Receipt dialog
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditProposal, setCreditProposal] = useState<Proposal | null>(null);

  // New receipt form
  const [newReceipt, setNewReceipt] = useState<Omit<ReceiptEntry, 'id'>>({ receiptNo: '', receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
  // New credit form
  const [newCredit, setNewCredit] = useState<Omit<CreditEntry, 'id'>>({ creditAmount: 0, creditDays: 30, dueDate: '', remarks: '', status: 'Pending' });
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);

  const openUWReview = (p: Proposal) => {
    setUwProposal(p);
    setUwReview(p.uwReview || { ...DEFAULT_UW_REVIEW });
    setUwDialogOpen(true);
  };

  const openCreditReview = (p: Proposal) => {
    setCreditProposal(p);
    setShowAddReceipt(false);
    setShowAddCredit(false);
    setNewReceipt({ receiptNo: '', receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
    setNewCredit({ creditAmount: 0, creditDays: 30, dueDate: '', remarks: '', status: 'Pending' });
    setCreditDialogOpen(true);
  };

  const clientKycApproved = (() => {
    if (!uwProposal) return false;
    const client = getClientDetails(uwProposal.clientName);
    return client?.kycStatus === 'Approved';
  })();

  const canApproveUW = uwReview.clientVerified && uwReview.quotationReviewed && uwReview.documentsChecked && uwReview.medicalReviewed && uwReview.riskRating !== '' && uwReview.riskRating !== 'Declined' && clientKycApproved;

  const handleUWApprove = () => {
    if (!uwProposal) return;
    setProposals(prev => prev.map(p => p.id === uwProposal.id ? {
      ...p, uwDecision: `Approved (${uwReview.riskRating})`, status: 'UW Approved' as const, uwReview: { ...uwReview },
    } : p));
    setUwDialogOpen(false);
    toast({ title: 'UW Approved', description: `${uwProposal.proposalNo} — Risk: ${uwReview.riskRating}` });
  };

  const handleUWDecline = () => {
    if (!uwProposal) return;
    setProposals(prev => prev.map(p => p.id === uwProposal.id ? {
      ...p, uwDecision: 'Declined', uwReview: { ...uwReview, riskRating: 'Declined' },
    } : p));
    setUwDialogOpen(false);
    toast({ title: 'UW Declined', description: uwProposal.proposalNo, variant: 'destructive' });
  };

  // Credit helpers
  const getProposalTotals = (p: Proposal) => {
    const totalReceipts = p.receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalCredits = p.credits.reduce((sum, c) => sum + c.creditAmount, 0);
    const balance = p.totalPremiumDue - totalReceipts - totalCredits;
    return { totalReceipts, totalCredits, balance };
  };

  const handleAddReceipt = () => {
    if (!creditProposal || !newReceipt.receiptNo || newReceipt.amount <= 0) return;
    const entry: ReceiptEntry = { ...newReceipt, id: `R${Date.now()}` };
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? {
      ...p, receipts: [...p.receipts, entry],
    } : p));
    setCreditProposal(prev => prev ? { ...prev, receipts: [...prev.receipts, entry] } : prev);
    setNewReceipt({ receiptNo: '', receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
    setShowAddReceipt(false);
    toast({ title: 'Receipt added', description: `${entry.receiptNo} — OMR ${entry.amount.toFixed(3)}` });
  };

  const handleAddCredit = () => {
    if (!creditProposal || newCredit.creditAmount <= 0 || !newCredit.dueDate) return;
    const entry: CreditEntry = { ...newCredit, id: `CR${Date.now()}` };
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? {
      ...p, credits: [...p.credits, entry],
    } : p));
    setCreditProposal(prev => prev ? { ...prev, credits: [...prev.credits, entry] } : prev);
    setNewCredit({ creditAmount: 0, creditDays: 30, dueDate: '', remarks: '', status: 'Pending' });
    setShowAddCredit(false);
    toast({ title: 'Credit entry added', description: `OMR ${entry.creditAmount.toFixed(3)} — Due: ${entry.dueDate}` });
  };

  const handleCreditApprove = () => {
    if (!creditProposal) return;
    const { balance } = getProposalTotals(creditProposal);
    if (balance > 0.001) {
      toast({ title: 'Cannot approve', description: `Outstanding balance: OMR ${balance.toFixed(3)}`, variant: 'destructive' });
      return;
    }
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? { ...p, status: 'Credit Approved' as const } : p));
    setCreditDialogOpen(false);
    toast({ title: 'Credit Approved', description: creditProposal.proposalNo });
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

  const getActions = (p: Proposal) => {
    if (p.status === 'Pending UW') return [
      { label: 'UW Review & Approve', icon: ClipboardCheck, action: () => openUWReview(p) },
    ];
    if (p.status === 'UW Approved') return [
      { label: 'Receipts / Credit', icon: Receipt, action: () => openCreditReview(p) },
    ];
    if (p.status === 'Credit Approved') return [
      { label: 'Issue Policy', icon: ArrowRight, action: () => handleConvertToPolicy(p.id) },
    ];
    return [];
  };

  const getQuotDetails = (quotRef: string) => quotations.find(q => q.quotRef === quotRef);
  const getClientDetails = (name: string) => clients.find(c => c.fullName === name);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">UW review → Medical approval → Receipts/Credit → Policy issuance</p>
      </div>

      {/* Proposal Table */}
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

      {/* UW Review Dialog */}
      <Dialog open={uwDialogOpen} onOpenChange={setUwDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" /> UW Review — {uwProposal?.proposalNo}
            </DialogTitle>
          </DialogHeader>
          {uwProposal && (
            <div className="space-y-6">
              {/* Client & Quotation Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 p-4 bg-muted/30 border border-border rounded-lg">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Details</h4>
                  {(() => {
                    const client = getClientDetails(uwProposal.clientName);
                    return client ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{client.fullName}</span></p>
                        <p><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{client.dob}</span></p>
                        <p><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{client.gender}</span></p>
                        <p><span className="text-muted-foreground">ID:</span> <span className="text-foreground">{client.idType} — {client.idNumber}</span></p>
                        <p><span className="text-muted-foreground">KYC:</span> <span className={`font-medium ${client.kycStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>{client.kycStatus}</span></p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{uwProposal.clientName}</p>;
                  })()}
                </div>
                <div className="space-y-2 p-4 bg-muted/30 border border-border rounded-lg">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quotation Summary</h4>
                  {(() => {
                    const quot = getQuotDetails(uwProposal.quotRef);
                    return quot ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Ref:</span> <span className="text-foreground font-medium">{quot.quotRef}</span></p>
                        <p><span className="text-muted-foreground">Product:</span> <span className="text-foreground">{quot.productName}</span></p>
                        <p><span className="text-muted-foreground">Sum Assured:</span> <span className="text-foreground">OMR {quot.sumAssured.toLocaleString()}</span></p>
                        <p><span className="text-muted-foreground">Annual Premium:</span> <span className="text-foreground font-medium">OMR {quot.totalPremium.toFixed(3)}</span></p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{uwProposal.quotRef}</p>;
                  })()}
                </div>
              </div>

              {/* Medical Questionnaire (read-only, submitted at conversion) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Medical Questionnaire (Submitted)
                </h4>
                {uwProposal.medicalQuestions.length > 0 ? (
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {uwProposal.medicalQuestions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-3 p-3">
                        <span className="text-xs text-muted-foreground font-medium mt-0.5">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{q.question}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              q.answer === 'Yes' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
                            }`}>{q.answer}</span>
                            {q.remarks && <span className="text-xs text-muted-foreground italic">{q.remarks}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">No medical questionnaire data available.</p>
                )}
              </div>

              {/* UW Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">UW Verification Checklist</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'clientVerified', label: 'Client Identity & KYC Verified' },
                    { key: 'quotationReviewed', label: 'Quotation & Premium Reviewed' },
                    { key: 'documentsChecked', label: 'Supporting Documents Checked' },
                    { key: 'medicalReviewed', label: 'Medical Questionnaire Reviewed' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                      <Switch
                        checked={(uwReview as any)[item.key]}
                        onCheckedChange={(val) => setUwReview(prev => ({ ...prev, [item.key]: val }))}
                      />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Rating & Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Risk Rating</label>
                  <select
                    value={uwReview.riskRating}
                    onChange={e => setUwReview(prev => ({ ...prev, riskRating: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">— Select —</option>
                    <option value="Standard">Standard</option>
                    <option value="Substandard">Substandard (with loading)</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">UW Remarks</label>
                  <textarea
                    value={uwReview.uwRemarks}
                    onChange={e => setUwReview(prev => ({ ...prev, uwRemarks: e.target.value }))}
                    placeholder="Additional underwriting notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className={`w-3.5 h-3.5 ${canApproveUW ? 'text-emerald-500' : ''}`} />
                <span>Checklist: {[uwReview.clientVerified, uwReview.quotationReviewed, uwReview.documentsChecked, uwReview.medicalReviewed].filter(Boolean).length}/4</span>
                <span className="text-border">|</span>
                <span>Risk: {uwReview.riskRating || 'Not set'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleUWApprove} disabled={!canApproveUW}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Approve & Pass to Accounts
                </button>
                <button onClick={handleUWDecline}
                  className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm hover:bg-destructive/90 transition-all">
                  Decline
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit / Receipt Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Receipts & Credit — {creditProposal?.proposalNo}
            </DialogTitle>
          </DialogHeader>
          {creditProposal && (() => {
            const { totalReceipts, totalCredits, balance } = getProposalTotals(creditProposal);
            return (
              <div className="space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Premium Due', value: creditProposal.totalPremiumDue, color: 'text-foreground' },
                    { label: 'Receipts', value: totalReceipts, color: 'text-emerald-600' },
                    { label: 'Credit', value: totalCredits, color: 'text-amber-600' },
                    { label: 'Balance', value: balance, color: balance <= 0.001 ? 'text-emerald-600' : 'text-destructive' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-muted/30 border border-border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-bold ${item.color}`}>OMR {item.value.toFixed(3)}</p>
                    </div>
                  ))}
                </div>

                {/* Existing Receipts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Receipts ({creditProposal.receipts.length})
                    </h4>
                    <button onClick={() => { setShowAddReceipt(true); setShowAddCredit(false); }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus className="w-3 h-3" /> Add Receipt
                    </button>
                  </div>
                  {creditProposal.receipts.length > 0 && (
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {creditProposal.receipts.map(r => (
                        <div key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
                          <div>
                            <span className="font-medium text-foreground">{r.receiptNo}</span>
                            <span className="text-muted-foreground ml-2">{r.receiptDate} • {r.paymentMode}</span>
                          </div>
                          <span className="font-semibold text-emerald-600">OMR {r.amount.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Receipt Form */}
                  {showAddReceipt && (
                    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                      <h5 className="text-xs font-semibold text-foreground uppercase">New Receipt</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Receipt No</label>
                          <input type="text" value={newReceipt.receiptNo}
                            onChange={e => setNewReceipt(prev => ({ ...prev, receiptNo: e.target.value }))}
                            placeholder="REC-2026-0001"
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Date</label>
                          <input type="date" value={newReceipt.receiptDate}
                            onChange={e => setNewReceipt(prev => ({ ...prev, receiptDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Payment Mode</label>
                          <select value={newReceipt.paymentMode}
                            onChange={e => setNewReceipt(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Online">Online</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Amount (OMR)</label>
                          <input type="number" value={newReceipt.amount} step={0.001}
                            onChange={e => setNewReceipt(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                          <input type="text" value={newReceipt.remarks} placeholder="Payment notes..."
                            onChange={e => setNewReceipt(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddReceipt} disabled={!newReceipt.receiptNo || newReceipt.amount <= 0}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          Add Receipt
                        </button>
                        <button onClick={() => setShowAddReceipt(false)} className="px-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Credits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Credit Entries ({creditProposal.credits.length})
                    </h4>
                    <button onClick={() => { setShowAddCredit(true); setShowAddReceipt(false); }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus className="w-3 h-3" /> Add Credit
                    </button>
                  </div>
                  {creditProposal.credits.length > 0 && (
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {creditProposal.credits.map(c => (
                        <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                          <div>
                            <span className="font-medium text-foreground">OMR {c.creditAmount.toFixed(3)}</span>
                            <span className="text-muted-foreground ml-2">{c.creditDays} days • Due: {c.dueDate}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            c.status === 'Settled' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                          }`}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Credit Form */}
                  {showAddCredit && (
                    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                      <h5 className="text-xs font-semibold text-foreground uppercase">New Credit Entry</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Credit Amount (OMR)</label>
                          <input type="number" value={newCredit.creditAmount} step={0.001}
                            onChange={e => {
                              const amt = Number(e.target.value);
                              const due = new Date();
                              due.setDate(due.getDate() + newCredit.creditDays);
                              setNewCredit(prev => ({ ...prev, creditAmount: amt }));
                            }}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Credit Days</label>
                          <input type="number" value={newCredit.creditDays} min={1} max={365}
                            onChange={e => {
                              const days = Number(e.target.value);
                              const due = new Date();
                              due.setDate(due.getDate() + days);
                              setNewCredit(prev => ({ ...prev, creditDays: days, dueDate: due.toISOString().split('T')[0] }));
                            }}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Due Date</label>
                          <input type="date" value={newCredit.dueDate}
                            onChange={e => setNewCredit(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                          <input type="text" value={newCredit.remarks} placeholder="Credit terms..."
                            onChange={e => setNewCredit(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddCredit} disabled={newCredit.creditAmount <= 0 || !newCredit.dueDate}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          Add Credit
                        </button>
                        <button onClick={() => setShowAddCredit(false)} className="px-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Approve button */}
                <button onClick={handleCreditApprove} disabled={balance > 0.001}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {balance <= 0.001 ? 'Approve Credit & Proceed to Policy Issuance' : `Outstanding Balance: OMR ${balance.toFixed(3)}`}
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposals;
