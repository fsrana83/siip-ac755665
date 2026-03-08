import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReceiptRow {
  receiptNo: string;
  proposalNo: string;
  clientName: string;
  receiptDate: string;
  paymentMode: string;
  amount: number;
  remarks: string;
}

interface AgingRow {
  proposalNo: string;
  clientName: string;
  creditAmount: number;
  dueDate: string;
  daysOverdue: number;
  bucket: string;
  remarks: string;
}

export function exportCreditReport(
  report: 'receipts' | 'aging',
  format: 'excel' | 'pdf',
  receipts: ReceiptRow[],
  aging: AgingRow[]
) {
  if (report === 'receipts') {
    const title = 'Receipts Register';
    const headers = ['Receipt No', 'Proposal', 'Client', 'Date', 'Mode', 'Amount (OMR)', 'Remarks'];
    const rows = receipts.map(r => [r.receiptNo, r.proposalNo, r.clientName, r.receiptDate, r.paymentMode, r.amount.toFixed(3), r.remarks || '']);
    if (format === 'excel') exportExcel(title, headers, rows);
    else exportPDF(title, headers, rows);
  } else {
    const title = 'Credit Aging Report';
    const headers = ['Proposal', 'Client', 'Amount (OMR)', 'Due Date', 'Days Overdue', 'Bucket', 'Remarks'];
    const rows = aging.map(a => [a.proposalNo, a.clientName, a.creditAmount.toFixed(3), a.dueDate, String(a.daysOverdue > 0 ? a.daysOverdue : 0), a.bucket, a.remarks || '']);
    if (format === 'excel') exportExcel(title, headers, rows);
    else exportPDF(title, headers, rows);
  }
}

function exportExcel(title: string, headers: string[], rows: string[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  XLSX.writeFile(wb, `${title}.xlsx`);
}

function exportPDF(title: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 98, 168] },
  });
  doc.save(`${title}.pdf`);
}
