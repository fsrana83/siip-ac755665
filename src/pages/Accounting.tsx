import { Landmark } from 'lucide-react';

const Accounting = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">Accounting & GL</h1>
      <p className="text-sm text-muted-foreground mt-1">General ledger, voucher templates, and journal entries</p>
    </div>
    <div className="glass-card p-8 text-center">
      <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Accounting module — GL accounts, voucher templates, and journal entries will appear here.</p>
    </div>
  </div>
);

export default Accounting;
