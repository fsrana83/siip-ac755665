import { useState } from 'react';
import { mockQuotations } from '@/lib/mockData';
import { Quotation } from '@/lib/types';
import { Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  Draft: 'status-draft',
  Converted: 'status-active',
};

const Quotations = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Quotation[]>(mockQuotations);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const filtered = data.filter(q =>
    q.clientName.toLowerCase().includes(search.toLowerCase()) ||
    q.quotRef.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newQ: Quotation = {
      id: String(data.length + 1),
      quotRef: `QT-2026-${String(data.length + 1).padStart(4, '0')}`,
      clientName: fd.get('clientName') as string,
      productName: fd.get('productName') as string,
      sumAssured: Number(fd.get('sumAssured')),
      totalPremium: Number(fd.get('totalPremium')),
      status: 'Draft',
      createdBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setData([...data, newQ]);
    setOpen(false);
    toast({ title: 'Quotation created', description: `${newQ.quotRef} for ${newQ.clientName}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage premium quotations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Quotation
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'clientName', label: 'Client Name', placeholder: 'Ahmed Al Balushi' },
                { name: 'productName', label: 'Product', placeholder: 'Term Life - Level' },
                { name: 'sumAssured', label: 'Sum Assured (OMR)', placeholder: '100000', type: 'number' },
                { name: 'totalPremium', label: 'Total Premium (OMR)', placeholder: '132.375', type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required step={f.type === 'number' ? '0.001' : undefined}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Create Quotation</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                <th className="text-right px-4 py-3">Premium</th>
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
