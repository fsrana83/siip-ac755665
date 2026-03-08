import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { mockQuotations, mockProposals, mockPolicies, mockClients, mockClaims, mockReinsurance, mockJournalEntries } from './mockData';

type ReportKey = 'quotations' | 'proposals' | 'policies' | 'claims' | 'commission' | 'ri-cession' | 'premium-collection' | 'agent-performance' | 'product-summary';

interface ReportConfig {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

function getReportConfig(key: ReportKey): ReportConfig {
  switch (key) {
    case 'quotations':
      return {
        title: 'Quotation Register',
        headers: ['Ref', 'Client', 'Product', 'Sum Assured', 'Premium', 'Status', 'Date'],
        rows: mockQuotations.map(q => [q.quotRef, q.clientName, q.productName, q.sumAssured, q.totalPremium, q.status, q.createdAt]),
      };
    case 'proposals':
      return {
        title: 'Proposal Register',
        headers: ['Proposal No', 'Quotation', 'Client', 'UW Decision', 'Status', 'Date'],
        rows: mockProposals.map(p => [p.proposalNo, p.quotRef, p.clientName, p.uwDecision, p.status, p.createdAt]),
      };
    case 'policies':
      return {
        title: 'Policy Register',
        headers: ['Policy No', 'Client', 'Product', 'Sum Assured', 'Premium', 'Start', 'End', 'Status'],
        rows: mockPolicies.map(p => [p.policyNo, p.clientName, p.productName, p.sumAssured, p.totalPremium, p.commencementDate, p.expiryDate, p.status]),
      };
    case 'claims':
      return {
        title: 'Claims Register',
        headers: ['Claim Ref', 'Policy', 'Claimant', 'Type', 'Amount', 'Status', 'Date'],
        rows: mockClaims.map(c => [c.claimRef, c.policyNo, c.claimant, c.claimType, c.amountClaimed, c.status, c.claimDate]),
      };
    case 'commission':
      return {
        title: 'Commission Report',
        headers: ['Policy No', 'Client', 'Premium', 'Comm Rate', 'Commission', 'Status'],
        rows: mockPolicies.map(p => [p.policyNo, p.clientName, p.totalPremium, '10%', (p.totalPremium * 0.1).toFixed(3), 'Payable']),
      };
    case 'ri-cession':
      return {
        title: 'RI Cession Report',
        headers: ['Cession Ref', 'Policy', 'Reinsurer', 'Treaty', 'Ceded Premium', 'Ceded SA', 'Retention %', 'Status'],
        rows: mockReinsurance.map(r => [r.cessionRef, r.policyNo, r.reinsurer, r.treatyName, r.cededPremium, r.cededSA, `${r.retentionPct}%`, r.status]),
      };
    case 'premium-collection':
      return {
        title: 'Premium Collection',
        headers: ['Policy No', 'Client', 'Premium Due', 'Collected', 'Outstanding', 'Due Date'],
        rows: mockPolicies.map(p => [p.policyNo, p.clientName, p.totalPremium, p.totalPremium, 0, p.commencementDate]),
      };
    case 'agent-performance':
      return {
        title: 'Agent Performance',
        headers: ['Agent', 'Quotations', 'Conversions', 'Premium Written', 'Commission Earned'],
        rows: [
          ['Ali Al Farsi (sales01)', 3, 2, '310.500', '31.050'],
          ['System Admin', 1, 0, '0.000', '0.000'],
        ],
      };
    case 'product-summary':
      return {
        title: 'Product Summary',
        headers: ['Product', 'Policies', 'Total Premium', 'Total SA', 'Avg Premium'],
        rows: [
          ['Term Life - Level', 1, '132.375', '100,000', '132.375'],
          ['Term Life - Decreasing', 0, '0.000', '0', '0.000'],
          ['Whole Life - Traditional', 0, '0.000', '0', '0.000'],
          ['Endowment - Savings', 0, '0.000', '0', '0.000'],
        ],
      };
  }
}

export function exportCSV(key: ReportKey) {
  const config = getReportConfig(key);
  const csvContent = [config.headers.join(','), ...config.rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `${config.title}.csv`, 'text/csv');
}

export function exportExcel(key: ReportKey) {
  const config = getReportConfig(key);
  const ws = XLSX.utils.aoa_to_sheet([config.headers, ...config.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.title);
  XLSX.writeFile(wb, `${config.title}.xlsx`);
}

export function exportPDF(key: ReportKey) {
  const config = getReportConfig(key);
  const doc = new jsPDF({ orientation: config.headers.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(config.title, 14, 20);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  autoTable(doc, {
    head: [config.headers],
    body: config.rows.map(r => r.map(String)),
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 98, 168] },
  });
  doc.save(`${config.title}.pdf`);
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const REPORT_KEYS: { label: string; key: ReportKey }[] = [
  { label: 'Quotation Register', key: 'quotations' },
  { label: 'Proposal Register', key: 'proposals' },
  { label: 'Policy Register', key: 'policies' },
  { label: 'Claims Register', key: 'claims' },
  { label: 'Commission Report', key: 'commission' },
  { label: 'RI Cession Report', key: 'ri-cession' },
  { label: 'Premium Collection', key: 'premium-collection' },
  { label: 'Agent Performance', key: 'agent-performance' },
  { label: 'Product Summary', key: 'product-summary' },
];
