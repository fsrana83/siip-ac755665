import { useState } from 'react';
import { mockJournalEntries, JournalEntry } from '@/lib/mockData';
import { Landmark, Search, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<string, string> = {
  Posted: 'status-active',
  Draft: 'status-draft',
  Reversed: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const Accounting = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<JournalEntry[]>(mockJournalEntries);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const filtered = data.filter(j =>
    j.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase()) ||
    j.account.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebit = data.reduce((s, j) => s + j.debit, 0);
  const totalCredit = data.reduce((s, j) => s + j.credit, 0);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newEntry: JournalEntry = {
      id: String(data.length + 1),
      voucherNo: `JV-2026-${String(data.length + 1).padStart(4, '0')}`,
      date: fd.get('date') as string,
      description: fd.get('description') as string,
      account: fd.get('account') as string,
      debit: Number(fd.get('debit') || 0),
      credit: Number(fd.get('credit') || 0),
      reference: fd.get('reference') as string,
      status: 'Draft',
    };
    setData([...data, newEntry]);
    setOpen(false);
    toast({ title: 'Journal entry created', description: `${newEntry.voucherNo} added as Draft` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Accounting & GL</h1>
          <p className="text-sm text-muted-foreground mt-1">General ledger, voucher templates, and journal entries</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Journal Entry
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'date', label: 'Date', type: 'date' },
                { name: 'description', label: 'Description', placeholder: 'Premium received...' },
                { name: 'account', label: 'GL Account', placeholder: 'Premium Income' },
                { name: 'debit', label: 'Debit (OMR)', placeholder: '0.000', type: 'number' },
                { name: 'credit', label: 'Credit (OMR)', placeholder: '0.000', type: 'number' },
                { name: 'reference', label: 'Reference', placeholder: 'PL-2026-0001' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} required={f.name !== 'debit' && f.name !== 'credit'} step={f.type === 'number' ? '0.001' : undefined}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Create Entry</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">{data.length}</p>
          <p className="text-xs text-muted-foreground">Journal Entries</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {totalDebit.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">Total Debits</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {totalCredit.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">Total Credits</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search journal entries..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Voucher No</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Account</th>
                <th className="text-right px-4 py-3">Debit</th>
                <th className="text-right px-4 py-3">Credit</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{j.voucherNo}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{j.date}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{j.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{j.account}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{j.debit > 0 ? `OMR ${j.debit.toFixed(3)}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{j.credit > 0 ? `OMR ${j.credit.toFixed(3)}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{j.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[j.status]}`}>{j.status}</span>
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

export default Accounting;
