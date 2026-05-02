import { useState } from 'react';
import { Client } from '@/lib/types';
import { Search, Plus, UserCheck, Clock, Shield, FileCheck, Globe, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

const kycStyles: Record<string, string> = {
  Approved: 'status-active',
  Pending: 'status-pending',
  Rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
};

interface ComplianceChecklist {
  idVerified: boolean;
  addressVerified: boolean;
  pepScreening: boolean;
  sanctionsCheck: boolean;
  sourceOfFunds: boolean;
  amlRiskRating: 'Low' | 'Medium' | 'High' | '';
  crsReportable: boolean;
  crsTinProvided: boolean;
  crsCountry: string;
  fatcaStatus: 'N/A' | 'US Person' | 'Non-US' | '';
  notes: string;
}

const defaultChecklist: ComplianceChecklist = {
  idVerified: false, addressVerified: false, pepScreening: false,
  sanctionsCheck: false, sourceOfFunds: false, amlRiskRating: '',
  crsReportable: false, crsTinProvided: false, crsCountry: '',
  fatcaStatus: '', notes: '',
};

const Clients = () => {
  const [search, setSearch] = useState('');
  const { clients, setClients } = useData();
  const [open, setOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [checklist, setChecklist] = useState<ComplianceChecklist>(defaultChecklist);
  const { toast } = useToast();

  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.idNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newClient: Client = {
      clientId: `C${String(clients.length + 1).padStart(3, '0')}`,
      fullName: fd.get('fullName') as string, gender: fd.get('gender') as string,
      dob: fd.get('dob') as string, nationality: fd.get('nationality') as string,
      idType: fd.get('idType') as string, idNumber: fd.get('idNumber') as string,
      phone: fd.get('phone') as string, email: fd.get('email') as string, kycStatus: 'Pending',
    };
    setClients(prev => [...prev, newClient]);
    setOpen(false);
    toast({ title: 'Client added', description: `${newClient.fullName} registered with KYC Pending` });
  };

  const openKycDialog = (client: Client) => {
    setSelectedClient(client);
    setChecklist(defaultChecklist);
    setKycOpen(true);
  };

  const handleKycDecision = (decision: 'Approved' | 'Rejected') => {
    if (!selectedClient) return;
    setClients(prev => prev.map(c => c.clientId === selectedClient.clientId ? { ...c, kycStatus: decision } : c));
    setKycOpen(false);
    toast({ title: `KYC ${decision}`, description: `${selectedClient.fullName} — ${decision}` });
  };

  const allChecksComplete = checklist.idVerified && checklist.addressVerified && checklist.pepScreening &&
    checklist.sanctionsCheck && checklist.sourceOfFunds && checklist.amlRiskRating && checklist.fatcaStatus;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clients & KYC</h1>
          <p className="text-sm text-muted-foreground mt-1">Client register, KYC/AML, CRS & FATCA compliance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Client
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                <input name="fullName" type="text" placeholder="Ahmed Al Balushi" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                <select name="gender" defaultValue="Male"
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Date of Birth</label>
                <input name="dob" type="date" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nationality</label>
                <select name="nationality" defaultValue="Omani"
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
                <select name="idType" defaultValue="National ID"
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Resident Card">Resident Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ID Number</label>
                <input name="idNumber" type="text" placeholder="12345678" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                <input name="phone" type="text" placeholder="+968 9123 4567" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input name="email" type="email" placeholder="name@email.com" required
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="col-span-2">
                <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Add Client</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KYC/AML/CRS Dialog */}
      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> KYC / AML / CRS Compliance — {selectedClient?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* KYC Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> KYC Checks</h3>
              <div className="grid grid-cols-1 gap-2 p-4 bg-muted/30 border border-border rounded-lg">
                {[
                  { key: 'idVerified', label: 'ID Document Verified (Original sighted)' },
                  { key: 'addressVerified', label: 'Proof of Address Verified' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={(checklist as any)[item.key]}
                      onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AML Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> AML Screening</h3>
              <div className="grid grid-cols-1 gap-2 p-4 bg-muted/30 border border-border rounded-lg">
                {[
                  { key: 'pepScreening', label: 'PEP (Politically Exposed Person) Screening Completed' },
                  { key: 'sanctionsCheck', label: 'Sanctions & Watchlist Check Completed' },
                  { key: 'sourceOfFunds', label: 'Source of Funds / Wealth Verified' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={(checklist as any)[item.key]}
                      onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </label>
                ))}
                <div className="pt-2">
                  <label className="block text-xs text-muted-foreground mb-1">AML Risk Rating</label>
                  <select value={checklist.amlRiskRating} onChange={e => setChecklist(prev => ({ ...prev, amlRiskRating: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Select —</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CRS / FATCA Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> CRS / FATCA</h3>
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">FATCA Status</label>
                  <select value={checklist.fatcaStatus} onChange={e => setChecklist(prev => ({ ...prev, fatcaStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Select —</option>
                    <option value="N/A">N/A</option>
                    <option value="US Person">US Person</option>
                    <option value="Non-US">Non-US Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">CRS Reportable Country</label>
                  <input type="text" value={checklist.crsCountry} placeholder="e.g. Oman"
                    onChange={e => setChecklist(prev => ({ ...prev, crsCountry: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checklist.crsReportable}
                    onChange={e => setChecklist(prev => ({ ...prev, crsReportable: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                  <span className="text-sm text-foreground">CRS Reportable</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checklist.crsTinProvided}
                    onChange={e => setChecklist(prev => ({ ...prev, crsTinProvided: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                  <span className="text-sm text-foreground">TIN Provided</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Compliance Notes</label>
              <textarea value={checklist.notes} onChange={e => setChecklist(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional compliance notes..."
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]" />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => handleKycDecision('Approved')} disabled={!allChecksComplete}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                <CheckCircle className="w-4 h-4" /> Approve KYC
              </button>
              <button onClick={() => handleKycDecision('Rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:bg-destructive/90">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: UserCheck, color: 'text-primary' },
          { label: 'KYC Approved', value: clients.filter(c => c.kycStatus === 'Approved').length, icon: UserCheck, color: 'text-success' },
          { label: 'KYC Pending', value: clients.filter(c => c.kycStatus === 'Pending').length, icon: Clock, color: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Gender</th>
                <th className="text-left px-4 py-3">DOB</th>
                <th className="text-left px-4 py-3">Nationality</th>
                <th className="text-left px-4 py-3">ID Number</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">KYC Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.clientId} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{c.fullName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.gender}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.dob}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.nationality}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.idNumber}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${kycStyles[c.kycStatus]}`}>{c.kycStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openKycDialog(c)}
                      className="px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                      KYC Review
                    </button>
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

export default Clients;
