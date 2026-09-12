import { Customer, Invoice, PromiseToPay, RiskLevel } from '../../src/types/index.js';

export interface RiskBreakdown {
  score: number;
  level: RiskLevel;
  daysFactor: number;
  creditUtilizationFactor: number;
  brokenPromisesFactor: number;
  unpaidRatioFactor: number;
  summaryAr: string;
}

export function calculateDeterministicRiskScore(
  customer: Customer,
  invoices: Invoice[],
  promises: PromiseToPay[]
): RiskBreakdown {
  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id && inv.status !== 'cancelled' && inv.status !== 'draft');
  const overdueInvoices = customerInvoices.filter(inv => inv.daysOverdue > 0 && inv.remainingAmount > 0);
  const brokenPromises = promises.filter(p => p.customerId === customer.id && p.status === 'broken');

  // 1. Days Overdue Factor (Max 35 points)
  let maxDaysOverdue = 0;
  overdueInvoices.forEach(inv => {
    if (inv.daysOverdue > maxDaysOverdue) maxDaysOverdue = inv.daysOverdue;
  });

  let daysFactor = 0;
  if (maxDaysOverdue > 60) {
    daysFactor = 35;
  } else if (maxDaysOverdue > 30) {
    daysFactor = 26;
  } else if (maxDaysOverdue > 14) {
    daysFactor = 16;
  } else if (maxDaysOverdue > 0) {
    daysFactor = 8;
  }

  // 2. Credit Limit Utilization Factor (Max 25 points)
  let creditUtilizationFactor = 0;
  if (customer.creditLimit > 0) {
    const ratio = customer.outstandingBalance / customer.creditLimit;
    if (ratio >= 1.0) {
      creditUtilizationFactor = 25;
    } else if (ratio >= 0.8) {
      creditUtilizationFactor = 20;
    } else if (ratio >= 0.5) {
      creditUtilizationFactor = 12;
    } else if (ratio >= 0.2) {
      creditUtilizationFactor = 5;
    }
  } else if (customer.outstandingBalance > 500000) {
    // If no limit set but debt is high
    creditUtilizationFactor = 18;
  }

  // 3. Broken Promises Factor (Max 25 points)
  const brokenPromisesFactor = Math.min(25, brokenPromises.length * 15);

  // 4. Unpaid Invoices Ratio Factor (Max 15 points)
  let unpaidRatioFactor = 0;
  if (customerInvoices.length > 0) {
    const unpaidCount = customerInvoices.filter(inv => inv.remainingAmount > 0).length;
    const ratio = unpaidCount / customerInvoices.length;
    unpaidRatioFactor = Math.round(ratio * 15);
  }

  const rawScore = daysFactor + creditUtilizationFactor + brokenPromisesFactor + unpaidRatioFactor;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level: RiskLevel = 'low';
  if (score > 80) {
    level = 'critical';
  } else if (score > 60) {
    level = 'high';
  } else if (score > 30) {
    level = 'medium';
  }

  // Generate deterministic factual summary in Arabic
  const points: string[] = [];
  if (overdueInvoices.length > 0) {
    points.push(`لديه ${overdueInvoices.length} فواتير متأخرة، أقدمها منذ ${maxDaysOverdue} يوماً`);
  }
  if (customer.creditLimit > 0 && customer.outstandingBalance >= customer.creditLimit) {
    points.push(`تجاوز الحد الائتماني المسموح (${Math.round((customer.outstandingBalance / customer.creditLimit) * 100)}%)`);
  }
  if (brokenPromises.length > 0) {
    points.push(`سجل ${brokenPromises.length} وعود دفع لم يتم الوفاء بها`);
  }
  if (points.length === 0) {
    points.push('سجل دفع منتظم بدون تأخيرات حرجة');
  }

  return {
    score,
    level,
    daysFactor,
    creditUtilizationFactor,
    brokenPromisesFactor,
    unpaidRatioFactor,
    summaryAr: points.join('، إضافة إلى ') + '.',
  };
}
