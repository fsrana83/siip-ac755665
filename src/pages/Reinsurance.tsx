import { useState, useMemo } from 'react';
import { mockReinsurance, ReinsuranceCession } from '@/lib/mockData';
import { Search, Plus, AlertTriangle, ShieldCheck, Pencil, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { useData } from '@/contexts/DataContext';
import { computeCapacityStatuses } from '@/lib/capacityUtils';

const statusStyles: Record<string, string> = {
  Active: 'status-active',
  Settled: 'status-pending',
  Void: 'status-draft',
};

const Reinsurance = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<ReinsuranceCession[]>(mockReinsurance);
  const [open, setOpen] = useState(false);
  const [selectedTreatyCode, setSelectedTreatyCode] = useState('');
  const { toast } = useToast();
  const { reinsurers, treaties, participants } = useConfig();
  const { policies } = useData();

  const policyClientMap = useMemo(
    () => Object.fromEntries(policies.map(p => [p.policyNo, p.policyHolder || p.clientName])),
    [policies],
  );

  const capacityStatuses = useMemo(
    () => computeCapacityStatuses(treaties, data, policyClientMap),
    [treaties, data, policyClientMap],
  );

  const exceedances = capacityStatuses.filter(c => c.exceeded);
  const warnings = capacityStatuses.filter(c => c.warning && !c.exceeded);

  const selectedTreaty = treaties.find(t => t.code === selectedTreatyCode);
  const selectedTreatyParticipants = participants.filter(p => p.treatyCode === selectedTreatyCode);

  const filtered = data.filter(r =>
    r.cessionRef.toLowerCase().includes(search.toLowerCase()) ||
    r.reinsurer.toLowerCase().includes(search.toLowerCase()) ||
    r.policyNo.toLowerCase().includes(search.toLowerCase()) ||
    r.treatyName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const treatyCode = fd.get('treatyCode') as string;
    const treaty = treaties.find(t => t.code === treatyCode);
    const reinsurerCode = fd.get('reinsurerCode') as string;
    const reinsurer = reinsurers.find(r => r.code === reinsurerCode);
    if (!treaty || !reinsurer) return;

    const cededSA = Number(fd.get('cededSA'));
    const cededPremium = Number(fd.get('cededPremium'));
    const retentionPct = Number(fd.get('retentionPct'));

    // Capacity validation
    const currentUsed = data.filter(c => c.treatyName === treaty.name && c.status === 'Active')
      .reduce((s, c) => s + c.cededSA, 0);
    const wouldExceed = currentUsed + cededSA > treaty.treatyCapacity;

    const newItem: ReinsuranceCession = {
      id: String(data.length + 1),
      cessionRef: `RI-${new Date().getFullYear()}-${String(data.length + 1).padStart(4, '0')}`,
      policyNo: fd.get('policyNo') as string,
      reinsurer: reinsurer.name,
      treatyName: treaty.name,
      cededPremium,
      cededSA,
      retentionPct,
      cessionPct: 100 - retentionPct,
      status: 'Active',
      effectiveDate: new Date().toISOString().split('T')[0],
    };
    setData([...data, newItem]);
    setOpen(false);
    setSelectedTreatyCode('');
    if (wouldExceed) {
      toast({
        title: 'Cession created — capacity exceeded',
        description: `${newItem.cessionRef} pushes ${treaty.name} above its capacity of OMR ${treaty.treatyCapacity.toLocaleString()}.`,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Cession created', description: `${newItem.cessionRef} added successfully` });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reinsurance</h1>
          <p className="text-sm text-muted-foreground mt-1">RI register linked to treaties &amp; reinsurers from Setup</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedTreatyCode(''); }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all glow-border">
              <Plus className="w-4 h-4" /> New Cession
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Reinsurance Cession</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Policy No</label>
                <select name="policyNo" required className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm">
                  <option value="">Select policy...</option>
                  {policies.map(p => (
                    <option key={p.policyNo} value={p.policyNo}>{p.policyNo} — {p.policyHolder || p.clientName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Treaty</label>
                <select name="treatyCode" required value={selectedTreatyCode}
                  onChange={(e) => setSelectedTreatyCode(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm">
                  <option value="">Select treaty...</option>
                  {treaties.filter(t => t.status === 'Active').map(t => (
                    <option key={t.code} value={t.code}>{t.code} — {t.name} ({t.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Reinsurer</label>
                <select name="reinsurerCode" required className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm">
                  <option value="">Select reinsurer...</option>
                  {(selectedTreatyCode
                    ? selectedTreatyParticipants.map(p => reinsurers.find(r => r.code === p.reinsurerCode)).filter(Boolean)
                    : reinsurers.filter(r => r.status === 'Active')
                  ).map(r => (
                    <option key={r!.code} value={r!.code}>{r!.code} — {r!.name}</option>
                  ))}
                </select>
                {selectedTreatyCode && selectedTreatyParticipants.length === 0 && (
                  <p className="text-xs text-warning mt-1">No participants configured for this treaty.</p>
                )}
              </div>
              {selectedTreaty && (
                <div className="text-xs bg-muted/30 p-2 rounded border border-border/50">
                  <div className="flex justify-between"><span className="text-muted-foreground">Capacity:</span><span className="font-medium">OMR {selectedTreaty.treatyCapacity.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Retention:</span><span className="font-medium">OMR {selectedTreaty.retentionLimit.toLocaleString()}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ceded Premium (OMR)</label>
                  <input name="cededPremium" type="number" step="0.001" required className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ceded SA (OMR)</label>
                  <input name="cededSA" type="number" step="0.001" required className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Retention %</label>
                <input name="retentionPct" type="number" min="0" max="100" defaultValue="50" required className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">Create Cession</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Capacity Alerts */}
      {(exceedances.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {exceedances.map(c => (
            <div key={c.treatyCode} className="p-4 rounded-lg border border-destructive/40 bg-destructive/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Capacity exceeded — {c.treatyName} ({c.treatyType})</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used OMR {c.used.toLocaleString()} / Capacity OMR {c.capacity.toLocaleString()} ({c.utilizationPct.toFixed(1)}%)
                </p>
                {c.exceedingClients.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Affected clients: {c.exceedingClients.map(x => `${x.clientName} (${x.policyNo})`).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
          {warnings.map(c => (
            <div key={c.treatyCode} className="p-3 rounded-lg border border-warning/40 bg-warning/10 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">{c.treatyName}</span> — utilization {c.utilizationPct.toFixed(1)}% (OMR {c.used.toLocaleString()} / {c.capacity.toLocaleString()})
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Cessions</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {data.reduce((s, r) => s + r.cededPremium, 0).toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">Ceded Premium</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-display font-bold text-foreground">OMR {data.reduce((s, r) => s + r.cededSA, 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Ceded Sum Assured</p>
        </div>
        <div className="stat-card">
          <p className={`text-xl font-display font-bold ${exceedances.length ? 'text-destructive' : 'text-success'}`}>
            {exceedances.length}
          </p>
          <p className="text-xs text-muted-foreground">Treaties Over Capacity</p>
        </div>
      </div>

      {/* Treaty Capacity Utilization */}
      <div className="glass-card">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Treaty Capacity Utilization</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Treaty</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Capacity (OMR)</th>
                <th className="text-right px-4 py-3">Used (OMR)</th>
                <th className="text-left px-4 py-3 w-1/3">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {capacityStatuses.map(c => (
                <tr key={c.treatyCode} className={`border-b border-border/30 ${c.exceeded ? 'bg-destructive/5' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {c.treatyCode} <span className="text-muted-foreground">— {c.treatyName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.treatyType}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{c.capacity.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${c.exceeded ? 'text-destructive' : 'text-foreground'}`}>
                    {c.used.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${c.exceeded ? 'bg-destructive' : c.warning ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${c.exceeded ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {c.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cession Register */}
      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search cessions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Cession Ref</th>
                <th className="text-left px-4 py-3">Policy</th>
                <th className="text-left px-4 py-3">Reinsurer</th>
                <th className="text-left px-4 py-3">Treaty</th>
                <th className="text-right px-4 py-3">Ceded Premium</th>
                <th className="text-right px-4 py-3">Ceded SA</th>
                <th className="text-right px-4 py-3">Retention %</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const treatyCap = capacityStatuses.find(c => c.treatyName === r.treatyName);
                const isExceedingTreaty = treatyCap?.exceeded;
                return (
                  <tr key={r.id} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${isExceedingTreaty ? 'bg-destructive/5' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-primary">{r.cessionRef}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {r.policyNo}
                      {policyClientMap[r.policyNo] && (
                        <span className="block text-xs text-muted-foreground/70">{policyClientMap[r.policyNo]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.reinsurer}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {r.treatyName}
                      {isExceedingTreaty && <AlertTriangle className="inline w-3 h-3 text-destructive ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">OMR {r.cededPremium.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">OMR {r.cededSA.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">{r.retentionPct}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.effectiveDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reinsurance;
