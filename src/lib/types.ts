export type UserRole = 'admin' | 'coo' | 'sales' | 'uw' | 'credit' | 'actuary' | 'manager';

export type PremiumFrequency = 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly' | 'Single';

export const FREQUENCY_DIVISORS: Record<PremiumFrequency, number> = {
  'Annual': 1,
  'Semi-Annual': 2,
  'Quarterly': 4,
  'Monthly': 12,
  'Single': 1,
};

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
  premiumFrequency: PremiumFrequency;
  status: 'Draft' | 'Converted' | 'Void';
  createdBy: string;
  createdAt: string;
}

export interface MedicalQuestion {
  id: string;
  question: string;
  answer: 'Yes' | 'No' | '';
  remarks: string;
}

export interface UWReview {
  clientVerified: boolean;
  quotationReviewed: boolean;
  documentsChecked: boolean;
  medicalReviewed: boolean;
  uwRemarks: string;
  riskRating: 'Standard' | 'Substandard' | 'Declined' | '';
}

export interface ReceiptEntry {
  id: string;
  receiptNo: string;
  receiptDate: string;
  paymentMode: 'Cash' | 'Cheque' | 'Bank Transfer' | 'Online';
  amount: number;
  remarks: string;
}

export interface CreditEntry {
  id: string;
  creditAmount: number;
  creditDays: number;
  dueDate: string;
  remarks: string;
  status: 'Pending' | 'Settled';
}

export interface Proposal {
  id: string;
  proposalNo: string;
  quotRef: string;
  clientName: string;
  uwDecision: string;
  premiumFrequency: PremiumFrequency;
  status: 'Pending UW' | 'UW Approved' | 'Credit Approved' | 'Policy Issued';
  createdAt: string;
  approvalDate?: string;
  medicalQuestions: MedicalQuestion[];
  uwReview?: UWReview;
  receipts: ReceiptEntry[];
  credits: CreditEntry[];
  totalPremiumDue: number;
}

export interface Policy {
  id: string;
  policyNo: string;
  proposalNo: string;
  clientName: string;
  policyHolder: string;
  productName: string;
  sumAssured: number;
  totalPremium: number;
  premiumFrequency: PremiumFrequency;
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

export interface MedicalExam {
  id: string;
  proposalNo: string;
  clientName: string;
  productName: string;
  sumAssured: number;
  medicalRequired: boolean;
  medicalCenter: string;
  bookingDate: string;
  bookingTime: string;
  bookingRemarks: string;
  status: 'Pending' | 'Booked' | 'Completed' | 'Waived';
  createdAt: string;
  results?: string;
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
  'credit-control': ['admin', 'coo', 'credit'],
  accounting: ['admin', 'coo', 'credit'],
  vat: ['admin', 'coo', 'credit', 'actuary', 'manager'],
  medical: ['admin', 'uw', 'coo', 'manager'],
  reports: null,
  admin: ['admin'],
  developer: ['admin'],
};
