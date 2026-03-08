import { useState, useMemo } from 'react';
import { mockQuotations, mockClients } from '@/lib/mockData';
import { Quotation, Client } from '@/lib/types';
import { Plus, Search, UserPlus, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PRODUCTS, calculatePremium, calculateAge, getAgeBand, CalcInput, PremiumBreakdown } from '@/lib/premiumEngine';

const statusStyles: Record<string, string> = {
  Draft: 'status-draft',
  Converted: 'status-active',
};

const Quotations = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Quotation[]>(mockQuotations);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [open, setOpen] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const { toast } = useToast();

  // Quotation form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sumAssured, setSumAssured] = useState(100000);
  const [term, setTerm] = useState(10);
  const [healthLoading, setHealthLoading] = useState(0);
  const [includePTD, setIncludePTD] = useState(false);
  const [includeCyber, setIncludeCyber] = useState(false);

  // New client form state
  const [newClient, setNewClient] = useState({ fullName: '', gender: 'Male', dob: '', nationality: 'Omani', idType: 'National ID', idNumber: '', phone: '', email: '' });

  const selectedClient = clients.find(c => c.clientId === selectedClientId);
  const selectedProduct = PRODUCTS.find(p => p.id === selectedProductId);

  const clientAge = useMemo(() => {
    if (!selectedClient) return 0;
    return calculateAge(selectedClient.dob);
  }, [selectedClient]);

  const premium: PremiumBreakdown | null = useMemo(() => {
    if (!selectedProductId || !selectedClient || clientAge < 1) return null;
    return calculatePremium({
      productId: selectedProductId,
      age: clientAge,
      sumAssured,
      term,
      healthLoading,
      includePTD,
      includeCyber,
    });
  }, [selectedProductId, selectedClient, clientAge, sumAssured, term, healthLoading, includePTD, includeCyber]);

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedProductId('');
    setSumAssured(100000);
    setTerm(10);
    setHealthLoading(0);
    setIncludePTD(false);
    setIncludeCyber(false);
    setAddingClient(false);
    setNewClient({ fullName: '', gender: 'Male', dob: '', nationality: 'Omani', idType: 'National ID', idNumber: '', phone: '', email: '' });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const nc: Client = {
      clientId: `C${String(clients.length + 1).padStart(3, '0')}`,
      ...newClient,
      kycStatus: 'Pending',
    };
    setClients(prev => [...prev, nc]);
    setSelectedClientId(nc.clientId);
    setAddingClient(false);
    toast({ title: 'Client added', description: `${nc.fullName} added — KYC Pending` });
  };

  const handleCreateQuotation = () => {
    if (!selectedClient || !selectedProduct || !premium) return;
    const newQ: Quotation = {
      id: String(data.length + 1),
      quotRef: `QT-2026-${String(data.length + 1).padStart(4, '0')}`,
      clientName: selectedClient.fullName,
      productName: selectedProduct.name,
      sumAssured,
      totalPremium: premium.annualPremium,
      status: 'Draft',
      createdBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setData(prev => [...prev, newQ]);
    setOpen(false);
    resetForm();
    toast({ title: 'Quotation created', description: `${newQ.quotRef} — Annual Premium: OMR ${newQ.totalPremium.toFixed(3)}` });
  };

  const filtered = data.filter(q =>
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
              {/* ─── Step 1: Client Selection ─── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">1. Select Client</h3>
                  <button type="button" onClick={() => setAddingClient(!addingClient)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <UserPlus className="w-3 h-3" /> {addingClient ? 'Cancel' : 'Add New Client'}
                  </button>
                </div>

                {addingClient ? (
                  <form onSubmit={handleAddClient} className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                    {[
                      { name: 'fullName', label: 'Full Name', placeholder: 'Ahmed Al Balushi', span: 2 },
                      { name: 'gender', label: 'Gender', placeholder: 'Male' },
                      { name: 'dob', label: 'Date of Birth', type: 'date' },
                      { name: 'nationality', label: 'Nationality', placeholder: 'Omani' },
                      { name: 'idType', label: 'ID Type', placeholder: 'National ID' },
                      { name: 'idNumber', label: 'ID Number', placeholder: '12345678' },
                      { name: 'phone', label: 'Phone', placeholder: '+968 9123 4567' },
                      { name: 'email', label: 'Email', type: 'email', placeholder: 'name@email.com', span: 2 },
                    ].map(f => (
                      <div key={f.name} className={f.span === 2 ? 'col-span-2' : ''}>
                        <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                        <input type={f.type || 'text'} placeholder={f.placeholder} required
                          value={(newClient as any)[f.name]}
                          onChange={e => setNewClient(prev => ({ ...prev, [f.name]: e.target.value }))}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                        Add Client & Select
                      </button>
                    </div>
                  </form>
                ) : (
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Select existing client —</option>
                    {clients.map(c => (
                      <option key={c.clientId} value={c.clientId}>
                        {c.fullName} ({c.clientId}) — DOB: {c.dob}
                      </option>
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

              {/* ─── Step 2: Product & Coverage ─── */}
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
                    {selectedProduct && <p className="text-[10px] text-muted-foreground mt-1">Range: {selectedProduct.minSA.toLocaleString()} – {selectedProduct.maxSA.toLocaleString()}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Term (years)</label>
                    <input type="number" value={term} onChange={e => setTerm(Number(e.target.value))}
                      min={selectedProduct?.minTerm || 1} max={selectedProduct?.maxTerm || 30}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    {selectedProduct && <p className="text-[10px] text-muted-foreground mt-1">Range: {selectedProduct.minTerm} – {selectedProduct.maxTerm} years</p>}
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

                {/* Optional covers */}
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

              {/* ─── Step 3: Premium Breakdown ─── */}
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

              {/* Validation messages */}
              {selectedProduct && clientAge > 0 && (clientAge < selectedProduct.minAge || clientAge > selectedProduct.maxAge) && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  Client age ({clientAge}) is outside the eligible range ({selectedProduct.minAge}–{selectedProduct.maxAge}) for {selectedProduct.name}.
                </p>
              )}

              <button
                onClick={handleCreateQuotation}
                disabled={!premium || !selectedClient || !selectedProduct}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quotations;
