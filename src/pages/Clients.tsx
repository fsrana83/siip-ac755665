import { useState } from 'react';
import { mockClients } from '@/lib/mockData';
import { Client } from '@/lib/types';
import { Search, Plus, UserCheck, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const kycStyles: Record<string, string> = {
  Approved: 'status-active',
  Pending: 'status-pending',
  Rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Clients = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Client[]>(mockClients);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const filtered = data.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.idNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newClient: Client = {
      clientId: `C${String(data.length + 1).padStart(3, '0')}`,
      fullName: fd.get('fullName') as string,
      gender: fd.get('gender') as string,
      dob: fd.get('dob') as string,
      nationality: fd.get('nationality') as string,
      idType: fd.get('idType') as string,
      idNumber: fd.get('idNumber') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      kycStatus: 'Pending',
    };
    setData([...data, newClient]);
    setOpen(false);
    toast({ title: 'Client added', description: `${newClient.fullName} registered with KYC Pending` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clients & KYC</h1>
          <p className="text-sm text-muted-foreground mt-1">Client register, KYC/AML, and FATCA compliance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Client
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'fullName', label: 'Full Name', placeholder: 'Ahmed Al Balushi' },
                { name: 'gender', label: 'Gender', placeholder: 'Male / Female' },
                { name: 'dob', label: 'Date of Birth', type: 'date' },
                { name: 'nationality', label: 'Nationality', placeholder: 'Omani' },
                { name: 'idType', label: 'ID Type', placeholder: 'National ID / Passport' },
                { name: 'idNumber', label: 'ID Number', placeholder: '12345678' },
                { name: 'phone', label: 'Phone', placeholder: '+968 9123 4567' },
                { name: 'email', label: 'Email', placeholder: 'name@email.com', type: 'email' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Add Client</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: data.length, icon: UserCheck, color: 'text-primary' },
          { label: 'KYC Approved', value: data.filter(c => c.kycStatus === 'Approved').length, icon: UserCheck, color: 'text-success' },
          { label: 'KYC Pending', value: data.filter(c => c.kycStatus === 'Pending').length, icon: Clock, color: 'text-warning' },
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
