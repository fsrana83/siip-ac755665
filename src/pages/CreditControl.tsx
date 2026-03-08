import { useState } from 'react';
import { Search, Receipt, CreditCard, Plus, FileDown, FileSpreadsheet, FileType, AlertTriangle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Proposal, ReceiptEntry, CreditEntry } from '@/lib/types';
import { exportCreditReport } from '@/lib/creditExportUtils';

const CreditControl = () => {
  const { proposals, setProposals } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  // Credit/Receipt dialog
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditProposal, setCreditProposal] = useState<Proposal | null>(null);
  const [newReceipt, setNewReceipt] = useState<Omit<ReceiptEntry, 'id' | 'receiptNo'>>({ receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
  const [newCredit, setNewCredit] = useState<Omit<CreditEntry, 'id'>>({ creditAmount: 0, creditDays: 30, dueDate: '', remarks: '', status: 'Pending' });

  // Auto-generate receipt number
  const allReceiptsCount = proposals.reduce((sum, p) => sum + p.receipts.length, 0);
  const nextReceiptNo = `REC-${new Date().getFullYear()}-${String(allReceiptsCount + 1).padStart(4, '0')}`;
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);

  const uwApprovedProposals = proposals.filter(p => p.status === 'UW Approved' || p.status === 'Credit Approved');

  const openCreditReview = (p: Proposal) => {
    setCreditProposal(p);
    setShowAddReceipt(false);
    setShowAddCredit(false);
    setNewReceipt({ receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
    setNewCredit({ creditAmount: 0, creditDays: 30, dueDate: '', remarks: '', status: 'Pending' });
    setCreditDialogOpen(true);
  };

  const getProposalTotals = (p: Proposal) => {
    const totalReceipts = p.receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalCredits = p.credits.reduce((sum, c) => sum + c.creditAmount, 0);
    const balance = p.totalPremiumDue - totalReceipts - totalCredits;
    return { totalReceipts, totalCredits, balance };
  };

  const handleAddReceipt = () => {
    if (!creditProposal || newReceipt.amount <= 0) return;
    const entry: ReceiptEntry = { ...newReceipt, id: `R${Date.now()}`, receiptNo: nextReceiptNo };
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? { ...p, receipts: [...p.receipts, entry] } : p));
    setCreditProposal(prev => prev ? { ...prev, receipts: [...prev.receipts, entry] } : prev);
    setNewReceipt({ receiptDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', amount: 0, remarks: '' });
    setShowAddReceipt(false);
    toast({ title: 'Receipt added', description: `${entry.receiptNo} — OMR ${entry.amount.toFixed(3)}` });
  };

  const handleAddCredit = () => {
    if (!creditProposal || newCredit.creditAmount <= 0 || !newCredit.dueDate) return;
    const entry: CreditEntry = { ...newCredit, id: `CR${Date.now()}` };
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? { ...p, credits: [...p.credits, entry] } : p));
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

  // All receipts across all proposals
  const allReceipts = proposals.flatMap(p => p.receipts.map(r => ({ ...r, proposalNo: p.proposalNo, clientName: p.clientName })));
  const allCredits = proposals.flatMap(p => p.credits.map(c => ({ ...c, proposalNo: p.proposalNo, clientName: p.clientName })));

  // Aging report: credits that are pending
  const today = new Date();
  const agingData = allCredits.filter(c => c.status === 'Pending').map(c => {
    const due = new Date(c.dueDate);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    let bucket = 'Current';
    if (daysOverdue > 90) bucket = '90+ Days';
    else if (daysOverdue > 60) bucket = '61-90 Days';
    else if (daysOverdue > 30) bucket = '31-60 Days';
    else if (daysOverdue > 0) bucket = '1-30 Days';
    return { ...c, daysOverdue, bucket };
  });

  const filteredProposals = uwApprovedProposals.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = (report: 'receipts' | 'aging', format: 'excel' | 'pdf') => {
    try {
      exportCreditReport(report, format, allReceipts, agingData);
      toast({ title: 'Report exported', description: `${report === 'receipts' ? 'Receipts Register' : 'Aging Report'} — ${format.toUpperCase()}` });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Credit Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage receipts, credit entries, aging reports</p>
      </div>

      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proposals">Pending Proposals</TabsTrigger>
          <TabsTrigger value="receipts">Receipts Register</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
        </TabsList>

        {/* Pending Proposals Tab */}
        <TabsContent value="proposals">
          <div className="glass-card">
            <div className="p-4 border-b border-border/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search proposals..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Proposal No</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-right px-4 py-3">Premium Due</th>
                    <th className="text-right px-4 py-3">Receipts</th>
                    <th className="text-right px-4 py-3">Credit</th>
                    <th className="text-right px-4 py-3">Balance</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map(p => {
                    const { totalReceipts, totalCredits, balance } = getProposalTotals(p);
                    return (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{p.proposalNo}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">OMR {p.totalPremiumDue.toFixed(3)}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600 text-right">OMR {totalReceipts.toFixed(3)}</td>
                        <td className="px-4 py-3 text-sm text-amber-600 text-right">OMR {totalCredits.toFixed(3)}</td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${balance <= 0.001 ? 'text-emerald-600' : 'text-destructive'}`}>OMR {balance.toFixed(3)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'Credit Approved' ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-info/15 text-info border border-info/20'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.status === 'UW Approved' && (
                            <button onClick={() => openCreditReview(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                              <Receipt className="w-3 h-3 inline mr-1" /> Manage
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProposals.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No proposals pending credit control</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Receipts Register Tab */}
        <TabsContent value="receipts">
          <div className="glass-card">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Receipts Register</h3>
              <div className="flex gap-2">
                <button onClick={() => handleExport('receipts', 'excel')} className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
                <button onClick={() => handleExport('receipts', 'pdf')} className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  <FileType className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Receipt No</th>
                    <th className="text-left px-4 py-3">Proposal</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Mode</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {allReceipts.map(r => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.proposalNo}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.clientName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.receiptDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.paymentMode}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right font-medium">OMR {r.amount.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                  {allReceipts.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No receipts recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Aging Report Tab */}
        <TabsContent value="aging">
          <div className="glass-card">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Credit Aging Report
              </h3>
              <div className="flex gap-2">
                <button onClick={() => handleExport('aging', 'excel')} className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
                <button onClick={() => handleExport('aging', 'pdf')} className="flex items-center gap-1 px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  <FileType className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>

            {/* Aging Summary */}
            <div className="p-4 grid grid-cols-5 gap-3">
              {['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].map(bucket => {
                const items = agingData.filter(a => a.bucket === bucket);
                const total = items.reduce((s, i) => s + i.creditAmount, 0);
                return (
                  <div key={bucket} className="p-3 bg-muted/30 border border-border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">{bucket}</p>
                    <p className={`text-sm font-bold ${bucket === '90+ Days' ? 'text-destructive' : bucket === 'Current' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      OMR {total.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">{items.length} entries</p>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Proposal</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Due Date</th>
                    <th className="text-right px-4 py-3">Days Overdue</th>
                    <th className="text-left px-4 py-3">Bucket</th>
                    <th className="text-left px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.map(a => (
                    <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{a.proposalNo}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{a.clientName}</td>
                      <td className="px-4 py-3 text-sm text-amber-600 text-right font-medium">OMR {a.creditAmount.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.dueDate}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${a.daysOverdue > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {a.daysOverdue > 0 ? a.daysOverdue : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.bucket === '90+ Days' ? 'bg-destructive/15 text-destructive' :
                          a.bucket === 'Current' ? 'bg-emerald-500/15 text-emerald-600' :
                          'bg-amber-500/15 text-amber-600'
                        }`}>{a.bucket}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.remarks || '—'}</td>
                    </tr>
                  ))}
                  {agingData.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No pending credit entries</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

                {/* Receipts */}
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
                  {showAddReceipt && (
                    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                      <h5 className="text-xs font-semibold text-foreground uppercase">New Receipt</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Receipt No</label>
                          <div className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-primary font-medium">{nextReceiptNo}</div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Date</label>
                          <input type="date" value={newReceipt.receiptDate} onChange={e => setNewReceipt(prev => ({ ...prev, receiptDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Payment Mode</label>
                          <select value={newReceipt.paymentMode} onChange={e => setNewReceipt(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Online">Online</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Amount (OMR)</label>
                          <input type="number" value={newReceipt.amount} step={0.001} onChange={e => setNewReceipt(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                          <input type="text" value={newReceipt.remarks} placeholder="Payment notes..." onChange={e => setNewReceipt(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddReceipt} disabled={newReceipt.amount <= 0}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">Add Receipt</button>
                        <button onClick={() => setShowAddReceipt(false)} className="px-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Credits */}
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
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'Settled' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAddCredit && (
                    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                      <h5 className="text-xs font-semibold text-foreground uppercase">New Credit Entry</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Credit Amount (OMR)</label>
                          <input type="number" value={newCredit.creditAmount} step={0.001} onChange={e => setNewCredit(prev => ({ ...prev, creditAmount: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Credit Days</label>
                          <input type="number" value={newCredit.creditDays} min={1} max={365}
                            onChange={e => {
                              const days = Number(e.target.value);
                              const due = new Date(); due.setDate(due.getDate() + days);
                              setNewCredit(prev => ({ ...prev, creditDays: days, dueDate: due.toISOString().split('T')[0] }));
                            }}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Due Date</label>
                          <input type="date" value={newCredit.dueDate} onChange={e => setNewCredit(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                          <input type="text" value={newCredit.remarks} placeholder="Credit terms..." onChange={e => setNewCredit(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddCredit} disabled={newCredit.creditAmount <= 0 || !newCredit.dueDate}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed">Add Credit</button>
                        <button onClick={() => setShowAddCredit(false)} className="px-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleCreditApprove} disabled={balance > 0.001}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {balance <= 0.001 ? 'Approve Credit' : `Outstanding Balance: OMR ${balance.toFixed(3)}`}
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditControl;
