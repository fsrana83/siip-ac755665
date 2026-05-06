import { useState } from 'react';
import { z } from 'zod';
import { Client } from '@/lib/types';
import { Search, Plus, UserCheck, Clock, Shield, FileCheck, Globe, CheckCircle, XCircle, Pencil, Eye, User, Mail, Phone, Calendar, IdCard, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

const kycStyles: Record<string, string> = {
  Approved: 'status-active',
  Pending: 'status-pending',
  Rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const NATIONALITIES = ['Omani','Emirati','Saudi','Bahraini','Kuwaiti','Qatari','Indian','Pakistani','Bangladeshi','Filipino','Egyptian','Jordanian','British','American','Other'];
const ID_TYPES = ['National ID', 'Passport', 'Resident Card'];

// Validation schema — matches Quotations New Client + length & format limits
const clientSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  gender: z.enum(['Male', 'Female'], { errorMap: () => ({ message: 'Select a gender' }) }),
  dob: z.string().trim().min(1, 'Date of birth is required').refine(v => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && d < new Date();
  }, 'Date of birth must be in the past'),
  nationality: z.string().trim().min(1, 'Nationality is required').max(50),
  idType: z.string().trim().min(1, 'ID type is required'),
  idNumber: z.string().trim().min(4, 'ID number must be at least 4 characters').max(30, 'ID number too long')
    .regex(/^[A-Za-z0-9-]+$/, 'ID number may only contain letters, numbers and dashes'),
  phone: z.string().trim().min(7, 'Phone too short').max(20, 'Phone too long')
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Invalid email address').max(255),
});

interface ClientForm {
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
}
type FieldErrors = Partial<Record<keyof ClientForm, string>>;

const emptyForm: ClientForm = {
  fullName: '', gender: 'Male', dob: '', nationality: 'Omani',
  idType: 'National ID', idNumber: '', phone: '', email: '',
};

interface ComplianceChecklist {
  idVerified: boolean; addressVerified: boolean; pepScreening: boolean;
  sanctionsCheck: boolean; sourceOfFunds: boolean;
  amlRiskRating: 'Low' | 'Medium' | 'High' | '';
  crsReportable: boolean; crsTinProvided: boolean; crsCountry: string;
  fatcaStatus: 'N/A' | 'US Person' | 'Non-US' | ''; notes: string;
}

const defaultChecklist: ComplianceChecklist = {
  idVerified: false, addressVerified: false, pepScreening: false,
  sanctionsCheck: false, sourceOfFunds: false, amlRiskRating: '',
  crsReportable: false, crsTinProvided: false, crsCountry: '',
  fatcaStatus: '', notes: '',
};

// Reusable input/select styling
const inputBase = 'w-full px-3 py-2 bg-muted/50 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2';
const okRing = 'border-border focus:ring-primary/50';
const errRing = 'border-destructive/60 focus:ring-destructive/50';
const selectBase = 'w-full px-3 py-2.5 bg-muted/50 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2';

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

const DetailItem = ({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-sm text-foreground break-words ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  </div>
);

interface ClientFormFieldsProps {
  values: ClientForm;
  errors: FieldErrors;
  onChange: <K extends keyof ClientForm>(k: K, v: ClientForm[K]) => void;
}

const ClientFormFields = ({ values, errors, onChange }: ClientFormFieldsProps) => (
  <>
    <div className="col-span-2">
      <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
      <input type="text" placeholder="Ahmed Al Balushi" value={values.fullName}
        onChange={e => onChange('fullName', e.target.value)} maxLength={100}
        className={`${inputBase} ${errors.fullName ? errRing : okRing}`} />
      <FieldError msg={errors.fullName} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Gender</label>
      <select value={values.gender} onChange={e => onChange('gender', e.target.value as 'Male' | 'Female')}
        className={`${selectBase} ${errors.gender ? errRing : okRing}`}>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <FieldError msg={errors.gender} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Date of Birth</label>
      <input type="date" value={values.dob} onChange={e => onChange('dob', e.target.value)}
        className={`${inputBase} ${errors.dob ? errRing : okRing}`} />
      <FieldError msg={errors.dob} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Nationality</label>
      <select value={values.nationality} onChange={e => onChange('nationality', e.target.value)}
        className={`${selectBase} ${errors.nationality ? errRing : okRing}`}>
        {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <FieldError msg={errors.nationality} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">ID Type</label>
      <select value={values.idType} onChange={e => onChange('idType', e.target.value)}
        className={`${selectBase} ${errors.idType ? errRing : okRing}`}>
        {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <FieldError msg={errors.idType} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">ID Number</label>
      <input type="text" placeholder="12345678" value={values.idNumber}
        onChange={e => onChange('idNumber', e.target.value)} maxLength={30}
        className={`${inputBase} ${errors.idNumber ? errRing : okRing}`} />
      <FieldError msg={errors.idNumber} />
    </div>
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Phone</label>
      <input type="text" placeholder="+968 9123 4567" value={values.phone}
        onChange={e => onChange('phone', e.target.value)} maxLength={20}
        className={`${inputBase} ${errors.phone ? errRing : okRing}`} />
      <FieldError msg={errors.phone} />
    </div>
    <div className="col-span-2">
      <label className="block text-xs text-muted-foreground mb-1">Email</label>
      <input type="email" placeholder="name@email.com" value={values.email}
        onChange={e => onChange('email', e.target.value)} maxLength={255}
        className={`${inputBase} ${errors.email ? errRing : okRing}`} />
      <FieldError msg={errors.email} />
    </div>
  </>
);

const Clients = () => {
  const [search, setSearch] = useState('');
  const { clients, setClients } = useData();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ComplianceChecklist>(defaultChecklist);

  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [editForm, setEditForm] = useState<ClientForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});

  const { toast } = useToast();

  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.idNumber.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (data: ClientForm): FieldErrors => {
    const result = clientSchema.safeParse(data);
    if (result.success) return {};
    const fe: FieldErrors = {};
    for (const issue of result.error.issues) {
      const k = issue.path[0] as keyof ClientForm;
      if (!fe[k]) fe[k] = issue.message;
    }
    return fe;
  };

  // Add handlers
  const handleFormChange = <K extends keyof ClientForm>(k: K, v: ClientForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fe = validate(form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    // Duplicate ID check
    if (clients.some(c => c.idNumber.trim().toLowerCase() === form.idNumber.trim().toLowerCase())) {
      setErrors({ idNumber: 'A client with this ID number already exists' });
      return;
    }

    const newClient: Client = {
      clientId: `C${String(clients.length + 1).padStart(3, '0')}`,
      ...form, kycStatus: 'Pending',
    };
    setClients(prev => [...prev, newClient]);
    setForm(emptyForm); setErrors({}); setOpen(false);
    toast({ title: 'Client added', description: `${newClient.fullName} registered with KYC Pending` });
  };

  // Edit handlers
  const openEditDialog = (c: Client) => {
    setEditingClientId(c.clientId);
    setEditForm({
      fullName: c.fullName,
      gender: (c.gender === 'Female' ? 'Female' : 'Male'),
      dob: c.dob, nationality: c.nationality,
      idType: c.idType, idNumber: c.idNumber,
      phone: c.phone, email: c.email,
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const handleEditFormChange = <K extends keyof ClientForm>(k: K, v: ClientForm[K]) => {
    setEditForm(prev => ({ ...prev, [k]: v }));
    if (editErrors[k]) setEditErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClientId) return;
    const fe = validate(editForm);
    setEditErrors(fe);
    if (Object.keys(fe).length > 0) return;

    if (clients.some(c => c.clientId !== editingClientId &&
      c.idNumber.trim().toLowerCase() === editForm.idNumber.trim().toLowerCase())) {
      setEditErrors({ idNumber: 'A client with this ID number already exists' });
      return;
    }

    setClients(prev => prev.map(c => c.clientId === editingClientId ? { ...c, ...editForm } : c));
    setEditOpen(false);
    toast({ title: 'Client updated', description: `${editForm.fullName} details saved` });
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
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setErrors({}); } }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Client
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} noValidate className="grid grid-cols-2 gap-3">
              <ClientFormFields values={form} errors={errors} onChange={handleFormChange} />
              <div className="col-span-2">
                <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Add Client</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditingClientId(null); setEditErrors({}); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} noValidate className="grid grid-cols-2 gap-3">
            <ClientFormFields values={editForm} errors={editErrors} onChange={handleEditFormChange} />
            <div className="col-span-2 flex gap-3">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted/50">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) setDetailsClient(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Client Details
            </DialogTitle>
          </DialogHeader>
          {detailsClient && (
            <div className="space-y-5">
              {/* Header card */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-lg">
                    {detailsClient.fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{detailsClient.fullName}</p>
                    <p className="text-xs text-muted-foreground">Client ID: {detailsClient.clientId}</p>
                  </div>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${kycStyles[detailsClient.kycStatus]}`}>
                  KYC {detailsClient.kycStatus}
                </span>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                  <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Gender" value={detailsClient.gender} />
                  <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date of Birth" value={detailsClient.dob} />
                  <DetailItem icon={<Flag className="w-3.5 h-3.5" />} label="Nationality" value={detailsClient.nationality} />
                  <DetailItem icon={<IdCard className="w-3.5 h-3.5" />} label="ID Type" value={detailsClient.idType} />
                  <DetailItem icon={<IdCard className="w-3.5 h-3.5" />} label="ID Number" value={detailsClient.idNumber} mono />
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                  <DetailItem icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={detailsClient.phone} />
                  <DetailItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={detailsClient.email} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setDetailsOpen(false); openEditDialog(detailsClient); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted/50">
                  <Pencil className="w-4 h-4" /> Edit Client
                </button>
                <button onClick={() => { setDetailsOpen(false); openKycDialog(detailsClient); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">
                  <Shield className="w-4 h-4" /> KYC Review
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Compliance Notes</label>
              <textarea value={checklist.notes} onChange={e => setChecklist(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional compliance notes..."
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]" />
            </div>

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
                <th className="text-left px-4 py-3">ID Type</th>
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
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.idType}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.idNumber}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${kycStyles[c.kycStatus]}`}>{c.kycStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setDetailsClient(c); setDetailsOpen(true); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="View details">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button onClick={() => openEditDialog(c)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="Edit client">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => openKycDialog(c)}
                        className="px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                        KYC Review
                      </button>
                    </div>
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
