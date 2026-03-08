export type UserRole = 'admin' | 'coo' | 'sales' | 'uw' | 'credit' | 'actuary' | 'manager';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

export interface Quotation {
  id: string;
  quotRef: string;
  clientName: string;
  productName: string;
  sumAssured: number;
  totalPremium: number;
  status: 'Draft' | 'Converted';
  createdBy: string;
  createdAt: string;
}

export interface Proposal {
  id: string;
  proposalNo: string;
  quotRef: string;
  clientName: string;
  uwDecision: string;
  status: 'Pending UW' | 'UW Approved' | 'Credit Approved' | 'Policy Issued';
  createdAt: string;
}

export interface Policy {
  id: string;
  policyNo: string;
  proposalNo: string;
  clientName: string;
  productName: string;
  sumAssured: number;
  totalPremium: number;
  commencementDate: string;
  expiryDate: string;
  status: 'Active' | 'Void';
}

export interface Client {
  clientId: string;
  fullName: string;
  gender: string;
  dob: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  kycStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface Claim {
  id: string;
  claimRef: string;
  policyNo: string;
  claimant: string;
  claimType: string;
  amountClaimed: number;
  status: 'Registered' | 'Under Assessment' | 'Approved' | 'Paid' | 'Rejected';
  claimDate: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  coo: 'COO',
  sales: 'Sales',
  uw: 'Underwriter',
  credit: 'Credit',
  actuary: 'Actuary',
  manager: 'Manager',
};

export const TAB_ACCESS: Record<string, UserRole[] | null> = {
  dashboard: null,
  quotations: ['admin', 'sales', 'uw', 'coo'],
  clients: null,
  proposals: null,
  policies: null,
  claims: ['admin', 'uw', 'coo', 'manager', 'credit'],
  reinsurance: ['admin', 'uw', 'coo', 'actuary', 'manager'],
  accounting: ['admin', 'coo', 'credit'],
  vat: ['admin', 'coo', 'credit', 'actuary', 'manager'],
  reports: null,
  admin: ['admin'],
  developer: ['admin'],
};
