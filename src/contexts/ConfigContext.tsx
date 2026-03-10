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
  medicalSAThreshold: number; // SA above this requires medical exam
}

interface ConfigContextType {
  vatEntries: VATEntry[];
  currentVATRate: (coverType: string) => number;
  addVATChange: (coverType: string, newRate: number, effectiveDate: string) => void;
  products: ProductConfig[];
  setProducts: React.Dispatch<React.SetStateAction<ProductConfig[]>>;
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
}));

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [vatEntries, setVATEntries] = useState<VATEntry[]>(initialVATEntries);
  const [products, setProducts] = useState<ProductConfig[]>(initialProducts);

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
    <ConfigContext.Provider value={{ vatEntries, currentVATRate, addVATChange, products, setProducts }}>
      {children}
    </ConfigContext.Provider>
  );
};

export { COVER_TYPES };
