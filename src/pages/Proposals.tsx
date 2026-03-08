import { Search, MoreHorizontal, ArrowRight, CheckCircle, ClipboardCheck, FileText, Receipt, Eye } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Proposal, MedicalQuestion, UWReview, CreditReview } from '@/lib/types';

const DEFAULT_MEDICAL_QUESTIONS: MedicalQuestion[] = [
  { id: 'mq1', question: 'Has the applicant been treated for any heart, lung, kidney or liver condition?', answer: '', remarks: '' },
  { id: 'mq2', question: 'Has the applicant been diagnosed with diabetes, hypertension or high cholesterol?', answer: '', remarks: '' },
  { id: 'mq3', question: 'Has the applicant undergone any surgery in the last 5 years?', answer: '', remarks: '' },
  { id: 'mq4', question: 'Is the applicant currently on any medication?', answer: '', remarks: '' },
  { id: 'mq5', question: 'Has any insurance application been declined, postponed or modified?', answer: '', remarks: '' },
  { id: 'mq6', question: 'Does the applicant smoke or consume alcohol regularly?', answer: '', remarks: '' },
  { id: 'mq7', question: 'Has the applicant had any disability or chronic illness?', answer: '', remarks: '' },
  { id: 'mq8', question: 'Is the applicant engaged in any hazardous occupation or sport?', answer: '', remarks: '' },
];

const DEFAULT_UW_REVIEW: UWReview = {
  clientVerified: false,
  quotationReviewed: false,
  documentsChecked: false,
  medicalApproved: false,
  medicalQuestions: DEFAULT_MEDICAL_QUESTIONS,
  uwRemarks: '',
  riskRating: '',
};

const DEFAULT_CREDIT_REVIEW: CreditReview = {
  receiptNo: '',
  receiptDate: new Date().toISOString().split('T')[0],
  paymentMode: '',
  amountReceived: 0,
  creditRemarks: '',
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
  const [creditReview, setCreditReview] = useState<CreditReview>(DEFAULT_CREDIT_REVIEW);

  const openUWReview = (p: Proposal) => {
    setUwProposal(p);
    setUwReview(p.uwReview || { ...DEFAULT_UW_REVIEW, medicalQuestions: DEFAULT_MEDICAL_QUESTIONS.map(q => ({ ...q })) });
    setUwDialogOpen(true);
  };

  const openCreditReview = (p: Proposal) => {
    const quot = quotations.find(q => q.quotRef === p.quotRef);
    setCreditProposal(p);
    setCreditReview(p.creditReview || { ...DEFAULT_CREDIT_REVIEW, amountReceived: quot?.totalPremium || 0 });
    setCreditDialogOpen(true);
  };

  const canApproveUW = uwReview.clientVerified && uwReview.quotationReviewed && uwReview.documentsChecked && uwReview.medicalApproved && uwReview.riskRating !== '' && uwReview.riskRating !== 'Declined';
  const allMedicalAnswered = uwReview.medicalQuestions.every(q => q.answer !== '');

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
      ...p, uwDecision: 'Declined', status: 'Pending UW' as const, uwReview: { ...uwReview, riskRating: 'Declined' },
    } : p));
    setUwDialogOpen(false);
    toast({ title: 'UW Declined', description: uwProposal.proposalNo, variant: 'destructive' });
  };

  const canApproveCreditReview = creditReview.receiptNo !== '' && creditReview.paymentMode !== '' && creditReview.amountReceived > 0;

  const handleCreditApprove = () => {
    if (!creditProposal) return;
    setProposals(prev => prev.map(p => p.id === creditProposal.id ? {
      ...p, status: 'Credit Approved' as const, creditReview: { ...creditReview },
    } : p));
    setCreditDialogOpen(false);
    toast({ title: 'Credit Approved & Receipt Issued', description: `Receipt: ${creditReview.receiptNo}` });
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
      { label: 'Issue Receipt / Credit Approve', icon: Receipt, action: () => openCreditReview(p) },
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
        <p className="text-sm text-muted-foreground mt-1">UW review → Medical approval → Credit/Receipt → Policy issuance</p>
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
                        <p><span className="text-muted-foreground">KYC:</span> <span className={`font-medium ${client.kycStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{client.kycStatus}</span></p>
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

              {/* UW Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">UW Verification Checklist</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'clientVerified', label: 'Client Identity Verified' },
                    { key: 'quotationReviewed', label: 'Quotation Details Reviewed' },
                    { key: 'documentsChecked', label: 'Supporting Documents Checked' },
                    { key: 'medicalApproved', label: 'Medical Questionnaire Approved' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                      <Switch
                        checked={(uwReview as any)[item.key]}
                        onCheckedChange={(val) => setUwReview(prev => ({ ...prev, [item.key]: val }))}
                        disabled={item.key === 'medicalApproved' && !allMedicalAnswered}
                      />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Questionnaire */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Medical Questionnaire
                </h4>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {uwReview.medicalQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3 space-y-2">
                      <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">{idx + 1}.</span> {q.question}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          {(['Yes', 'No'] as const).map(ans => (
                            <button
                              key={ans}
                              onClick={() => setUwReview(prev => ({
                                ...prev,
                                medicalQuestions: prev.medicalQuestions.map(mq => mq.id === q.id ? { ...mq, answer: ans } : mq),
                              }))}
                              className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                                q.answer === ans
                                  ? ans === 'Yes' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                              }`}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Remarks (if any)"
                          value={q.remarks}
                          onChange={(e) => setUwReview(prev => ({
                            ...prev,
                            medicalQuestions: prev.medicalQuestions.map(mq => mq.id === q.id ? { ...mq, remarks: e.target.value } : mq),
                          }))}
                          className="flex-1 px-2 py-1 bg-muted/30 border border-border rounded text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
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

              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className={`w-3.5 h-3.5 ${allMedicalAnswered ? 'text-emerald-500' : ''}`} />
                <span>Medical: {uwReview.medicalQuestions.filter(q => q.answer !== '').length}/{uwReview.medicalQuestions.length} answered</span>
                <span className="text-border">|</span>
                <span>Checklist: {[uwReview.clientVerified, uwReview.quotationReviewed, uwReview.documentsChecked, uwReview.medicalApproved].filter(Boolean).length}/4</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleUWApprove}
                  disabled={!canApproveUW}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Approve & Pass to Accounts
                </button>
                <button
                  onClick={handleUWDecline}
                  className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm hover:bg-destructive/90 transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit / Receipt Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Issue Receipt — {creditProposal?.proposalNo}
            </DialogTitle>
          </DialogHeader>
          {creditProposal && (
            <div className="space-y-5">
              {/* Proposal summary */}
              <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-1 text-sm">
                <p><span className="text-muted-foreground">Client:</span> <span className="text-foreground font-medium">{creditProposal.clientName}</span></p>
                <p><span className="text-muted-foreground">UW Decision:</span> <span className="text-emerald-500 font-medium">{creditProposal.uwDecision}</span></p>
                {(() => {
                  const quot = getQuotDetails(creditProposal.quotRef);
                  return quot ? (
                    <p><span className="text-muted-foreground">Premium Due:</span> <span className="text-foreground font-bold">OMR {quot.totalPremium.toFixed(3)}</span></p>
                  ) : null;
                })()}
              </div>

              {/* Receipt form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Receipt No</label>
                  <input
                    type="text"
                    value={creditReview.receiptNo}
                    onChange={e => setCreditReview(prev => ({ ...prev, receiptNo: e.target.value }))}
                    placeholder="REC-2026-0001"
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={creditReview.receiptDate}
                    onChange={e => setCreditReview(prev => ({ ...prev, receiptDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Payment Mode</label>
                  <select
                    value={creditReview.paymentMode}
                    onChange={e => setCreditReview(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">— Select —</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Amount Received (OMR)</label>
                  <input
                    type="number"
                    value={creditReview.amountReceived}
                    onChange={e => setCreditReview(prev => ({ ...prev, amountReceived: Number(e.target.value) }))}
                    step={0.001}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                  <textarea
                    value={creditReview.creditRemarks}
                    onChange={e => setCreditReview(prev => ({ ...prev, creditRemarks: e.target.value }))}
                    placeholder="Payment notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreditApprove}
                disabled={!canApproveCreditReview}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Approve Credit & Issue Receipt
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposals;
