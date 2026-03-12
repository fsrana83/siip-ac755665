import { Quotation, Proposal, Policy, Client, Claim } from './types';

export const mockQuotations: Quotation[] = [
  { id: '1', quotRef: 'QT-2026-0001', clientName: 'Ahmed Al Balushi', productName: 'Term Life - Level', sumAssured: 100000, totalPremium: 132.375, premiumFrequency: 'Annual', status: 'Converted', createdBy: 'sales01', createdAt: '2026-01-15' },
  { id: '2', quotRef: 'QT-2026-0002', clientName: 'Fatima Al Rashdi', productName: 'Whole Life - Traditional', sumAssured: 50000, totalPremium: 89.250, premiumFrequency: 'Annual', status: 'Draft', createdBy: 'sales01', createdAt: '2026-02-01' },
  { id: '3', quotRef: 'QT-2026-0003', clientName: 'Mohammed Al Habsi', productName: 'Endowment - Savings', sumAssured: 200000, totalPremium: 245.500, premiumFrequency: 'Semi-Annual', status: 'Draft', createdBy: 'admin', createdAt: '2026-02-20' },
  { id: '4', quotRef: 'QT-2026-0004', clientName: 'Sara Al Kindi', productName: 'Term Life - Decreasing', sumAssured: 150000, totalPremium: 178.125, premiumFrequency: 'Quarterly', status: 'Converted', createdBy: 'sales01', createdAt: '2026-03-01' },
];

export const mockProposals: Proposal[] = [
  { id: '1', proposalNo: 'PP-2026-0001', quotRef: 'QT-2026-0001', clientName: 'Ahmed Al Balushi', uwDecision: 'Approved', premiumFrequency: 'Annual', status: 'Policy Issued', createdAt: '2026-01-16', medicalQuestions: [], receipts: [], credits: [], totalPremiumDue: 132.375 },
  { id: '2', proposalNo: 'PP-2026-0002', quotRef: 'QT-2026-0004', clientName: 'Sara Al Kindi', uwDecision: 'Pending', premiumFrequency: 'Quarterly', status: 'Pending UW', createdAt: '2026-03-02', medicalQuestions: [], receipts: [], credits: [], totalPremiumDue: 178.125 },
];

export const mockPolicies: Policy[] = [
  { id: '1', policyNo: 'PL-2026-0001', proposalNo: 'PP-2026-0001', clientName: 'Ahmed Al Balushi', policyHolder: 'Ahmed Al Balushi', productName: 'Term Life - Level', sumAssured: 100000, totalPremium: 132.375, premiumFrequency: 'Annual', commencementDate: '2026-01-20', expiryDate: '2036-01-20', status: 'Active' },
];

export const mockClients: Client[] = [
  { clientId: 'C001', fullName: 'Ahmed Al Balushi', gender: 'Male', dob: '1991-03-15', nationality: 'Omani', idType: 'National ID', idNumber: '12345678', phone: '+968 9123 4567', email: 'ahmed@email.com', kycStatus: 'Approved' },
  { clientId: 'C002', fullName: 'Fatima Al Rashdi', gender: 'Female', dob: '1985-07-22', nationality: 'Omani', idType: 'National ID', idNumber: '87654321', phone: '+968 9876 5432', email: 'fatima@email.com', kycStatus: 'Pending' },
  { clientId: 'C003', fullName: 'Mohammed Al Habsi', gender: 'Male', dob: '1978-11-08', nationality: 'Omani', idType: 'Passport', idNumber: 'P9876543', phone: '+968 9555 1234', email: 'mohammed@email.com', kycStatus: 'Approved' },
  { clientId: 'C004', fullName: 'Sara Al Kindi', gender: 'Female', dob: '1995-01-30', nationality: 'Omani', idType: 'National ID', idNumber: '11223344', phone: '+968 9444 5678', email: 'sara@email.com', kycStatus: 'Pending' },
];

export const mockClaims: Claim[] = [
  { id: '1', claimRef: 'CL-2026-0001', policyNo: 'PL-2026-0001', claimant: 'Ahmed Al Balushi', claimType: 'Death', amountClaimed: 100000, status: 'Under Assessment', claimDate: '2026-03-05' },
];

export interface ReinsuranceCession {
  id: string;
  cessionRef: string;
  policyNo: string;
  reinsurer: string;
  treatyName: string;
  cededPremium: number;
  cededSA: number;
  retentionPct: number;
  cessionPct: number;
  status: 'Active' | 'Settled' | 'Void';
  effectiveDate: string;
}

export const mockReinsurance: ReinsuranceCession[] = [
  { id: '1', cessionRef: 'RI-2026-0001', policyNo: 'PL-2026-0001', reinsurer: 'Swiss Re', treatyName: 'Surplus Treaty 2026', cededPremium: 66.188, cededSA: 50000, retentionPct: 50, cessionPct: 50, status: 'Active', effectiveDate: '2026-01-20' },
  { id: '2', cessionRef: 'RI-2026-0002', policyNo: 'PL-2026-0001', reinsurer: 'Munich Re', treatyName: 'Quota Share 2026', cededPremium: 26.475, cededSA: 20000, retentionPct: 80, cessionPct: 20, status: 'Active', effectiveDate: '2026-01-20' },
];

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  reference: string;
  status: 'Posted' | 'Draft' | 'Reversed';
}

export const mockJournalEntries: JournalEntry[] = [
  { id: '1', voucherNo: 'JV-2026-0001', date: '2026-01-20', description: 'Premium received - PL-2026-0001', account: 'Premium Income', debit: 0, credit: 132.375, reference: 'PL-2026-0001', status: 'Posted' },
  { id: '2', voucherNo: 'JV-2026-0002', date: '2026-01-20', description: 'Premium receivable - PL-2026-0001', account: 'Accounts Receivable', debit: 132.375, credit: 0, reference: 'PL-2026-0001', status: 'Posted' },
  { id: '3', voucherNo: 'JV-2026-0003', date: '2026-01-20', description: 'RI cession premium - Swiss Re', account: 'RI Premium Payable', debit: 0, credit: 66.188, reference: 'RI-2026-0001', status: 'Posted' },
  { id: '4', voucherNo: 'JV-2026-0004', date: '2026-01-20', description: 'RI cession expense', account: 'RI Cession Expense', debit: 66.188, credit: 0, reference: 'RI-2026-0001', status: 'Posted' },
  { id: '5', voucherNo: 'JV-2026-0005', date: '2026-01-20', description: 'VAT on premium', account: 'VAT Output', debit: 0, credit: 6.619, reference: 'PL-2026-0001', status: 'Posted' },
  { id: '6', voucherNo: 'JV-2026-0006', date: '2026-02-01', description: 'Commission payable', account: 'Commission Expense', debit: 13.238, credit: 0, reference: 'PL-2026-0001', status: 'Draft' },
];

export const dashboardStats = {
  totalPolicies: 1,
  activePolicies: 1,
  totalPremium: 132.375,
  pendingClaims: 1,
  openQuotations: 2,
  pendingProposals: 1,
  totalClients: 4,
  totalSumAssured: 100000,
};
