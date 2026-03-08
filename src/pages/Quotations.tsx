import { useState, useMemo } from 'react';
import { Quotation, Client, MedicalQuestion } from '@/lib/types';
import { Plus, Search, UserPlus, Calculator, Ban, ArrowRight, MoreHorizontal, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { PRODUCTS, calculatePremium, calculateAge, PremiumBreakdown } from '@/lib/premiumEngine';
import { DEFAULT_MEDICAL_QUESTIONS } from '@/lib/medicalQuestions';

const statusStyles: Record<string, string> = {
  Draft: 'status-draft',
  Converted: 'status-active',
  Void: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Quotations = () => {
  const [search, setSearch] = useState('');
  const { quotations, setQuotations, clients, setClients, proposals, setProposals } = useData();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // New Quotation form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sumAssured, setSumAssured] = useState(100000);
  const [term, setTerm] = useState(10);
  const [healthLoading, setHealthLoading] = useState(0);
  const [includePTD, setIncludePTD] = useState(false);
  const [includeCyber, setIncludeCyber] = useState(false);
  const [newClient, setNewClient] = useState({ fullName: '', gender: 'Male', dob: '', nationality: 'Omani', idType: 'National ID', idNumber: '', phone: '', email: '' });

  // Convert to Proposal dialog state
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertQuotation, setConvertQuotation] = useState<Quotation | null>(null);
  const [medicalQuestions, setMedicalQuestions] = useState<MedicalQuestion[]>([]);
  const [medicalStep, setMedicalStep] = useState(0); // 0 = intro, 1 = filling

  const selectedClient = clients.find(c => c.clientId === selectedClientId);
  const selectedProduct = PRODUCTS.find(p => p.id === selectedProductId);
  const clientAge = useMemo(() => selectedClient ? calculateAge(selectedClient.dob) : 0, [selectedClient]);

  const premium: PremiumBreakdown | null = useMemo(() => {
    if (!selectedProductId || !selectedClient || clientAge < 1) return null;
    return calculatePremium({ productId: selectedProductId, age: clientAge, sumAssured, term, healthLoading, includePTD, includeCyber });
  }, [selectedProductId, selectedClient, clientAge, sumAssured, term, healthLoading, includePTD, includeCyber]);

  const resetForm = () => {
    setSelectedClientId(''); setSelectedProductId(''); setSumAssured(100000); setTerm(10);
    setHealthLoading(0); setIncludePTD(false); setIncludeCyber(false); setAddingClient(false);
    setNewClient({ fullName: '', gender: 'Male', dob: '', nationality: 'Omani', idType: 'National ID', idNumber: '', phone: '', email: '' });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const nc: Client = { clientId: `C${String(clients.length + 1).padStart(3, '0')}`, ...newClient, kycStatus: 'Pending' };
    setClients(prev => [...prev, nc]);
    setSelectedClientId(nc.clientId);
    setAddingClient(false);
    toast({ title: 'Client added', description: `${nc.fullName} added — KYC Pending` });
  };

  const handleCreateQuotation = () => {
    if (!selectedClient || !selectedProduct || !premium) return;
    const newQ: Quotation = {
      id: String(quotations.length + 1),
      quotRef: `QT-2026-${String(quotations.length + 1).padStart(4, '0')}`,
      clientName: selectedClient.fullName,
      productName: selectedProduct.name,
      sumAssured, totalPremium: premium.annualPremium,
      status: 'Draft', createdBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuotations(prev => [...prev, newQ]);
    setOpen(false); resetForm();
    toast({ title: 'Quotation created', description: `${newQ.quotRef} — OMR ${newQ.totalPremium.toFixed(3)}` });
  };

  const handleVoid = (q: Quotation) => {
    setQuotations(prev => prev.map(x => x.id === q.id ? { ...x, status: 'Void' as const } : x));
    toast({ title: 'Quotation voided', description: q.quotRef });
  };

  const openConvertDialog = (q: Quotation) => {
    setConvertQuotation(q);
    setMedicalQuestions(DEFAULT_MEDICAL_QUESTIONS.map(mq => ({ ...mq })));
    setMedicalStep(0);
    setConvertOpen(true);
  };

  const allMedicalAnswered = medicalQuestions.every(q => q.answer !== '');

  const handleConvertToProposal = () => {
    if (!convertQuotation || !allMedicalAnswered) return;
    const proposalNo = `PP-2026-${String(proposals.length + 1).padStart(4, '0')}`;
    setProposals(prev => [...prev, {
      id: String(proposals.length + 1), proposalNo, quotRef: convertQuotation.quotRef,
      clientName: convertQuotation.clientName, uwDecision: 'Pending', status: 'Pending UW' as const,
      createdAt: new Date().toISOString().split('T')[0],
      medicalQuestions: [...medicalQuestions],
      receipts: [], credits: [],
      totalPremiumDue: convertQuotation.totalPremium,
    }]);
    setQuotations(prev => prev.map(x => x.id === convertQuotation.id ? { ...x, status: 'Converted' as const } : x));
    setConvertOpen(false);
    toast({ title: 'Converted to proposal', description: `${convertQuotation.quotRef} → ${proposalNo} (Medical submitted)` });
  };

  const filtered = quotations.filter(q =>
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
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Quotation
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> New Quotation — Premium Calculator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Step 1: Client */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">1. Select Client</h3>
                  <button type="button" onClick={() => setAddingClient(!addingClient)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <UserPlus className="w-3 h-3" /> {addingClient ? 'Cancel' : 'Add New Client'}
                  </button>
                </div>
                {addingClient ? (
                  <form onSubmit={handleAddClient} className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                      <input type="text" placeholder="Ahmed Al Balushi" required value={newClient.fullName}
                        onChange={e => setNewClient(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                      <select value={newClient.gender} onChange={e => setNewClient(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Date of Birth</label>
                      <input type="date" required value={newClient.dob}
                        onChange={e => setNewClient(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Nationality</label>
                      <select value={newClient.nationality} onChange={e => setNewClient(prev => ({ ...prev, nationality: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="Omani">Omani</option>
                        <option value="Emirati">Emirati</option>
                        <option value="Saudi">Saudi</option>
                        <option value="Bahraini">Bahraini</option>
                        <option value="Kuwaiti">Kuwaiti</option>
                        <option value="Qatari">Qatari</option>
                        <option value="Indian">Indian</option>
                        <option value="Pakistani">Pakistani</option>
                        <option value="Bangladeshi">Bangladeshi</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Egyptian">Egyptian</option>
                        <option value="Jordanian">Jordanian</option>
                        <option value="British">British</option>
                        <option value="American">American</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">ID Type</label>
                      <select value={newClient.idType} onChange={e => setNewClient(prev => ({ ...prev, idType: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Resident Card">Resident Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">ID Number</label>
                      <input type="text" placeholder="12345678" required value={newClient.idNumber}
                        onChange={e => setNewClient(prev => ({ ...prev, idNumber: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                      <input type="text" placeholder="+968 9123 4567" required value={newClient.phone}
                        onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Email</label>
                      <input type="email" placeholder="name@email.com" required value={newClient.email}
                        onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="col-span-2">
                      <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Add Client & Select</button>
                    </div>
                  </form>
                ) : (
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Select existing client —</option>
                    {clients.map(c => (
                      <option key={c.clientId} value={c.clientId}>{c.fullName} ({c.clientId}) — DOB: {c.dob}</option>
                    ))}
                  </select>
                )}
                {selectedClient && (
                  <div className="flex gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <span><strong className="text-foreground">Age:</strong> {clientAge}</span>
                    <span><strong className="text-foreground">Gender:</strong> {selectedClient.gender}</span>
                    <span><strong className="text-foreground">KYC:</strong> {selectedClient.kycStatus}</span>
                    <span><strong className="text-foreground">ID:</strong> {selectedClient.idNumber}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Product */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">2. Product & Coverage</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Product</label>
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">— Select product —</option>
                      {PRODUCTS.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Age {p.minAge}-{p.maxAge}, Term {p.minTerm}-{p.maxTerm}yr)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Sum Assured (OMR)</label>
                    <input type="number" value={sumAssured} onChange={e => setSumAssured(Number(e.target.value))}
                      min={selectedProduct?.minSA || 5000} max={selectedProduct?.maxSA || 500000} step={1000}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Term (years)</label>
                    <input type="number" value={term} onChange={e => setTerm(Number(e.target.value))}
                      min={selectedProduct?.minTerm || 1} max={selectedProduct?.maxTerm || 30}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Health Loading (%)</label>
                    <select value={healthLoading} onChange={e => setHealthLoading(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {[0, 25, 50, 75, 100].map(v => (
                        <option key={v} value={v}>{v}%{v === 0 ? ' (Standard)' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-6 p-3 bg-muted/30 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch checked={includePTD} onCheckedChange={setIncludePTD} />
                    <label className="text-sm text-foreground">PTD Cover</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={includeCyber} onCheckedChange={setIncludeCyber} />
                    <label className="text-sm text-foreground">Cyber Protection</label>
                  </div>
                </div>
              </div>

              {/* Step 3: Breakdown */}
              {premium && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">3. Premium Breakdown</h3>
                  <div className="bg-muted/30 border border-border rounded-lg divide-y divide-border">
                    {[
                      { label: `Death Premium (Rate: ${premium.deathRate.toFixed(2)}‰)`, value: premium.deathPremium },
                      ...(premium.ptdPremium > 0 ? [{ label: `PTD Premium (Rate: ${premium.ptdRate.toFixed(2)}‰)`, value: premium.ptdPremium }] : []),
                      ...(premium.cyberPremium > 0 ? [{ label: `Cyber Premium (Rate: ${premium.cyberRate.toFixed(2)}‰)`, value: premium.cyberPremium }] : []),
                      { label: 'Base Premium', value: premium.basePremium, bold: true },
                      { label: 'Govt Supervision Fee (0.55%)', value: premium.govtFee },
                      { label: 'VAT on Premium (5%)', value: premium.vatOnPremium },
                      { label: 'VAT on Govt Fee (5%)', value: premium.vatOnGovtFee },
                      { label: 'Total VAT', value: premium.totalVAT },
                    ].map((row, i) => (
                      <div key={i} className={`flex justify-between px-4 py-2 text-sm ${row.bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        <span>{row.label}</span>
                        <span className="text-foreground">OMR {row.value.toFixed(3)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 text-sm font-bold bg-primary/5">
                      <span className="text-foreground">Annual Premium</span>
                      <span className="text-primary">OMR {premium.annualPremium.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2 text-sm text-muted-foreground">
                      <span>Total Premium ({term} years)</span>
                      <span className="text-foreground font-semibold">OMR {premium.totalPremium.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedProduct && clientAge > 0 && (clientAge < selectedProduct.minAge || clientAge > selectedProduct.maxAge) && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  Client age ({clientAge}) is outside the eligible range ({selectedProduct.minAge}–{selectedProduct.maxAge}) for {selectedProduct.name}.
                </p>
              )}

              <button onClick={handleCreateQuotation} disabled={!premium || !selectedClient || !selectedProduct}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Create Quotation
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
                <th className="text-right px-4 py-3">Annual Premium</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Actions</th>
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
                  <td className="px-4 py-3 text-center">
                    {q.status === 'Draft' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openConvertDialog(q)} className="gap-2">
                            <ArrowRight className="w-4 h-4" /> Convert to Proposal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVoid(q)} className="gap-2 text-destructive focus:text-destructive">
                            <Ban className="w-4 h-4" /> Void Quotation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert to Proposal — Medical Questionnaire Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Convert to Proposal — {convertQuotation?.quotRef}
            </DialogTitle>
          </DialogHeader>
          {convertQuotation && (
            <div className="space-y-5">
              {/* Quotation Summary */}
              <div className="p-4 bg-muted/30 border border-border rounded-lg grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Client:</span> <span className="text-foreground font-medium">{convertQuotation.clientName}</span></p>
                <p><span className="text-muted-foreground">Product:</span> <span className="text-foreground">{convertQuotation.productName}</span></p>
                <p><span className="text-muted-foreground">Sum Assured:</span> <span className="text-foreground">OMR {convertQuotation.sumAssured.toLocaleString()}</span></p>
                <p><span className="text-muted-foreground">Annual Premium:</span> <span className="text-foreground font-bold">OMR {convertQuotation.totalPremium.toFixed(3)}</span></p>
              </div>

              {medicalStep === 0 ? (
                <div className="text-center space-y-4 py-4">
                  <FileText className="w-10 h-10 text-primary mx-auto" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Medical Questionnaire Required</h3>
                    <p className="text-xs text-muted-foreground mt-1">The client must complete a medical declaration before this quotation can be submitted as a proposal for underwriting.</p>
                  </div>
                  <button onClick={() => setMedicalStep(1)}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                    Start Medical Questionnaire
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Medical Declaration</h4>
                    <p className="text-xs text-muted-foreground">{medicalQuestions.filter(q => q.answer !== '').length}/{medicalQuestions.length} answered</p>
                  </div>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {medicalQuestions.map((q, idx) => (
                      <div key={q.id} className="p-3 space-y-2">
                        <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">{idx + 1}.</span> {q.question}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            {(['Yes', 'No'] as const).map(ans => (
                              <button
                                key={ans}
                                onClick={() => setMedicalQuestions(prev => prev.map(mq => mq.id === q.id ? { ...mq, answer: ans } : mq))}
                                className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                                  q.answer === ans
                                    ? ans === 'Yes' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
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
                            onChange={(e) => setMedicalQuestions(prev => prev.map(mq => mq.id === q.id ? { ...mq, remarks: e.target.value } : mq))}
                            className="flex-1 px-2 py-1 bg-muted/30 border border-border rounded text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConvertToProposal}
                    disabled={!allMedicalAnswered}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {allMedicalAnswered ? 'Submit Medical & Create Proposal' : `Complete all ${medicalQuestions.length} questions to proceed`}
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;
