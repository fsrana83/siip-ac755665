import { Link } from 'react-router-dom';
import { dashboardStats, mockReinsurance } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useData } from '@/contexts/DataContext';
import { computeCapacityStatuses } from '@/lib/capacityUtils';
import {
  Shield, FileText, Users, AlertTriangle,
  TrendingUp, DollarSign, ClipboardList, Building2
} from 'lucide-react';

const statCards = [
  { label: 'Active Policies', value: dashboardStats.activePolicies, icon: Shield, color: 'text-success' },
  { label: 'Total Premium (OMR)', value: dashboardStats.totalPremium.toFixed(3), icon: DollarSign, color: 'text-primary' },
  { label: 'Open Quotations', value: dashboardStats.openQuotations, icon: FileText, color: 'text-warning' },
  { label: 'Pending Proposals', value: dashboardStats.pendingProposals, icon: ClipboardList, color: 'text-info' },
  { label: 'Pending Claims', value: dashboardStats.pendingClaims, icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Total Clients', value: dashboardStats.totalClients, icon: Users, color: 'text-primary' },
  { label: 'Sum Assured (OMR)', value: dashboardStats.totalSumAssured.toLocaleString(), icon: TrendingUp, color: 'text-success' },
  { label: 'Total Policies', value: dashboardStats.totalPolicies, icon: Building2, color: 'text-muted-foreground' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { treaties } = useConfig();
  const { policies } = useData();
  const policyClientMap = Object.fromEntries(policies.map(p => [p.policyNo, p.policyHolder || p.clientName]));
  const capacityStatuses = computeCapacityStatuses(treaties, mockReinsurance, policyClientMap);
  const exceedances = capacityStatuses.filter(c => c.exceeded);
  const warnings = capacityStatuses.filter(c => c.warning && !c.exceeded);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.fullName}</p>
      </div>

      {(exceedances.length > 0 || warnings.length > 0) && (
        <div className="glass-card p-4 border border-destructive/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Reinsurance Capacity Alerts
            </h3>
            <Link to="/reinsurance" className="text-xs text-primary hover:underline">View Reinsurance →</Link>
          </div>
          <div className="space-y-2">
            {exceedances.map(c => (
              <div key={c.treatyCode} className="text-xs p-2 rounded bg-destructive/10 border border-destructive/30">
                <p className="font-medium text-destructive">
                  ⚠ {c.treatyName} ({c.treatyType}) — Capacity exceeded ({c.utilizationPct.toFixed(1)}%)
                </p>
                {c.exceedingClients.length > 0 && (
                  <p className="text-muted-foreground mt-0.5">
                    Clients: {c.exceedingClients.map(x => x.clientName).join(', ')}
                  </p>
                )}
              </div>
            ))}
            {warnings.map(c => (
              <div key={c.treatyCode} className="text-xs p-2 rounded bg-warning/10 border border-warning/30 text-foreground">
                {c.treatyName} approaching limit — {c.utilizationPct.toFixed(1)}% used
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { text: 'Policy PL-2026-0001 issued for Ahmed Al Balushi', time: '2 hours ago', type: 'success' },
            { text: 'Quotation QT-2026-0003 created by admin', time: '5 hours ago', type: 'info' },
            { text: 'Claim CL-2026-0001 registered — under assessment', time: '1 day ago', type: 'warning' },
            { text: 'KYC approved for Mohammed Al Habsi', time: '2 days ago', type: 'success' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className={`w-2 h-2 rounded-full ${
                item.type === 'success' ? 'bg-success' : item.type === 'warning' ? 'bg-warning' : 'bg-primary'
              }`} />
              <p className="text-sm text-foreground flex-1">{item.text}</p>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
