import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type PdfInstallment = {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

type ExportSimulationPdfInput = {
  title: string;
  fileName: string;
  productName: string;
  amount: number;
  annualInterestRate: number;
  termMonths: number;
  amortizationType: string;
  totalInterest: number;
  totalPayment: number;
  schedule: PdfInstallment[];
  insuranceMonthly?: number;
  createdAtUtc?: string;
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatMethod(value: string) {
  return value === 'french' ? 'Frances - cuota fija' : 'Aleman - cuota decreciente';
}

export function exportSimulationPdf(input: ExportSimulationPdfInput) {
  const doc = new jsPDF();
  const insuranceMonthly = input.insuranceMonthly ?? 0;

  doc.setFontSize(18);
  doc.setTextColor(15, 38, 92);
  doc.text(input.title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(76, 85, 99);
  doc.text(`Producto: ${input.productName}`, 14, 30);
  doc.text(`Monto solicitado: ${formatMoney(input.amount)}`, 14, 36);
  doc.text(`Tasa anual referencial: ${input.annualInterestRate.toFixed(2)}%`, 14, 42);
  doc.text(`Plazo: ${input.termMonths} meses`, 14, 48);
  doc.text(`Metodo: ${formatMethod(input.amortizationType)}`, 14, 54);
  doc.text(`Interes total: ${formatMoney(input.totalInterest)}`, 14, 60);
  doc.text(`Total a pagar: ${formatMoney(input.totalPayment)}`, 14, 66);

  if (input.createdAtUtc) {
    doc.text(`Fecha: ${new Date(input.createdAtUtc).toLocaleDateString('es-EC')}`, 14, 72);
  }

  const startY = input.createdAtUtc ? 80 : 74;
  const rows = input.schedule.map((row) => [
    row.period,
    formatMoney(row.payment + insuranceMonthly),
    formatMoney(row.principal),
    formatMoney(row.interest),
    formatMoney(row.balance),
  ]);

  autoTable(doc, {
    head: [['Mes', 'Cuota', 'Capital', 'Interes', 'Saldo']],
    body: rows,
    startY,
    theme: 'striped',
    headStyles: { fillColor: [15, 38, 92], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save(`${sanitizeFileName(input.fileName)}.pdf`);
}

function sanitizeFileName(value: string) {
  return value.trim().replace(/[^\w.-]+/g, '_');
}
