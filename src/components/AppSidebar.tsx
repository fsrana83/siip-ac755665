import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, hasAccess } from '@/contexts/AuthContext';
import { TAB_ACCESS, ROLE_LABELS } from '@/lib/types';
import logo from '@/assets/logo.png';
import {
  LayoutDashboard, FileText, Users, ClipboardList, Shield,
  AlertTriangle, Building2, Receipt, FileBarChart, Settings,
  LogOut, ChevronRight, Landmark, Code2
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
  { path: '/quotations', label: 'Quotations', icon: FileText, tab: 'quotations' },
  { path: '/clients', label: 'Clients & KYC', icon: Users, tab: 'clients' },
  { path: '/proposals', label: 'Proposals', icon: ClipboardList, tab: 'proposals' },
  { path: '/policies', label: 'Policies', icon: Shield, tab: 'policies' },
  { path: '/claims', label: 'Claims', icon: AlertTriangle, tab: 'claims' },
  { path: '/reinsurance', label: 'Reinsurance', icon: Building2, tab: 'reinsurance' },
  { path: '/credit-control', label: 'Credit Control', icon: CreditCard, tab: 'credit-control' },
  { path: '/accounting', label: 'Accounting', icon: Landmark, tab: 'accounting' },
  { path: '/vat', label: 'VAT Reports', icon: Receipt, tab: 'vat' },
  { path: '/reports', label: 'Reports', icon: FileBarChart, tab: 'reports' },
  { path: '/admin', label: 'Admin Panel', icon: Settings, tab: 'admin' },
  { path: '/developer', label: 'Developer', icon: Code2, tab: 'developer' },
];

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const visibleItems = navItems.filter(item => hasAccess(user.role, item.tab, TAB_ACCESS));

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-display font-bold text-foreground">SmartIdeas</p>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">ILPPC</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-primary" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">{user.fullName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
            <p className="text-[10px] text-primary font-medium uppercase tracking-wider">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
