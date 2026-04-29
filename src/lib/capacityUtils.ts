import { ReinsuranceCession } from './mockData';
import { Treaty } from '@/contexts/ConfigContext';

export interface CapacityStatus {
  treatyCode: string;
  treatyName: string;
  treatyType: string;
  capacity: number;
  used: number;
  utilizationPct: number;
  exceeded: boolean;
  warning: boolean; // >= 80%
  exceedingClients: { clientName: string; policyNo: string; cededSA: number }[];
}

export const computeCapacityStatuses = (
  treaties: Treaty[],
  cessions: ReinsuranceCession[],
  policyClientMap: Record<string, string> = {},
): CapacityStatus[] => {
  return treaties.map(t => {
    const treatyCessions = cessions.filter(c => c.treatyName === t.name && c.status === 'Active');
    const used = treatyCessions.reduce((s, c) => s + c.cededSA, 0);
    const utilizationPct = t.treatyCapacity > 0 ? (used / t.treatyCapacity) * 100 : 0;
    const exceeded = used > t.treatyCapacity;
    return {
      treatyCode: t.code,
      treatyName: t.name,
      treatyType: t.type,
      capacity: t.treatyCapacity,
      used,
      utilizationPct,
      exceeded,
      warning: utilizationPct >= 80,
      exceedingClients: exceeded
        ? treatyCessions.map(c => ({
            clientName: policyClientMap[c.policyNo] || c.policyNo,
            policyNo: c.policyNo,
            cededSA: c.cededSA,
          }))
        : [],
    };
  });
};
