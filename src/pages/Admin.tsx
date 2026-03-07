import { useState } from 'react';
import { Users, Building2, Receipt, Package, Shield } from 'lucide-react';

const tabs = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'company', label: 'Company Setup', icon: Building2 },
  { id: 'vat', label: 'VAT Configuration', icon: Receipt },
  { id: 'products', label: 'Product Setup', icon: Package },
  { id: 'reinsurance', label: 'Reinsurance Setup', icon: Shield },
];

const mockUsers = [
  { username: 'admin', fullName: 'System Administrator', role: 'admin', active: true },
  { username: 'coo', fullName: 'Chief Operating Officer', role: 'coo', active: true },
  { username: 'sales01', fullName: 'Ali Al Farsi', role: 'sales', active: true },
  { username: 'uw01', fullName: 'Hamed Al Lawati', role: 'uw', active: true },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">System configuration and management</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">System Users</h3>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
              + Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Full Name</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(u => (
                  <tr key={u.username} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{u.fullName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="status-active inline-block px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-semibold text-foreground">Company Profile</h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Company Name', value: 'SmartIdeas Insurance Portals LLC' },
              { label: 'Company Alias', value: 'SmartIdeas' },
              { label: 'CR Number', value: '1234567' },
              { label: 'Licence Number', value: 'INS-2024-001' },
              { label: 'VAT Number', value: 'OM1234567890' },
              { label: 'Govt. Supervision Fee', value: '0.55%' },
              { label: 'Phone', value: '+968 2400 0000' },
              { label: 'Email', value: 'info@smartideas.om' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground">{field.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vat' && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">VAT Rates by Cover Type</h3>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Cover Type</th>
                <th className="text-right px-4 py-3">VAT Rate (%)</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {['Death', 'PTD', 'Cyber', 'All Covers', 'Commission', 'Govt Fee'].map(cover => (
                <tr key={cover} className="border-b border-border/30">
                  <td className="px-4 py-3 text-sm text-foreground">{cover}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">5.000%</td>
                  <td className="px-4 py-3"><span className="status-active inline-block px-2 py-0.5 rounded-full text-xs font-medium">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Product Register</h3>
          <p className="text-sm text-muted-foreground">Product setup with 19 product types, premium rules, eligibility criteria, and rate table management.</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {['Term Life - Level', 'Term Life - Decreasing', 'Whole Life - Traditional', 'Endowment - Savings', 'Unit-Linked', 'Group Term Life'].map(p => (
              <div key={p} className="stat-card">
                <p className="text-sm font-medium text-foreground">{p}</p>
                <p className="text-xs text-muted-foreground mt-1">Active</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reinsurance' && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Reinsurance Setup</h3>
          <p className="text-sm text-muted-foreground">Manage reinsurers (RE-YYYY-NNNN), treaties (TRT-YYYY-NNNN), and banded treaty participants.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
