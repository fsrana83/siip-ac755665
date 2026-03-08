import { createContext, useContext, useState, ReactNode } from 'react';
import { Quotation, Proposal, Policy, Client } from '@/lib/types';
import { mockQuotations, mockProposals, mockPolicies, mockClients } from '@/lib/mockData';

interface DataContextType {
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  policies: Policy[];
  setPolicies: React.Dispatch<React.SetStateAction<Policy[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations);
  const [proposals, setProposals] = useState<Proposal[]>(mockProposals);
  const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
  const [clients, setClients] = useState<Client[]>(mockClients);

  return (
    <DataContext.Provider value={{ quotations, setQuotations, proposals, setProposals, policies, setPolicies, clients, setClients }}>
      {children}
    </DataContext.Provider>
  );
};
