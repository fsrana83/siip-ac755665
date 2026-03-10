import { useState } from 'react';
import { Users, Building2, Receipt, Package, Shield, Plus, Trash2, Edit, History, Save, Stethoscope } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useConfig, COVER_TYPES, ProductConfig } from '@/contexts/ConfigContext';
import { PremiumFrequency } from '@/lib/types';

const tabs = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'company', label: 'Company Setup', icon: Building2 },
  { id: 'vat', label: 'VAT Configuration', icon: Receipt },
  { id: 'products', label: 'Product Setup', icon: Package },
  { id: 'medical', label: 'Medical Rules', icon: Stethoscope },
  { id: 'reinsurance', label: 'Reinsurance Setup', icon: Shield },
];

const mockUsers = [
  { username: 'admin', fullName: 'System Administrator', role: 'admin', active: true },
  { username: 'coo', fullName: 'Chief Operating Officer', role: 'coo', active: true },
  { username: 'sales01', fullName: 'Ali Al Farsi', role: 'sales', active: true },
  { username: 'uw01', fullName: 'Hamed Al Lawati', role: 'uw', active: true },
];

interface Reinsurer {
  id: string;
  code: string;
  name: string;
  country: string;
  rating: string;
  contactPerson: string;
  email: string;
  status: 'Active' | 'Inactive';
}

interface Treaty {
  id: string;
  code: string;
  name: string;
  type: 'Surplus' | 'Quota Share' | 'Excess of Loss' | 'Facultative';
  effectiveFrom: string;
  effectiveTo: string;
  retentionLimit: number;
  status: 'Active' | 'Expired' | 'Draft';
}

interface TreatyParticipant {
  id: string;
  treatyCode: string;
  reinsurerCode: string;
  reinsurerName: string;
  sharePct: number;
  maxLiability: number;
}

const initialReinsurers: Reinsurer[] = [
  { id: '1', code: 'RE-2026-0001', name: 'Swiss Re', country: 'Switzerland', rating: 'AA-', contactPerson: 'Hans Mueller', email: 'hans@swissre.com', status: 'Active' },
  { id: '2', code: 'RE-2026-0002', name: 'Munich Re', country: 'Germany', rating: 'AA-', contactPerson: 'Klaus Schmidt', email: 'klaus@munichre.com', status: 'Active' },
  { id: '3', code: 'RE-2026-0003', name: 'Hannover Re', country: 'Germany', rating: 'A+', contactPerson: 'Eva Wagner', email: 'eva@hannover-re.com', status: 'Active' },
  { id: '4', code: 'RE-2026-0004', name: 'SCOR', country: 'France', rating: 'A+', contactPerson: 'Pierre Dupont', email: 'pierre@scor.com', status: 'Inactive' },
];

const initialTreaties: Treaty[] = [
  { id: '1', code: 'TRT-2026-0001', name: 'Surplus Treaty 2026', type: 'Surplus', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 50000, status: 'Active' },
  { id: '2', code: 'TRT-2026-0002', name: 'Quota Share 2026', type: 'Quota Share', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 100000, status: 'Active' },
  { id: '3', code: 'TRT-2026-0003', name: 'XOL Treaty 2026', type: 'Excess of Loss', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 200000, status: 'Draft' },
];

const initialParticipants: TreatyParticipant[] = [
  { id: '1', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0001', reinsurerName: 'Swiss Re', sharePct: 50, maxLiability: 500000 },
  { id: '2', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0002', reinsurerName: 'Munich Re', sharePct: 30, maxLiability: 300000 },
  { id: '3', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0003', reinsurerName: 'Hannover Re', sharePct: 20, maxLiability: 200000 },
  { id: '4', treatyCode: 'TRT-2026-0002', reinsurerCode: 'RE-2026-0001', reinsurerName: 'Swiss Re', sharePct: 40, maxLiability: 400000 },
  { id: '5', treatyCode: 'TRT-2026-0002', reinsurerCode: 'RE-2026-0002', reinsurerName: 'Munich Re', sharePct: 60, maxLiability: 600000 },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { toast } = useToast();
  const { vatEntries, currentVATRate, addVATChange, products, setProducts } = useConfig();

  // VAT state
  const [vatDialog, setVatDialog] = useState(false);
  const [vatCoverType, setVatCoverType] = useState('');
  const [vatNewRate, setVatNewRate] = useState('');
  const [vatEffectiveDate, setVatEffectiveDate] = useState('');
  const [vatHistoryDialog, setVatHistoryDialog] = useState(false);
  const [vatHistoryCover, setVatHistoryCover] = useState('');

  // Product edit state
  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductConfig | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  const openNewProduct = () => {
    setEditProduct({
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      name: '',
      minAge: 18, maxAge: 60, minTerm: 5, maxTerm: 30, minSA: 5000, maxSA: 500000,
      deathRates: { '18-25': 1.0, '26-30': 1.2, '31-35': 1.5, '36-40': 2.0, '41-45': 2.8, '46-50': 3.8, '51-55': 5.2, '56-60': 7.0 },
      ptdRates: { '18-25': 0.3, '26-30': 0.4, '31-35': 0.5, '36-40': 0.7, '41-45': 0.9, '46-50': 1.3, '51-55': 1.7, '56-60': 2.3 },
      cyberRate: 0.3,
      active: true,
      allowedFrequencies: ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'],
      calcMethod: 'Rate per Mille',
      medicalSAThreshold: 100000,
    });
    setIsNewProduct(true);
    setProductDialog(true);
  };
  // Reinsurance state
  const [riSubTab, setRiSubTab] = useState<'reinsurers' | 'treaties' | 'participants'>('reinsurers');
  const [reinsurers, setReinsurers] = useState<Reinsurer[]>(initialReinsurers);
  const [treaties, setTreaties] = useState<Treaty[]>(initialTreaties);
  const [participants, setParticipants] = useState<TreatyParticipant[]>(initialParticipants);

  // Dialogs
  const [reinsurerDialog, setReinsurerDialog] = useState(false);
  const [treatyDialog, setTreatyDialog] = useState(false);
  const [participantDialog, setParticipantDialog] = useState(false);

  const handleAddReinsurer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newR: Reinsurer = {
      id: String(reinsurers.length + 1),
      code: `RE-${new Date().getFullYear()}-${String(reinsurers.length + 1).padStart(4, '0')}`,
      name: fd.get('name') as string,
      country: fd.get('country') as string,
      rating: fd.get('rating') as string,
      contactPerson: fd.get('contactPerson') as string,
      email: fd.get('email') as string,
      status: 'Active',
    };
    setReinsurers(prev => [...prev, newR]);
    setReinsurerDialog(false);
    toast({ title: 'Reinsurer added', description: `${newR.code} — ${newR.name}` });
  };

  const handleAddTreaty = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newT: Treaty = {
      id: String(treaties.length + 1),
      code: `TRT-${new Date().getFullYear()}-${String(treaties.length + 1).padStart(4, '0')}`,
      name: fd.get('name') as string,
      type: fd.get('type') as Treaty['type'],
      effectiveFrom: fd.get('effectiveFrom') as string,
      effectiveTo: fd.get('effectiveTo') as string,
      retentionLimit: Number(fd.get('retentionLimit')),
      status: 'Draft',
    };
    setTreaties(prev => [...prev, newT]);
    setTreatyDialog(false);
    toast({ title: 'Treaty created', description: `${newT.code} — ${newT.name}` });
  };

  const handleAddParticipant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const treatyCode = fd.get('treatyCode') as string;
    const reinsurerCode = fd.get('reinsurerCode') as string;
    const reinsurer = reinsurers.find(r => r.code === reinsurerCode);
    const newP: TreatyParticipant = {
      id: String(participants.length + 1),
      treatyCode,
      reinsurerCode,
      reinsurerName: reinsurer?.name || reinsurerCode,
      sharePct: Number(fd.get('sharePct')),
      maxLiability: Number(fd.get('maxLiability')),
    };
    setParticipants(prev => [...prev, newP]);
    setParticipantDialog(false);
    toast({ title: 'Participant added', description: `${newP.reinsurerName} — ${newP.sharePct}%` });
  };

  const deleteReinsurer = (id: string) => {
    setReinsurers(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Reinsurer removed' });
  };

  const deleteTreaty = (id: string) => {
    setTreaties(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Treaty removed' });
  };

  const deleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Participant removed' });
  };

  const inputClass = "w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">System configuration and management</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">System Users</h3>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
              + Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Full Name</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(u => (
                  <tr key={u.username} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{u.fullName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="status-active inline-block px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-semibold text-foreground">Company Profile</h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Company Name', value: 'SmartIdeas Insurance Portals LLC' },
              { label: 'Company Alias', value: 'SmartIdeas' },
              { label: 'CR Number', value: '1234567' },
              { label: 'Licence Number', value: 'INS-2024-001' },
              { label: 'VAT Number', value: 'OM1234567890' },
              { label: 'Govt. Supervision Fee', value: '0.55%' },
              { label: 'Phone', value: '+968 2400 0000' },
              { label: 'Email', value: 'info@smartideas.om' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground">{field.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vat' && (
        <div className="space-y-4">
          <div className="glass-card">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">VAT Rates by Cover Type</h3>
              <button onClick={() => { setVatDialog(true); setVatCoverType(COVER_TYPES[0]); setVatNewRate(''); setVatEffectiveDate(''); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                <Edit className="w-3.5 h-3.5" /> Change VAT Rate
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Cover Type</th>
                  <th className="text-right px-4 py-3">Current Rate (%)</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">History</th>
                </tr>
              </thead>
              <tbody>
                {COVER_TYPES.map(cover => (
                  <tr key={cover} className="border-b border-border/30">
                    <td className="px-4 py-3 text-sm text-foreground">{cover}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-medium">{currentVATRate(cover).toFixed(3)}%</td>
                    <td className="px-4 py-3"><span className="status-active inline-block px-2 py-0.5 rounded-full text-xs font-medium">Active</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setVatHistoryCover(cover); setVatHistoryDialog(true); }}
                        className="text-primary hover:text-primary/80"><History className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VAT Change Dialog */}
          <Dialog open={vatDialog} onOpenChange={setVatDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Change VAT Rate</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                addVATChange(vatCoverType, Number(vatNewRate), vatEffectiveDate);
                setVatDialog(false);
                toast({ title: 'VAT rate updated', description: `${vatCoverType} → ${vatNewRate}% effective ${vatEffectiveDate}` });
              }} className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Cover Type</label>
                  <select value={vatCoverType} onChange={e => setVatCoverType(e.target.value)} className={inputClass}>
                    {COVER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Current Rate: {currentVATRate(vatCoverType).toFixed(3)}%</label>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">New Rate (%)</label>
                  <input type="number" step="0.001" min="0" max="100" value={vatNewRate} onChange={e => setVatNewRate(e.target.value)} required className={inputClass} placeholder="5.000" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Effective Date</label>
                  <input type="date" value={vatEffectiveDate} onChange={e => setVatEffectiveDate(e.target.value)} required className={inputClass} />
                </div>
                <p className="text-xs text-muted-foreground">Entry date will be recorded automatically as today.</p>
                <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Save VAT Change</button>
              </form>
            </DialogContent>
          </Dialog>

          {/* VAT History Dialog */}
          <Dialog open={vatHistoryDialog} onOpenChange={setVatHistoryDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>VAT Change History — {vatHistoryCover}</DialogTitle></DialogHeader>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-3 py-2 text-xs">Entry Date</th>
                      <th className="text-left px-3 py-2 text-xs">Effective Date</th>
                      <th className="text-right px-3 py-2 text-xs">Prev Rate</th>
                      <th className="text-right px-3 py-2 text-xs">New Rate</th>
                      <th className="text-left px-3 py-2 text-xs">Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vatEntries.filter(e => e.coverType === vatHistoryCover).sort((a, b) => b.entryDate.localeCompare(a.entryDate)).map(e => (
                      <tr key={e.id} className="border-b border-border/30">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{e.entryDate}</td>
                        <td className="px-3 py-2 text-xs text-foreground font-medium">{e.effectiveDate}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground text-right">{e.previousRate !== null ? `${e.previousRate}%` : '—'}</td>
                        <td className="px-3 py-2 text-xs text-foreground text-right font-medium">{e.rate}%</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{e.changedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="glass-card">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Product Register ({products.length} products)</h3>
              <button onClick={openNewProduct} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" /> New Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Product ID</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Age Range</th>
                    <th className="text-left px-4 py-3">Term</th>
                    <th className="text-left px-4 py-3">SA Range (OMR)</th>
                    <th className="text-left px-4 py-3">Calc Method</th>
                    <th className="text-left px-4 py-3">Frequencies</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{p.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.minAge}–{p.maxAge}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.minTerm}–{p.maxTerm} yr</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.minSA.toLocaleString()}–{p.maxSA.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-medium">{p.calcMethod}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.allowedFrequencies.join(', ')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'status-active' : 'status-draft'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditProduct({ ...p }); setIsNewProduct(false); setProductDialog(true); }}
                          className="text-primary hover:text-primary/80"><Edit className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Edit Dialog */}
          <Dialog open={productDialog} onOpenChange={setProductDialog}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{isNewProduct ? 'New Product' : `Edit Product — ${editProduct?.name}`}</DialogTitle></DialogHeader>
              {editProduct && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!editProduct.name.trim()) return;
                  if (isNewProduct) {
                    setProducts(prev => [...prev, editProduct]);
                    toast({ title: 'Product created', description: `${editProduct.id} — ${editProduct.name}` });
                  } else {
                    setProducts(prev => prev.map(p => p.id === editProduct.id ? editProduct : p));
                    toast({ title: 'Product updated', description: editProduct.name });
                  }
                  setProductDialog(false);
                }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Product ID</label>
                      <input value={editProduct.id} onChange={e => isNewProduct ? setEditProduct({ ...editProduct, id: e.target.value }) : undefined}
                        readOnly={!isNewProduct} className={`${inputClass} ${!isNewProduct ? 'opacity-60' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Product Name</label>
                      <input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required className={inputClass} placeholder="e.g. Term Life - Special" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Min Age</label>
                      <input type="number" value={editProduct.minAge} onChange={e => setEditProduct({ ...editProduct, minAge: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Max Age</label>
                      <input type="number" value={editProduct.maxAge} onChange={e => setEditProduct({ ...editProduct, maxAge: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Min Term (yr)</label>
                      <input type="number" value={editProduct.minTerm} onChange={e => setEditProduct({ ...editProduct, minTerm: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Max Term (yr)</label>
                      <input type="number" value={editProduct.maxTerm} onChange={e => setEditProduct({ ...editProduct, maxTerm: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Min SA (OMR)</label>
                      <input type="number" value={editProduct.minSA} onChange={e => setEditProduct({ ...editProduct, minSA: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Max SA (OMR)</label>
                      <input type="number" value={editProduct.maxSA} onChange={e => setEditProduct({ ...editProduct, maxSA: Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Calculation Method</label>
                    <select value={editProduct.calcMethod} onChange={e => setEditProduct({ ...editProduct, calcMethod: e.target.value as ProductConfig['calcMethod'] })} className={inputClass}>
                      <option value="Rate per Mille">Rate per Mille</option>
                      <option value="Flat Rate">Flat Rate</option>
                      <option value="Age-Rated">Age-Rated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cyber Rate (‰)</label>
                    <input type="number" step="0.01" value={editProduct.cyberRate} onChange={e => setEditProduct({ ...editProduct, cyberRate: Number(e.target.value) })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Allowed Premium Frequencies</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Single'] as PremiumFrequency[]).map(f => (
                        <label key={f} className="flex items-center gap-1.5 text-sm text-foreground">
                          <input type="checkbox" checked={editProduct.allowedFrequencies.includes(f)}
                            onChange={(e) => {
                              setEditProduct(prev => prev ? {
                                ...prev,
                                allowedFrequencies: e.target.checked
                                  ? [...prev.allowedFrequencies, f]
                                  : prev.allowedFrequencies.filter(x => x !== f)
                              } : prev);
                            }}
                            className="rounded border-border" />
                          {f}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editProduct.active}
                      onChange={e => setEditProduct({ ...editProduct, active: e.target.checked })}
                      className="rounded border-border" />
                    <label className="text-sm text-foreground">Active</label>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Medical SA Threshold (OMR)</label>
                    <input type="number" value={editProduct.medicalSAThreshold} onChange={e => setEditProduct({ ...editProduct, medicalSAThreshold: Number(e.target.value) })} className={inputClass} placeholder="100000" />
                    <p className="text-[10px] text-muted-foreground mt-1">SA above this amount requires medical examination</p>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> {isNewProduct ? 'Create Product' : 'Save Product'}
                  </button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'reinsurance' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
            {([
              { id: 'reinsurers', label: 'Reinsurers' },
              { id: 'treaties', label: 'Treaties' },
              { id: 'participants', label: 'Treaty Participants' },
            ] as const).map(st => (
              <button key={st.id} onClick={() => setRiSubTab(st.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${riSubTab === st.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {st.label}
              </button>
            ))}
          </div>

          {/* Reinsurers */}
          {riSubTab === 'reinsurers' && (
            <div className="glass-card">
              <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-foreground">Reinsurer Register (RE-YYYY-NNNN)</h3>
                <button onClick={() => setReinsurerDialog(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5" /> Add Reinsurer
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-4 py-3">Code</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Country</th>
                      <th className="text-left px-4 py-3">Rating</th>
                      <th className="text-left px-4 py-3">Contact</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reinsurers.map(r => (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{r.code}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{r.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.country}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{r.rating}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.contactPerson}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Active' ? 'status-active' : 'status-draft'}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteReinsurer(r.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Treaties */}
          {riSubTab === 'treaties' && (
            <div className="glass-card">
              <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-foreground">Treaty Register (TRT-YYYY-NNNN)</h3>
                <button onClick={() => setTreatyDialog(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5" /> Add Treaty
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-4 py-3">Code</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Effective From</th>
                      <th className="text-left px-4 py-3">Effective To</th>
                      <th className="text-right px-4 py-3">Retention Limit (OMR)</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treaties.map(t => (
                      <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{t.code}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{t.name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-medium">{t.type}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{t.effectiveFrom}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{t.effectiveTo}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">OMR {t.retentionLimit.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Active' ? 'status-active' : t.status === 'Draft' ? 'status-draft' : 'status-pending'}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteTreaty(t.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Treaty Participants */}
          {riSubTab === 'participants' && (
            <div className="glass-card">
              <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-foreground">Treaty Participants (Banded Shares)</h3>
                <button onClick={() => setParticipantDialog(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5" /> Add Participant
                </button>
              </div>
              {treaties.map(treaty => {
                const tParts = participants.filter(p => p.treatyCode === treaty.code);
                const totalShare = tParts.reduce((s, p) => s + p.sharePct, 0);
                if (tParts.length === 0) return null;
                return (
                  <div key={treaty.code} className="border-b border-border/30 last:border-b-0">
                    <div className="px-4 py-3 bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-foreground">{treaty.code}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {treaty.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${totalShare === 100 ? 'text-emerald-600' : 'text-destructive'}`}>
                        Total Share: {totalShare}%
                      </span>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left px-4 py-2">Reinsurer</th>
                          <th className="text-right px-4 py-2">Share %</th>
                          <th className="text-right px-4 py-2">Max Liability (OMR)</th>
                          <th className="text-center px-4 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tParts.map(p => (
                          <tr key={p.id} className="border-b border-border/20 hover:bg-muted/30">
                            <td className="px-4 py-2 text-sm text-foreground">{p.reinsurerName} <span className="text-muted-foreground text-xs">({p.reinsurerCode})</span></td>
                            <td className="px-4 py-2 text-sm text-foreground text-right font-medium">{p.sharePct}%</td>
                            <td className="px-4 py-2 text-sm text-foreground text-right">OMR {p.maxLiability.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => deleteParticipant(p.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reinsurer Dialog */}
      <Dialog open={reinsurerDialog} onOpenChange={setReinsurerDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Reinsurer</DialogTitle></DialogHeader>
          <form onSubmit={handleAddReinsurer} className="space-y-3">
            {[
              { name: 'name', label: 'Company Name', placeholder: 'Swiss Re' },
              { name: 'country', label: 'Country', placeholder: 'Switzerland' },
              { name: 'rating', label: 'Credit Rating', placeholder: 'AA-' },
              { name: 'contactPerson', label: 'Contact Person', placeholder: 'John Doe' },
              { name: 'email', label: 'Email', placeholder: 'contact@reinsurer.com', type: 'email' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required className={inputClass} />
              </div>
            ))}
            <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Add Reinsurer</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Treaty Dialog */}
      <Dialog open={treatyDialog} onOpenChange={setTreatyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Treaty</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTreaty} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Treaty Name</label>
              <input name="name" placeholder="Surplus Treaty 2026" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select name="type" required className={inputClass}>
                <option value="Surplus">Surplus</option>
                <option value="Quota Share">Quota Share</option>
                <option value="Excess of Loss">Excess of Loss</option>
                <option value="Facultative">Facultative</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Effective From</label>
                <input name="effectiveFrom" type="date" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Effective To</label>
                <input name="effectiveTo" type="date" required className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Retention Limit (OMR)</label>
              <input name="retentionLimit" type="number" step="0.001" placeholder="50000" required className={inputClass} />
            </div>
            <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Create Treaty</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Participant Dialog */}
      <Dialog open={participantDialog} onOpenChange={setParticipantDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Treaty Participant</DialogTitle></DialogHeader>
          <form onSubmit={handleAddParticipant} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Treaty</label>
              <select name="treatyCode" required className={inputClass}>
                <option value="">Select Treaty...</option>
                {treaties.map(t => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Reinsurer</label>
              <select name="reinsurerCode" required className={inputClass}>
                <option value="">Select Reinsurer...</option>
                {reinsurers.filter(r => r.status === 'Active').map(r => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Share %</label>
              <input name="sharePct" type="number" min="0.01" max="100" step="0.01" placeholder="50" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Liability (OMR)</label>
              <input name="maxLiability" type="number" step="0.001" placeholder="500000" required className={inputClass} />
            </div>
            <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Add Participant</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
