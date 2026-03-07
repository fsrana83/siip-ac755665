import { Building2 } from 'lucide-react';

const Reinsurance = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">Reinsurance</h1>
      <p className="text-sm text-muted-foreground mt-1">RI register and cession distribution</p>
    </div>
    <div className="glass-card p-8 text-center">
      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">No reinsurance cessions yet. Cessions are auto-created when policies are issued.</p>
    </div>
  </div>
);

export default Reinsurance;
