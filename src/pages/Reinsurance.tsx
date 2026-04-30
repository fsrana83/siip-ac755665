import { useState, useMemo } from 'react';
import { mockReinsurance, ReinsuranceCession } from '@/lib/mockData';
import { Search, Plus, AlertTriangle, ShieldCheck, Pencil, Check, X, Trash2, History, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { computeCapacityStatuses } from '@/lib/capacityUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { reinsurers, treaties, setTreaties, participants, treatyAuditLog, addTreatyAudit } = useConfig();
  const { policies } = useData();
  const { user } = useAuth();
  const [editingTreatyId, setEditingTreatyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ treatyCapacity: number; effectiveFrom: string; effectiveTo: string }>({ treatyCapacity: 0, effectiveFrom: '', effectiveTo: '' });
  const [deleteTreatyId, setDeleteTreatyId] = useState<string | null>(null);
  // Audit log filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTreatyCode, setAuditTreatyCode] = useState<string>('all');
  const [auditAction, setAuditAction] = useState<'all' | 'Update' | 'Delete'>('all');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');

  const actor = user?.fullName || user?.username || 'System';

  const startEdit = (treatyCode: string) => {
    const t = treaties.find(x => x.code === treatyCode);
    if (!t) return;
    setEditingTreatyId(t.id);
    setEditForm({ treatyCapacity: t.treatyCapacity, effectiveFrom: t.effectiveFrom, effectiveTo: t.effectiveTo });
  };

  const cancelEdit = () => setEditingTreatyId(null);

  // Returns true if [aFrom,aTo] overlaps [bFrom,bTo]
  const datesOverlap = (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
    aFrom <= bTo && bFrom <= aTo;

  const saveEdit = () => {
    if (!editingTreatyId) return;
    const original = treaties.find(t => t.id === editingTreatyId);
    if (!original) return;

    if (editForm.treatyCapacity < 0 || !editForm.effectiveFrom || !editForm.effectiveTo) {
      toast({ title: 'Invalid input', description: 'Capacity must be ≥ 0 and dates required.', variant: 'destructive' });
      return;
    }
    if (editForm.effectiveTo < editForm.effectiveFrom) {
      toast({ title: 'Invalid dates', description: 'Effective To must be after Effective From.', variant: 'destructive' });
      return;
    }

    // Overlap check: same treaty code, different id
    const conflict = treaties.find(t =>
      t.code === original.code &&
      t.id !== original.id &&
      datesOverlap(editForm.effectiveFrom, editForm.effectiveTo, t.effectiveFrom, t.effectiveTo),
    );
    if (conflict) {
      toast({
        title: 'Date range overlaps',
        description: `Overlaps existing period ${conflict.effectiveFrom} → ${conflict.effectiveTo} for treaty ${conflict.code}.`,
        variant: 'destructive',
      });
      return;
    }

    const changes: { field: string; from: string | number; to: string | number }[] = [];
    if (original.treatyCapacity !== editForm.treatyCapacity) {
      changes.push({ field: 'treatyCapacity', from: original.treatyCapacity, to: editForm.treatyCapacity });
    }
    if (original.effectiveFrom !== editForm.effectiveFrom) {
      changes.push({ field: 'effectiveFrom', from: original.effectiveFrom, to: editForm.effectiveFrom });
    }
    if (original.effectiveTo !== editForm.effectiveTo) {
      changes.push({ field: 'effectiveTo', from: original.effectiveTo, to: editForm.effectiveTo });
    }

    setTreaties(prev => prev.map(t => t.id === editingTreatyId
      ? { ...t, treatyCapacity: editForm.treatyCapacity, effectiveFrom: editForm.effectiveFrom, effectiveTo: editForm.effectiveTo }
      : t));

    if (changes.length > 0) {
      addTreatyAudit({
        treatyId: original.id,
        treatyCode: original.code,
        treatyName: original.name,
        action: 'Update',
        changedBy: actor,
        changes,
      });
    }

    toast({ title: 'Treaty updated', description: 'Capacity and effective dates saved.' });
    setEditingTreatyId(null);
  };

  const confirmDelete = () => {
    if (!deleteTreatyId) return;
    const t = treaties.find(x => x.id === deleteTreatyId);
    if (!t) return;

    const activeCessions = data.filter(c => c.treatyName === t.name && c.status === 'Active');
    if (activeCessions.length > 0) {
      toast({
        title: 'Cannot delete treaty',
        description: `${activeCessions.length} active cession(s) reference ${t.name}. Void or reassign them first.`,
        variant: 'destructive',
      });
      setDeleteTreatyId(null);
      return;
    }

    setTreaties(prev => prev.filter(x => x.id !== deleteTreatyId));
    addTreatyAudit({
      treatyId: t.id,
      treatyCode: t.code,
      treatyName: t.name,
      action: 'Delete',
      changedBy: actor,
      changes: [
        { field: 'treatyCapacity', from: t.treatyCapacity, to: '—' },
        { field: 'effectiveFrom', from: t.effectiveFrom, to: '—' },
        { field: 'effectiveTo', from: t.effectiveTo, to: '—' },
      ],
    });
    if (editingTreatyId === t.id) setEditingTreatyId(null);
    toast({ title: 'Treaty deleted', description: `${t.code} — ${t.name} removed.` });
    setDeleteTreatyId(null);
  };

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

  // Active cessions per treaty name (used to disable delete)
  const activeCessionsByTreatyName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of data) {
      if (c.status === 'Active') map[c.treatyName] = (map[c.treatyName] || 0) + 1;
    }
    return map;
  }, [data]);

  const filteredAuditLog = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return treatyAuditLog.filter(e => {
      if (auditTreatyCode !== 'all' && e.treatyCode !== auditTreatyCode) return false;
      if (auditAction !== 'all' && e.action !== auditAction) return false;
      if (auditDateFrom && e.changedAt.slice(0, 10) < auditDateFrom) return false;
      if (auditDateTo && e.changedAt.slice(0, 10) > auditDateTo) return false;
      if (q) {
        const hay = `${e.treatyCode} ${e.treatyName} ${e.changedBy} ${e.action} ${e.changes.map(c => `${c.field} ${c.from} ${c.to}`).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [treatyAuditLog, auditSearch, auditTreatyCode, auditAction, auditDateFrom, auditDateTo]);

  const auditTreatyCodes = useMemo(
    () => Array.from(new Set(treatyAuditLog.map(e => e.treatyCode))).sort(),
    [treatyAuditLog],
  );

  const formatChanges = (changes: { field: string; from: string | number; to: string | number }[]) =>
    changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join('; ');

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'User', 'Treaty Code', 'Treaty Name', 'Action', 'Changes'];
    const rows = filteredAuditLog.map(e => [
      new Date(e.changedAt).toISOString(),
      e.changedBy,
      e.treatyCode,
      e.treatyName,
      e.action,
      formatChanges(e.changes),
    ]);
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treaty-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filteredAuditLog.length} audit entries exported as CSV.` });
  };

  const exportAuditPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Treaty Audit Log', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} • ${filteredAuditLog.length} entries`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Timestamp', 'User', 'Treaty', 'Action', 'Changes']],
      body: filteredAuditLog.map(e => [
        new Date(e.changedAt).toLocaleString(),
        e.changedBy,
        `${e.treatyCode} — ${e.treatyName}`,
        e.action,
        formatChanges(e.changes),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`treaty-audit-log-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: 'Exported', description: `${filteredAuditLog.length} audit entries exported as PDF.` });
  };


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
                <th className="text-left px-4 py-3">Effective From</th>
                <th className="text-left px-4 py-3">Effective To</th>
                <th className="text-left px-4 py-3 w-1/4">Utilization</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capacityStatuses.map(c => {
                const treaty = treaties.find(t => t.code === c.treatyCode);
                const isEditing = treaty && editingTreatyId === treaty.id;
                return (
                <tr key={c.treatyCode} className={`border-b border-border/30 ${c.exceeded ? 'bg-destructive/5' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {c.treatyCode} <span className="text-muted-foreground">— {c.treatyName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.treatyType}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editForm.treatyCapacity}
                        onChange={(e) => setEditForm(f => ({ ...f, treatyCapacity: Number(e.target.value) }))}
                        className="w-32 px-2 py-1 bg-muted/50 border border-border rounded text-sm text-right"
                      />
                    ) : c.capacity.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${c.exceeded ? 'text-destructive' : 'text-foreground'}`}>
                    {c.used.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.effectiveFrom}
                        onChange={(e) => setEditForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                        className="px-2 py-1 bg-muted/50 border border-border rounded text-sm"
                      />
                    ) : treaty?.effectiveFrom}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.effectiveTo}
                        onChange={(e) => setEditForm(f => ({ ...f, effectiveTo: e.target.value }))}
                        className="px-2 py-1 bg-muted/50 border border-border rounded text-sm"
                      />
                    ) : treaty?.effectiveTo}
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
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={saveEdit} className="p-1.5 rounded hover:bg-success/10 text-success" title="Save">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(c.treatyCode)} className="p-1.5 rounded hover:bg-primary/10 text-primary" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {treaty && (() => {
                          const activeCount = activeCessionsByTreatyName[treaty.name] || 0;
                          const blocked = activeCount > 0;
                          return (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <button
                                      onClick={() => !blocked && setDeleteTreatyId(treaty.id)}
                                      disabled={blocked}
                                      aria-disabled={blocked}
                                      className={`p-1.5 rounded ${blocked ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-destructive hover:bg-destructive/10'}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {blocked
                                    ? `Cannot delete — ${activeCount} active cession${activeCount > 1 ? 's' : ''} reference this treaty. Void or reassign first.`
                                    : 'Delete treaty'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      </div>
                    )}
                  </td>
                </tr>
              );})}
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

      {/* Treaty Audit Log */}
      <div className="glass-card">
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Treaty Audit Log</h3>
          <span className="text-xs text-muted-foreground">
            {filteredAuditLog.length} of {treatyAuditLog.length} entries
          </span>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={filteredAuditLog.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAuditCSV}>
                  <FileText className="w-4 h-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAuditPDF}>
                  <FileText className="w-4 h-4 mr-2" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4 border-b border-border/50 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user, treaty, field..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            />
          </div>
          <select
            value={auditTreatyCode}
            onChange={(e) => setAuditTreatyCode(e.target.value)}
            className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
          >
            <option value="all">All treaties</option>
            {auditTreatyCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <select
            value={auditAction}
            onChange={(e) => setAuditAction(e.target.value as 'all' | 'Update' | 'Delete')}
            className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
          >
            <option value="all">All actions</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={auditDateFrom}
              onChange={(e) => setAuditDateFrom(e.target.value)}
              className="flex-1 px-2 py-2 bg-muted/50 border border-border rounded-lg text-sm"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={auditDateTo}
              onChange={(e) => setAuditDateTo(e.target.value)}
              className="flex-1 px-2 py-2 bg-muted/50 border border-border rounded-lg text-sm"
              aria-label="To date"
            />
          </div>
          {(auditSearch || auditTreatyCode !== 'all' || auditAction !== 'all' || auditDateFrom || auditDateTo) && (
            <button
              onClick={() => { setAuditSearch(''); setAuditTreatyCode('all'); setAuditAction('all'); setAuditDateFrom(''); setAuditDateTo(''); }}
              className="md:col-span-5 text-xs text-primary hover:underline text-left"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="table-header">
                <th className="text-left px-4 py-3">Timestamp</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Treaty</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Changes</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {treatyAuditLog.length === 0 ? 'No audit entries yet.' : 'No entries match the current filters.'}
                  </td>
                </tr>
              ) : filteredAuditLog.map(e => (
                <tr key={e.id} className="border-b border-border/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.changedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.changedBy}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.treatyCode} <span className="text-muted-foreground">— {e.treatyName}</span></td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${e.action === 'Delete' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {e.changes.map((c, i) => (
                      <div key={i}>
                        <span className="font-medium text-foreground">{c.field}:</span>{' '}
                        <span className="line-through">{typeof c.from === 'number' ? c.from.toLocaleString() : c.from}</span>
                        {' → '}
                        <span className="text-foreground">{typeof c.to === 'number' ? c.to.toLocaleString() : c.to}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteTreatyId} onOpenChange={(v) => { if (!v) setDeleteTreatyId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete treaty?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const t = treaties.find(x => x.id === deleteTreatyId);
                return t
                  ? `This will permanently remove ${t.code} — ${t.name} and is recorded in the audit log. Treaties with active cessions cannot be deleted.`
                  : 'Are you sure?';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reinsurance;
