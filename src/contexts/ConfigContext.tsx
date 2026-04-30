import { createContext, useContext, useState, ReactNode } from 'react';
import { Product, PRODUCTS as DEFAULT_PRODUCTS } from '@/lib/premiumEngine';
import { PremiumFrequency } from '@/lib/types';

export interface VATEntry {
  id: string;
  coverType: string;
  rate: number;
  entryDate: string;
  effectiveDate: string;
  changedBy: string;
  previousRate: number | null;
}

export interface ProductConfig extends Product {
  allowedFrequencies: PremiumFrequency[];
  calcMethod: 'Rate per Mille' | 'Flat Rate' | 'Age-Rated';
  medicalSAThreshold: number;
}

export interface Reinsurer {
  id: string;
  code: string;
  name: string;
  country: string;
  rating: string;
  contactPerson: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export type TreatyType = 'Quota Share' | 'Surplus' | 'Quota Share Cum Surplus' | 'Excess of Loss' | 'Facultative';

export interface Treaty {
  id: string;
  code: string;
  name: string;
  type: TreatyType;
  effectiveFrom: string;
  effectiveTo: string;
  retentionLimit: number;
  treatyCapacity: number; // total SA capacity for this treaty
  status: 'Active' | 'Expired' | 'Draft';
}

export interface TreatyParticipant {
  id: string;
  treatyCode: string;
  reinsurerCode: string;
  reinsurerName: string;
  sharePct: number;
  maxLiability: number;
}

export interface TreatyAuditEntry {
  id: string;
  treatyId: string;
  treatyCode: string;
  treatyName: string;
  action: 'Update' | 'Delete';
  changedBy: string;
  changedAt: string; // ISO timestamp
  changes: { field: string; from: string | number; to: string | number }[];
}

interface ConfigContextType {
  vatEntries: VATEntry[];
  currentVATRate: (coverType: string) => number;
  addVATChange: (coverType: string, newRate: number, effectiveDate: string) => void;
  products: ProductConfig[];
  setProducts: React.Dispatch<React.SetStateAction<ProductConfig[]>>;
  reinsurers: Reinsurer[];
  setReinsurers: React.Dispatch<React.SetStateAction<Reinsurer[]>>;
  treaties: Treaty[];
  setTreaties: React.Dispatch<React.SetStateAction<Treaty[]>>;
  participants: TreatyParticipant[];
  setParticipants: React.Dispatch<React.SetStateAction<TreatyParticipant[]>>;
  treatyAuditLog: TreatyAuditEntry[];
  addTreatyAudit: (entry: Omit<TreatyAuditEntry, 'id' | 'changedAt'>) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

const COVER_TYPES = ['Death', 'PTD', 'Cyber', 'All Covers', 'Commission', 'Govt Fee'];

const initialVATEntries: VATEntry[] = COVER_TYPES.map((ct, i) => ({
  id: String(i + 1),
  coverType: ct,
  rate: 5,
  entryDate: '2026-01-01',
  effectiveDate: '2026-01-01',
  changedBy: 'System',
  previousRate: null,
}));

const initialProducts: ProductConfig[] = DEFAULT_PRODUCTS.map(p => ({
  ...p,
  allowedFrequencies: ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'] as PremiumFrequency[],
  calcMethod: 'Rate per Mille' as const,
  medicalSAThreshold: 100000,
}));

const initialReinsurers: Reinsurer[] = [
  { id: '1', code: 'RE-2026-0001', name: 'Swiss Re', country: 'Switzerland', rating: 'AA-', contactPerson: 'Hans Mueller', email: 'hans@swissre.com', status: 'Active' },
  { id: '2', code: 'RE-2026-0002', name: 'Munich Re', country: 'Germany', rating: 'AA-', contactPerson: 'Klaus Schmidt', email: 'klaus@munichre.com', status: 'Active' },
  { id: '3', code: 'RE-2026-0003', name: 'Hannover Re', country: 'Germany', rating: 'A+', contactPerson: 'Eva Wagner', email: 'eva@hannover-re.com', status: 'Active' },
  { id: '4', code: 'RE-2026-0004', name: 'SCOR', country: 'France', rating: 'A+', contactPerson: 'Pierre Dupont', email: 'pierre@scor.com', status: 'Inactive' },
];

const initialTreaties: Treaty[] = [
  { id: '1', code: 'TRT-2026-0001', name: 'Surplus Treaty 2026', type: 'Surplus', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 50000, treatyCapacity: 1000000, status: 'Active' },
  { id: '2', code: 'TRT-2026-0002', name: 'Quota Share 2026', type: 'Quota Share', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 100000, treatyCapacity: 2000000, status: 'Active' },
  { id: '3', code: 'TRT-2026-0003', name: 'QS Cum Surplus 2026', type: 'Quota Share Cum Surplus', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 75000, treatyCapacity: 1500000, status: 'Active' },
  { id: '4', code: 'TRT-2026-0004', name: 'Facultative Pool', type: 'Facultative', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', retentionLimit: 200000, treatyCapacity: 500000, status: 'Active' },
];

const initialParticipants: TreatyParticipant[] = [
  { id: '1', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0001', reinsurerName: 'Swiss Re', sharePct: 50, maxLiability: 500000 },
  { id: '2', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0002', reinsurerName: 'Munich Re', sharePct: 30, maxLiability: 300000 },
  { id: '3', treatyCode: 'TRT-2026-0001', reinsurerCode: 'RE-2026-0003', reinsurerName: 'Hannover Re', sharePct: 20, maxLiability: 200000 },
  { id: '4', treatyCode: 'TRT-2026-0002', reinsurerCode: 'RE-2026-0001', reinsurerName: 'Swiss Re', sharePct: 40, maxLiability: 800000 },
  { id: '5', treatyCode: 'TRT-2026-0002', reinsurerCode: 'RE-2026-0002', reinsurerName: 'Munich Re', sharePct: 60, maxLiability: 1200000 },
  { id: '6', treatyCode: 'TRT-2026-0003', reinsurerCode: 'RE-2026-0001', reinsurerName: 'Swiss Re', sharePct: 100, maxLiability: 1500000 },
];

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [vatEntries, setVATEntries] = useState<VATEntry[]>(initialVATEntries);
  const [products, setProducts] = useState<ProductConfig[]>(initialProducts);
  const [reinsurers, setReinsurers] = useState<Reinsurer[]>(initialReinsurers);
  const [treaties, setTreaties] = useState<Treaty[]>(initialTreaties);
  const [participants, setParticipants] = useState<TreatyParticipant[]>(initialParticipants);
  const [treatyAuditLog, setTreatyAuditLog] = useState<TreatyAuditEntry[]>([]);

  const addTreatyAudit = (entry: Omit<TreatyAuditEntry, 'id' | 'changedAt'>) => {
    setTreatyAuditLog(prev => [
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, changedAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const currentVATRate = (coverType: string): number => {
    const today = new Date().toISOString().split('T')[0];
    const entries = vatEntries
      .filter(e => e.coverType === coverType && e.effectiveDate <= today)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    return entries.length > 0 ? entries[0].rate : 5;
  };

  const addVATChange = (coverType: string, newRate: number, effectiveDate: string) => {
    const prevRate = currentVATRate(coverType);
    const newEntry: VATEntry = {
      id: String(vatEntries.length + 1),
      coverType,
      rate: newRate,
      entryDate: new Date().toISOString().split('T')[0],
      effectiveDate,
      changedBy: 'admin',
      previousRate: prevRate,
    };
    setVATEntries(prev => [...prev, newEntry]);
  };

  return (
    <ConfigContext.Provider value={{
      vatEntries, currentVATRate, addVATChange,
      products, setProducts,
      reinsurers, setReinsurers,
      treaties, setTreaties,
      participants, setParticipants,
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export { COVER_TYPES };
