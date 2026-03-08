// Premium Calculator Engine — Rate per mille × Sum Assured
// Products, rate tables, VAT, Govt Supervision Fee, optional PTD & Cyber

export interface Product {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  minTerm: number;
  maxTerm: number;
  minSA: number;
  maxSA: number;
  deathRates: Record<string, number>; // age-band key → rate per mille
  ptdRates: Record<string, number>;
  cyberRate: number; // flat rate per mille
  active: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 'TL-LEVEL', name: 'Term Life - Level',
    minAge: 18, maxAge: 60, minTerm: 5, maxTerm: 30, minSA: 5000, maxSA: 500000,
    deathRates: { '18-25': 1.2, '26-30': 1.5, '31-35': 1.9, '36-40': 2.5, '41-45': 3.4, '46-50': 4.8, '51-55': 6.5, '56-60': 8.8 },
    ptdRates:   { '18-25': 0.4, '26-30': 0.5, '31-35': 0.6, '36-40': 0.8, '41-45': 1.1, '46-50': 1.5, '51-55': 2.0, '56-60': 2.8 },
    cyberRate: 0.3, active: true,
  },
  {
    id: 'TL-DEC', name: 'Term Life - Decreasing',
    minAge: 18, maxAge: 55, minTerm: 5, maxTerm: 25, minSA: 5000, maxSA: 500000,
    deathRates: { '18-25': 0.9, '26-30': 1.1, '31-35': 1.4, '36-40': 1.9, '41-45': 2.6, '46-50': 3.7, '51-55': 5.0 },
    ptdRates:   { '18-25': 0.3, '26-30': 0.4, '31-35': 0.5, '36-40': 0.6, '41-45': 0.8, '46-50': 1.2, '51-55': 1.6 },
    cyberRate: 0.25, active: true,
  },
  {
    id: 'WL-TRAD', name: 'Whole Life - Traditional',
    minAge: 18, maxAge: 55, minTerm: 10, maxTerm: 40, minSA: 10000, maxSA: 1000000,
    deathRates: { '18-25': 2.0, '26-30': 2.5, '31-35': 3.2, '36-40': 4.2, '41-45': 5.5, '46-50': 7.2, '51-55': 9.5 },
    ptdRates:   { '18-25': 0.6, '26-30': 0.8, '31-35': 1.0, '36-40': 1.3, '41-45': 1.7, '46-50': 2.3, '51-55': 3.0 },
    cyberRate: 0.35, active: true,
  },
  {
    id: 'END-SAV', name: 'Endowment - Savings',
    minAge: 18, maxAge: 50, minTerm: 10, maxTerm: 30, minSA: 10000, maxSA: 500000,
    deathRates: { '18-25': 3.5, '26-30': 4.0, '31-35': 4.8, '36-40': 5.8, '41-45': 7.0, '46-50': 8.5 },
    ptdRates:   { '18-25': 0.8, '26-30': 1.0, '31-35': 1.2, '36-40': 1.5, '41-45': 1.9, '46-50': 2.5 },
    cyberRate: 0.3, active: true,
  },
  {
    id: 'UL', name: 'Unit-Linked',
    minAge: 21, maxAge: 55, minTerm: 10, maxTerm: 30, minSA: 20000, maxSA: 1000000,
    deathRates: { '21-25': 1.8, '26-30': 2.2, '31-35': 2.8, '36-40': 3.6, '41-45': 4.8, '46-50': 6.5, '51-55': 8.5 },
    ptdRates:   { '21-25': 0.5, '26-30': 0.7, '31-35': 0.9, '36-40': 1.2, '41-45': 1.6, '46-50': 2.1, '51-55': 2.8 },
    cyberRate: 0.4, active: true,
  },
  {
    id: 'GTL', name: 'Group Term Life',
    minAge: 18, maxAge: 60, minTerm: 1, maxTerm: 5, minSA: 5000, maxSA: 2000000,
    deathRates: { '18-25': 0.8, '26-30': 1.0, '31-35': 1.3, '36-40': 1.7, '41-45': 2.3, '46-50': 3.2, '51-55': 4.5, '56-60': 6.0 },
    ptdRates:   { '18-25': 0.3, '26-30': 0.3, '31-35': 0.4, '36-40': 0.5, '41-45': 0.7, '46-50': 1.0, '51-55': 1.4, '56-60': 1.9 },
    cyberRate: 0.2, active: true,
  },
];

const VAT_RATE = 0.05;
const GOVT_SUPERVISION_FEE_RATE = 0.0055;

export function getAgeBand(age: number): string {
  if (age <= 25) return age >= 21 ? '21-25' : '18-25';
  if (age <= 30) return '26-30';
  if (age <= 35) return '31-35';
  if (age <= 40) return '36-40';
  if (age <= 45) return '41-45';
  if (age <= 50) return '46-50';
  if (age <= 55) return '51-55';
  return '56-60';
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export interface PremiumBreakdown {
  deathPremium: number;
  ptdPremium: number;
  cyberPremium: number;
  basePremium: number;
  govtFee: number;
  vatOnPremium: number;
  vatOnGovtFee: number;
  totalVAT: number;
  totalPremium: number;
  annualPremium: number;
  deathRate: number;
  ptdRate: number;
  cyberRate: number;
}

export interface CalcInput {
  productId: string;
  age: number;
  sumAssured: number;
  term: number;
  healthLoading: number; // percentage e.g. 0, 25, 50
  includePTD: boolean;
  includeCyber: boolean;
}

export function calculatePremium(input: CalcInput): PremiumBreakdown | null {
  const product = PRODUCTS.find(p => p.id === input.productId);
  if (!product) return null;

  const ageBand = getAgeBand(input.age);
  const deathRate = product.deathRates[ageBand] || product.deathRates[Object.keys(product.deathRates).pop()!];
  const ptdRate = input.includePTD ? (product.ptdRates[ageBand] || 0) : 0;
  const cyberRate = input.includeCyber ? product.cyberRate : 0;

  // Apply health loading to death rate
  const adjustedDeathRate = deathRate * (1 + input.healthLoading / 100);

  // Premium = rate per mille × (SA / 1000)
  const saFactor = input.sumAssured / 1000;
  const deathPremium = adjustedDeathRate * saFactor;
  const ptdPremium = ptdRate * saFactor;
  const cyberPremium = cyberRate * saFactor;

  const basePremium = deathPremium + ptdPremium + cyberPremium;
  const govtFee = basePremium * GOVT_SUPERVISION_FEE_RATE;
  const vatOnPremium = basePremium * VAT_RATE;
  const vatOnGovtFee = govtFee * VAT_RATE;
  const totalVAT = vatOnPremium + vatOnGovtFee;
  const annualPremium = basePremium + govtFee + totalVAT;
  const totalPremium = annualPremium * input.term;

  return {
    deathPremium: round3(deathPremium),
    ptdPremium: round3(ptdPremium),
    cyberPremium: round3(cyberPremium),
    basePremium: round3(basePremium),
    govtFee: round3(govtFee),
    vatOnPremium: round3(vatOnPremium),
    vatOnGovtFee: round3(vatOnGovtFee),
    totalVAT: round3(totalVAT),
    totalPremium: round3(totalPremium),
    annualPremium: round3(annualPremium),
    deathRate: adjustedDeathRate,
    ptdRate,
    cyberRate,
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
