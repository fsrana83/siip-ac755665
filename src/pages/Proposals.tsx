import { Search, MoreHorizontal, ClipboardCheck, FileText, CheckCircle, ArrowRight, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useConfig } from '@/contexts/ConfigContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Proposal, UWReview } from '@/lib/types';

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
  const { proposals, setProposals, quotations, clients, medicalExams } = useData();
  const { products: configProducts } = useConfig();
  const { toast } = useToast();

  const [uwDialogOpen, setUwDialogOpen] = useState(false);
  const [uwProposal, setUwProposal] = useState<Proposal | null>(null);
  const [uwReview, setUwReview] = useState<UWReview>(DEFAULT_UW_REVIEW);

  const openUWReview = (p: Proposal) => {
    setUwProposal(p);
    setUwReview(p.uwReview || { ...DEFAULT_UW_REVIEW });
    setUwDialogOpen(true);
  };

  const getClientKyc = (name: string) => {
    const client = clients.find(c => c.fullName === name);
    return client?.kycStatus === 'Approved';
  };

  const clientKycApproved = uwProposal ? getClientKyc(uwProposal.clientName) : false;

  // Check if medical exam is required and its status
  const getMedicalStatus = (proposalNo: string) => {
    const exam = medicalExams.find(m => m.proposalNo === proposalNo);
    if (!exam) return null; // no medical required
    return exam;
  };

  const uwMedicalExam = uwProposal ? getMedicalStatus(uwProposal.proposalNo) : null;
  const medicalCleared = !uwMedicalExam || uwMedicalExam.status === 'Completed' || uwMedicalExam.status === 'Waived';

  const canApproveUW = uwReview.clientVerified && uwReview.quotationReviewed && uwReview.documentsChecked && uwReview.medicalReviewed && uwReview.riskRating !== '' && uwReview.riskRating !== 'Declined' && clientKycApproved && medicalCleared;

  const handleUWApprove = () => {
    if (!uwProposal) return;
    setProposals(prev => prev.map(p => p.id === uwProposal.id ? {
      ...p, uwDecision: `Approved (${uwReview.riskRating})`, status: 'UW Approved' as const, uwReview: { ...uwReview }, approvalDate: new Date().toISOString().split('T')[0],
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

  const getQuotDetails = (quotRef: string) => quotations.find(q => q.quotRef === quotRef);
  const getClientDetails = (name: string) => clients.find(c => c.fullName === name);

  const filtered = proposals.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNo.toLowerCase().includes(search.toLowerCase())
  );

  const getActions = (p: Proposal) => {
    if (p.status === 'Pending UW') return [
      { label: 'UW Review & Approve', icon: ClipboardCheck, action: () => openUWReview(p) },
    ];
    return [];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">Underwriting review and approval workflow</p>
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
                <th className="text-left px-4 py-3">Medical</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const actions = getActions(p);
                const medExam = getMedicalStatus(p.proposalNo);
                return (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{p.proposalNo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.quotRef}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{p.clientName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.uwDecision}</td>
                    <td className="px-4 py-3">
                      {medExam ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          medExam.status === 'Completed' ? 'status-active' :
                          medExam.status === 'Waived' ? 'status-draft' :
                          medExam.status === 'Booked' ? 'bg-info/15 text-info border border-info/20' :
                          'status-pending'
                        }`}>
                          <Stethoscope className="w-3 h-3" /> {medExam.status}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">N/A</span>
                      )}
                    </td>
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
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.answer === 'Yes' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>{q.answer}</span>
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
                      <Switch checked={(uwReview as any)[item.key]} onCheckedChange={(val) => setUwReview(prev => ({ ...prev, [item.key]: val }))} />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Risk Rating</label>
                  <select value={uwReview.riskRating} onChange={e => setUwReview(prev => ({ ...prev, riskRating: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Select —</option>
                    <option value="Standard">Standard</option>
                    <option value="Substandard">Substandard (with loading)</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">UW Remarks</label>
                  <textarea value={uwReview.uwRemarks} onChange={e => setUwReview(prev => ({ ...prev, uwRemarks: e.target.value }))}
                    placeholder="Additional underwriting notes..." rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              </div>

              {!clientKycApproved && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium">
                  ⚠ Client KYC is not approved. Proposal cannot be approved until KYC status is &quot;Approved&quot;.
                </div>
              )}

              {uwMedicalExam && !medicalCleared && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-700 font-medium flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Medical exam is required (SA exceeds threshold) — Status: {uwMedicalExam.status}. Complete or waive the medical exam before UW approval.
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className={`w-3.5 h-3.5 ${canApproveUW ? 'text-emerald-500' : ''}`} />
                <span>Checklist: {[uwReview.clientVerified, uwReview.quotationReviewed, uwReview.documentsChecked, uwReview.medicalReviewed].filter(Boolean).length}/4</span>
                <span className="text-border">|</span>
                <span>Risk: {uwReview.riskRating || 'Not set'}</span>
                <span className="text-border">|</span>
                <span>KYC: {clientKycApproved ? '✓ Approved' : '✗ Not Approved'}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={handleUWApprove} disabled={!canApproveUW}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Approve & Pass to Credit Control
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
    </div>
  );
};

export default Proposals;
