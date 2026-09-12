import { Customer, Invoice, Payment, LedgerEntry, AgingBucket } from '../../src/types/index.js';

export function calculateDaysOverdue(dueDateString: string, referenceDate: Date = new Date()): number {
  const due = new Date(dueDateString);
  const diffTime = referenceDate.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function updateInvoiceStatuses(invoices: Invoice[], referenceDate: Date = new Date()): Invoice[] {
  return invoices.map(inv => {
    const daysOverdue = calculateDaysOverdue(inv.dueDate, referenceDate);
    let status = inv.status;
    if (inv.remainingAmount <= 0) {
      status = 'paid';
    } else if (daysOverdue > 0 && inv.status !== 'cancelled' && inv.status !== 'draft') {
      status = 'overdue';
    } else if (inv.paidAmount > 0 && inv.remainingAmount > 0) {
      status = 'partially_paid';
    } else if (inv.status !== 'cancelled' && inv.status !== 'draft') {
      status = 'issued';
    }

    return {
      ...inv,
      status,
      daysOverdue: status === 'paid' ? 0 : daysOverdue,
    };
  });
}

export function recalculateCustomerFinancials(
  customer: Customer,
  customerInvoices: Invoice[],
  customerPayments: Payment[]
): Customer {
  // Deterministic calculation
  const totalInvoiced = customerInvoices
    .filter(inv => inv.status !== 'cancelled' && inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = customerPayments
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

  const overdueInvoices = customerInvoices.filter(inv => 
    inv.remainingAmount > 0 && inv.daysOverdue > 0 && inv.status !== 'cancelled'
  );

  const overdueBalance = overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  // Oldest due date
  let oldestDueDate: string | undefined = undefined;
  if (overdueInvoices.length > 0) {
    const sorted = [...overdueInvoices].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    oldestDueDate = sorted[0].dueDate;
  }

  // Last payment date
  let lastPaymentDate: string | undefined = undefined;
  if (customerPayments.length > 0) {
    const sortedPayments = [...customerPayments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    lastPaymentDate = sortedPayments[0].paymentDate;
  }

  return {
    ...customer,
    totalInvoiced,
    totalPaid,
    outstandingBalance,
    overdueBalance,
    oldestDueDate,
    lastPaymentDate,
  };
}

export function computeAgingBuckets(invoices: Invoice[]): AgingBucket[] {
  const buckets: Record<string, { amount: number; customerIds: Set<string>; invoiceCount: number }> = {
    current: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
    days_1_7: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
    days_8_30: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
    days_31_60: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
    days_61_90: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
    days_90_plus: { amount: 0, customerIds: new Set(), invoiceCount: 0 },
  };

  let totalReceivables = 0;

  invoices.forEach(inv => {
    if (inv.remainingAmount <= 0 || inv.status === 'cancelled' || inv.status === 'draft') return;
    totalReceivables += inv.remainingAmount;

    if (inv.daysOverdue === 0) {
      buckets.current.amount += inv.remainingAmount;
      buckets.current.customerIds.add(inv.customerId);
      buckets.current.invoiceCount++;
    } else if (inv.daysOverdue <= 7) {
      buckets.days_1_7.amount += inv.remainingAmount;
      buckets.days_1_7.customerIds.add(inv.customerId);
      buckets.days_1_7.invoiceCount++;
    } else if (inv.daysOverdue <= 30) {
      buckets.days_8_30.amount += inv.remainingAmount;
      buckets.days_8_30.customerIds.add(inv.customerId);
      buckets.days_8_30.invoiceCount++;
    } else if (inv.daysOverdue <= 60) {
      buckets.days_31_60.amount += inv.remainingAmount;
      buckets.days_31_60.customerIds.add(inv.customerId);
      buckets.days_31_60.invoiceCount++;
    } else if (inv.daysOverdue <= 90) {
      buckets.days_61_90.amount += inv.remainingAmount;
      buckets.days_61_90.customerIds.add(inv.customerId);
      buckets.days_61_90.invoiceCount++;
    } else {
      buckets.days_90_plus.amount += inv.remainingAmount;
      buckets.days_90_plus.customerIds.add(inv.customerId);
      buckets.days_90_plus.invoiceCount++;
    }
  });

  const bucketDefs: Array<{ key: AgingBucket['key']; labelAr: string; labelFr: string }> = [
    { key: 'current', labelAr: 'مستحقة لاحقاً (ضمن الأجل)', labelFr: 'Courant' },
    { key: 'days_1_7', labelAr: '1 - 7 أيام تأخير', labelFr: '1 - 7 jours' },
    { key: 'days_8_30', labelAr: '8 - 30 يوماً تأخير', labelFr: '8 - 30 jours' },
    { key: 'days_31_60', labelAr: '31 - 60 يوماً تأخير', labelFr: '31 - 60 jours' },
    { key: 'days_61_90', labelAr: '61 - 90 يوماً تأخير', labelFr: '61 - 90 jours' },
    { key: 'days_90_plus', labelAr: 'أكثر من 90 يوماً (+90)', labelFr: '+90 jours' },
  ];

  return bucketDefs.map(def => {
    const data = buckets[def.key];
    const percentage = totalReceivables > 0 ? (data.amount / totalReceivables) * 100 : 0;
    return {
      key: def.key,
      labelAr: def.labelAr,
      labelFr: def.labelFr,
      amount: Math.round(data.amount),
      percentage: parseFloat(percentage.toFixed(1)),
      customerCount: data.customerIds.size,
      invoiceCount: data.invoiceCount,
    };
  });
}
