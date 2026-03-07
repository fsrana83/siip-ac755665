import { Quotation, Proposal, Policy, Client, Claim } from './types';

export const mockQuotations: Quotation[] = [
  { id: '1', quotRef: 'QT-2026-0001', clientName: 'Ahmed Al Balushi', productName: 'Term Life - Level', sumAssured: 100000, totalPremium: 132.375, status: 'Converted', createdBy: 'sales01', createdAt: '2026-01-15' },
  { id: '2', quotRef: 'QT-2026-0002', clientName: 'Fatima Al Rashdi', productName: 'Whole Life - Traditional', sumAssured: 50000, totalPremium: 89.250, status: 'Draft', createdBy: 'sales01', createdAt: '2026-02-01' },
  { id: '3', quotRef: 'QT-2026-0003', clientName: 'Mohammed Al Habsi', productName: 'Endowment - Savings', sumAssured: 200000, totalPremium: 245.500, status: 'Draft', createdBy: 'admin', createdAt: '2026-02-20' },
  { id: '4', quotRef: 'QT-2026-0004', clientName: 'Sara Al Kindi', productName: 'Term Life - Decreasing', sumAssured: 150000, totalPremium: 178.125, status: 'Converted', createdBy: 'sales01', createdAt: '2026-03-01' },
];

export const mockProposals: Proposal[] = [
  { id: '1', proposalNo: 'PP-2026-0001', quotRef: 'QT-2026-0001', clientName: 'Ahmed Al Balushi', uwDecision: 'Approved', status: 'Policy Issued', createdAt: '2026-01-16' },
  { id: '2', proposalNo: 'PP-2026-0002', quotRef: 'QT-2026-0004', clientName: 'Sara Al Kindi', uwDecision: 'Pending', status: 'Pending UW', createdAt: '2026-03-02' },
];

export const mockPolicies: Policy[] = [
  { id: '1', policyNo: 'PL-2026-0001', proposalNo: 'PP-2026-0001', clientName: 'Ahmed Al Balushi', productName: 'Term Life - Level', sumAssured: 100000, totalPremium: 132.375, commencementDate: '2026-01-20', expiryDate: '2036-01-20', status: 'Active' },
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
