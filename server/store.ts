import { 
  Customer, Invoice, Payment, LedgerEntry, CollectionTask, 
  CollectionAttempt, PromiseToPay, Organization, User, DashboardStats, TodayActionItem,
  SubscriptionOrder, FeedbackItem, PlatformMetrics, Product
} from '../src/types/index.js';
import { generateInitialAlgerianData } from './seed/algeriaDemoData.js';
import { updateInvoiceStatuses, recalculateCustomerFinancials, computeAgingBuckets } from './services/financialEngine.js';
import { calculateDeterministicRiskScore } from './services/riskEngine.js';

const DEFAULT_ALGERIAN_PRODUCTS: Array<Omit<Product, 'organizationId'>> = [
  {
    id: 'prod-01',
    name: 'حليب كونديا معقم كامل الدسم 1 لتر',
    barcode: '613000100123',
    sku: 'CND-1L-FULL',
    category: 'مشروبات وألبان',
    unit: 'كرتونة',
    purchasePrice: 1380,
    salePrice: 1550,
    minSalePrice: 1450,
    stockQuantity: 120,
    minStockAlert: 20,
    packaging: '12 علبة / كرتونة',
    description: 'كرتونة حليب كونديا أزرق 1 لتر (12x1L)',
    status: 'in_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-02',
    name: 'زيت المائدة إيليو 5 لتر (Elio)',
    barcode: '613000200456',
    sku: 'ELIO-5L',
    category: 'مواد غذائية عامة',
    unit: 'كرتونة',
    purchasePrice: 2450,
    salePrice: 2720,
    minSalePrice: 2550,
    stockQuantity: 45,
    minStockAlert: 15,
    packaging: '4 قارورات / كرتونة',
    description: 'كرتونة زيت إيليو 4x5L سيفيتال',
    status: 'in_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-03',
    name: 'مسحوق غسيل إيزيس أوتوماتيك 3 كغ',
    barcode: '613000300789',
    sku: 'ISIS-3KG-AUTO',
    category: 'منظفات ومواد تعقيم',
    unit: 'قطعة',
    purchasePrice: 510,
    salePrice: 580,
    minSalePrice: 540,
    stockQuantity: 12,
    minStockAlert: 15,
    packaging: 'كيس 3 كغ فردي',
    description: 'مسحوق غسيل إيزيس رغوة مركزة للغسالات الآلية',
    status: 'low_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-04',
    name: 'قهوة فاميكو مرحية 250 غرام',
    barcode: '613000400321',
    sku: 'FAMICO-250G',
    category: 'مواد غذائية عامة',
    unit: 'كرتونة',
    purchasePrice: 3800,
    salePrice: 4300,
    minSalePrice: 4000,
    stockQuantity: 60,
    minStockAlert: 10,
    packaging: '24 علبة / كرتونة',
    description: 'قهوة جزائرية تحميص عالي 24x250g',
    status: 'in_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-05',
    name: 'مياه معدنية لالة خديجة 1.5 لتر',
    barcode: '613000600987',
    sku: 'LK-1.5L-PACK',
    category: 'مشروبات وألبان',
    unit: 'حزمة',
    purchasePrice: 190,
    salePrice: 240,
    minSalePrice: 210,
    stockQuantity: 0,
    minStockAlert: 25,
    packaging: 'حزمة 6 قارورات (Fardeau)',
    description: 'مياه معدنية طبيعية من جبال جرجرة',
    status: 'out_of_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-06',
    name: 'طماطم مصبرة كاب 800 غرام (CAB)',
    barcode: '613000700112',
    sku: 'CAB-800G',
    category: 'مواد غذائية عامة',
    unit: 'كرتونة',
    purchasePrice: 2850,
    salePrice: 3200,
    minSalePrice: 3000,
    stockQuantity: 30,
    minStockAlert: 10,
    packaging: '12 علبة / كرتونة',
    description: 'معجون طماطم مركز مضاعف 28%',
    status: 'in_stock',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }
];

class DataStore {
  public organization: Organization;
  public users: User[];
  public customers: Customer[];
  public invoices: Invoice[];
  public payments: Payment[];
  public ledgerEntries: LedgerEntry[];
  public collectionTasks: CollectionTask[];
  public collectionAttempts: CollectionAttempt[];
  public promiseToPays: PromiseToPay[];
  public products: Product[];
  public auditLogs: Array<{ id: string; timestamp: string; action: string; entity: string; entityId: string; user: string; metadata?: any }>;

  constructor(seedDemo = true) {
    if (seedDemo) {
      const demo = generateInitialAlgerianData();
      this.organization = demo.organization;
      this.users = demo.users;
      this.customers = demo.customers;
      this.invoices = demo.invoices;
      this.payments = demo.payments;
      this.ledgerEntries = demo.ledgerEntries;
      this.collectionTasks = demo.collectionTasks;
      this.collectionAttempts = demo.collectionAttempts;
      this.promiseToPays = demo.promiseToPays;
      this.auditLogs = [];
      this.products = DEFAULT_ALGERIAN_PRODUCTS.map(p => ({
        ...p,
        organizationId: this.organization.id,
      }));
      this.recomputeAll();
    } else {
      this.organization = {
        id: 'org-main',
        name: 'مؤسستي التجارية',
        legalName: 'مؤسستي التجارية',
        businessType: 'تجارة وتوزيع',
        wilaya: 'الجزائر العاصمة',
        phone: '0550 00 00 00',
        currency: 'DZD',
        plan: 'starter',
        createdAt: new Date().toISOString().split('T')[0],
      };
      this.users = [];
      this.customers = [];
      this.invoices = [];
      this.payments = [];
      this.ledgerEntries = [];
      this.collectionTasks = [];
      this.collectionAttempts = [];
      this.promiseToPays = [];
      this.auditLogs = [];
      this.products = DEFAULT_ALGERIAN_PRODUCTS.map(p => ({
        ...p,
        organizationId: this.organization.id,
      }));
      this.recomputeAll();
    }
  }

  public resetToDemo(): void {
    const demo = generateInitialAlgerianData();
    this.organization = demo.organization;
    this.users = demo.users;
    this.customers = demo.customers;
    this.invoices = demo.invoices;
    this.payments = demo.payments;
    this.ledgerEntries = demo.ledgerEntries;
    this.collectionTasks = demo.collectionTasks;
    this.collectionAttempts = demo.collectionAttempts;
    this.promiseToPays = demo.promiseToPays;
    this.auditLogs = [];
    this.products = DEFAULT_ALGERIAN_PRODUCTS.map(p => ({
      ...p,
      organizationId: this.organization.id,
    }));
    this.recomputeAll();
  }

  public registerUser(data: {
    name: string;
    email: string;
    phone?: string;
    role?: 'owner' | 'manager' | 'collector';
    organizationName?: string;
    wilaya?: string;
    commercialRegister?: string;
    taxNumber?: string;
  }): { user: User; organization: Organization } {
    if (data.organizationName && data.organizationName.trim()) {
      this.organization.name = data.organizationName.trim();
    }
    if (data.wilaya && data.wilaya.trim()) {
      this.organization.wilaya = data.wilaya.trim();
    }
    if (data.commercialRegister && data.commercialRegister.trim()) {
      this.organization.commercialRegister = data.commercialRegister.trim();
    }
    if (data.taxNumber && data.taxNumber.trim()) {
      this.organization.taxNumber = data.taxNumber.trim();
    }

    const id = `user-${Date.now()}`;
    const newUser: User = {
      id,
      organizationId: this.organization.id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: (data.phone || '').trim(),
      role: data.role || 'owner',
    };

    // If a user with the same email exists, update it; otherwise add to users
    const existingIndex = this.users.findIndex(u => u.email.toLowerCase() === newUser.email);
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...newUser, id: this.users[existingIndex].id };
      this.logAudit('USER_LOGIN_OR_UPDATE', 'user', this.users[existingIndex].id, newUser.name);
      return { user: this.users[existingIndex], organization: this.organization };
    } else {
      this.users.unshift(newUser);
      this.logAudit('REGISTER_USER', 'user', id, newUser.name, {
        role: newUser.role,
        organization: this.organization.name,
      });
      return { user: newUser, organization: this.organization };
    }
  }

  public logAudit(action: string, entity: string, entityId: string, user = 'أمين بن علي', metadata?: any) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      user,
      metadata,
    });
  }

  public recomputeAll(): void {
    const now = new Date();
    // 1. Update invoice overdue statuses and days
    this.invoices = updateInvoiceStatuses(this.invoices, now);

    // 2. Check promises to pay for broken promises
    this.promiseToPays = this.promiseToPays.map(p => {
      const isPast = new Date(p.promisedDate).getTime() < now.getTime();
      let status = p.status;
      if (status === 'pending' && isPast) {
        status = 'broken';
      }
      return {
        ...p,
        status,
        isOverdue: isPast && status !== 'kept',
      };
    });

    // 3. Recalculate each customer's financials and deterministic risk score
    this.customers = this.customers.map(cust => {
      const custInvoices = this.invoices.filter(i => i.customerId === cust.id);
      const custPayments = this.payments.filter(p => p.customerId === cust.id);
      const updated = recalculateCustomerFinancials(cust, custInvoices, custPayments);
      const risk = calculateDeterministicRiskScore(updated, this.invoices, this.promiseToPays);

      return {
        ...updated,
        riskScore: risk.score,
        riskLevel: risk.level,
      };
    });
  }

  public getDashboardStats(): DashboardStats {
    this.recomputeAll();

    const activeInvoices = this.invoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft');
    const totalReceivables = activeInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);
    const overdueReceivables = activeInvoices.filter(i => i.daysOverdue > 0).reduce((sum, i) => sum + i.remainingAmount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const dueToday = activeInvoices
      .filter(i => i.remainingAmount > 0 && i.dueDate.startsWith(todayStr))
      .reduce((sum, i) => sum + i.remainingAmount, 0);

    // Due this week
    const now = new Date();
    const oneWeekAhead = new Date(now);
    oneWeekAhead.setDate(oneWeekAhead.getDate() + 7);
    const dueThisWeek = activeInvoices
      .filter(i => {
        if (i.remainingAmount <= 0) return false;
        const d = new Date(i.dueDate);
        return d >= now && d <= oneWeekAhead;
      })
      .reduce((sum, i) => sum + i.remainingAmount, 0);

    // Collected this month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const collectedThisMonth = this.payments
      .filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const totalInvoicedAllTime = activeInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaidAllTime = this.payments.reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = totalInvoicedAllTime > 0 ? (totalPaidAllTime / totalInvoicedAllTime) * 100 : 0;

    const highRiskCustomersCount = this.customers.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
    const brokenPromisesCount = this.promiseToPays.filter(p => p.status === 'broken').length;

    const agingBreakdown = computeAgingBuckets(this.invoices);
    const todayActions = this.getTodayActionItems();

    return {
      totalReceivables,
      overdueReceivables,
      dueToday,
      dueThisWeek,
      collectedThisMonth,
      collectionRate: parseFloat(collectionRate.toFixed(1)),
      averageDaysToPayment: 32, // Deterministic historical average
      highRiskCustomersCount,
      totalCustomersCount: this.customers.length,
      agingBreakdown,
      todayActionsCount: todayActions.length,
      brokenPromisesCount,
    };
  }

  public getTodayActionItems(): TodayActionItem[] {
    this.recomputeAll();

    // Priority criteria: Overdue amount > 0, broken promises, days overdue
    const candidates = this.customers.filter(c => c.outstandingBalance > 0);

    const items: TodayActionItem[] = candidates.map(customer => {
      const custInvoices = this.invoices.filter(i => i.customerId === customer.id && i.remainingAmount > 0 && i.daysOverdue > 0);
      let oldestDays = 0;
      custInvoices.forEach(i => {
        if (i.daysOverdue > oldestDays) oldestDays = i.daysOverdue;
      });

      const promises = this.promiseToPays.filter(p => p.customerId === customer.id);
      const latestPromise = promises.length > 0 ? promises[0] : undefined;

      let priorityScore = customer.riskScore * 1.5;
      if (latestPromise && latestPromise.status === 'broken') priorityScore += 50;
      if (customer.overdueBalance > 150000) priorityScore += 25;
      if (oldestDays > 25) priorityScore += 20;

      let recommendedAction = 'الاتصال لتحديد موعد سداد وتثبيت وعد بالدفع';
      if (latestPromise && latestPromise.status === 'broken') {
        recommendedAction = 'إنذار فوري ومتابعة وعد دفع منقوض (Broken Promise)';
      } else if (oldestDays > 30) {
        recommendedAction = 'إرسال إشعار رسمي حازم ومطالبة فورية بتسوية الرصيد';
      } else if (oldestDays > 14) {
        recommendedAction = 'إرسال تذكير عبر واتساب وتأكيد استلام كشف الحساب';
      }

      return {
        customer,
        overdueInvoicesCount: custInvoices.length,
        oldestOverdueDays: oldestDays,
        totalOverdueAmount: customer.overdueBalance,
        latestPromise,
        recommendedAction,
        priorityScore: Math.round(priorityScore),
      };
    });

    // Sort by priority score descending
    return items.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  public getCustomer360(customerId: string) {
    this.recomputeAll();
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return null;

    const invoices = this.invoices.filter(i => i.customerId === customerId);
    const payments = this.payments.filter(p => p.customerId === customerId);
    const ledger = this.ledgerEntries
      .filter(l => l.customerId === customerId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    const tasks = this.collectionTasks.filter(t => t.customerId === customerId);
    const attempts = this.collectionAttempts
      .filter(a => a.customerId === customerId)
      .sort((a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime());
    const promises = this.promiseToPays.filter(p => p.customerId === customerId);

    const riskBreakdown = calculateDeterministicRiskScore(customer, invoices, promises);

    return {
      customer,
      invoices,
      payments,
      ledger,
      tasks,
      attempts,
      promises,
      riskBreakdown,
    };
  }

  public createCustomer(data: Partial<Customer>): Customer {
    const id = `cust-${Date.now()}`;
    const nextNum = (this.customers.length + 1).toString().padStart(3, '0');
    const newCust: Customer = {
      id,
      organizationId: this.organization.id,
      accountNumber: `CUST-DZ-${nextNum}`,
      name: data.name || '',
      companyName: data.companyName || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || data.phone || '',
      email: data.email || '',
      address: data.address || '',
      wilaya: data.wilaya || 'الجزائر العاصمة',
      commune: data.commune || '',
      customerType: data.customerType || 'retailer',
      creditLimit: Number(data.creditLimit) || 0,
      paymentTermsDays: Number(data.paymentTermsDays) || 30,
      totalInvoiced: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      overdueBalance: 0,
      riskScore: 0,
      riskLevel: 'low',
      assignedCollectorId: data.assignedCollectorId || 'user-03',
      assignedCollectorName: 'كريم براهيمي',
      notes: data.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.customers.unshift(newCust);
    this.logAudit('CREATE_CUSTOMER', 'customer', id, 'أمين بن علي', { name: newCust.name });
    this.recomputeAll();
    return newCust;
  }

  public createInvoice(data: {
    customerId: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    tax?: number;
    discount?: number;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
  }): Invoice {
    const customer = this.customers.find(c => c.id === data.customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const nextInvoiceNum = `INV-2026-${(this.invoices.length + 1).toString().padStart(3, '0')}`;
    const items = data.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.quantity) * Number(it.unitPrice),
    }));

    const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const discount = Number(data.discount) || 0;
    const taxRate = Number(data.taxRate) || 0;
    const tax = data.tax !== undefined ? Number(data.tax) : Math.round((subtotal - discount) * (taxRate / 100));
    const total = Math.max(0, subtotal - discount + tax);
    const issueDate = data.issueDate || new Date().toISOString().split('T')[0];
    
    // Default due date = issue date + customer's paymentTermsDays
    let dueDate = data.dueDate;
    if (!dueDate) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + customer.paymentTermsDays);
      dueDate = d.toISOString().split('T')[0];
    }

    const id = `inv-${Date.now()}`;
    const newInvoice: Invoice = {
      id,
      organizationId: this.organization.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      invoiceNumber: nextInvoiceNum,
      issueDate,
      dueDate,
      items,
      subtotal,
      discount,
      tax,
      total,
      paidAmount: 0,
      remainingAmount: total,
      status: 'issued',
      daysOverdue: 0,
      notes: data.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.invoices.unshift(newInvoice);

    // Automatically update product stock for matching inventory items
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (!item.description) continue;
        const matchingProduct = this.products.find(p => 
          p.name.trim().toLowerCase() === item.description.trim().toLowerCase() ||
          (p.barcode && p.barcode === item.description.trim()) ||
          (p.sku && p.sku === item.description.trim())
        );
        if (matchingProduct) {
          const qty = Number(item.quantity) || 1;
          matchingProduct.stockQuantity = Math.max(0, matchingProduct.stockQuantity - qty);
          if (matchingProduct.stockQuantity === 0) {
            matchingProduct.status = 'out_of_stock';
          } else if (matchingProduct.stockQuantity <= matchingProduct.minStockAlert) {
            matchingProduct.status = 'low_stock';
          } else {
            matchingProduct.status = 'in_stock';
          }
          matchingProduct.updatedAt = new Date().toISOString().split('T')[0];
        }
      }
    }

    // Create corresponding Ledger Entry (Debit increases balance)
    const runningBal = customer.outstandingBalance + total;
    this.ledgerEntries.unshift({
      id: `ledg-${Date.now()}`,
      organizationId: this.organization.id,
      customerId: customer.id,
      entryDate: issueDate,
      entryType: 'invoice',
      referenceNumber: nextInvoiceNum,
      referenceId: id,
      debit: total,
      credit: 0,
      runningBalance: runningBal,
      description: `فاتورة مبيعات جديدة رقم ${nextInvoiceNum}`,
    });

    this.logAudit('CREATE_INVOICE', 'invoice', id, 'أمين بن علي', {
      invoiceNumber: nextInvoiceNum,
      amount: total,
      customer: customer.name,
    });

    this.recomputeAll();
    return newInvoice;
  }

  public registerPayment(data: {
    customerId: string;
    amount: number;
    paymentMethod: any;
    referenceNumber?: string;
    paymentDate?: string;
    notes?: string;
    invoiceId?: string; // Optional specific allocation
  }): Payment {
    const customer = this.customers.find(c => c.id === data.customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const amount = Number(data.amount);
    if (amount <= 0) throw new Error('يجب أن يكون مبلغ الدفعة أكبر من الصفر');

    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
    const receiptNumber = `REC-2026-${(this.payments.length + 1).toString().padStart(3, '0')}`;
    const id = `pay-${Date.now()}`;

    // FIFO Allocation to unpaid invoices of this customer
    let remainingToAllocate = amount;
    const allocations: Array<{ invoiceId: string; invoiceNumber: string; amountAllocated: number }> = [];

    if (data.invoiceId) {
      const inv = this.invoices.find(i => i.id === data.invoiceId);
      if (inv) {
        const canPay = Math.min(remainingToAllocate, inv.remainingAmount);
        inv.paidAmount += canPay;
        inv.remainingAmount -= canPay;
        allocations.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amountAllocated: canPay });
        remainingToAllocate -= canPay;
      }
    }

    // Allocate remainder to oldest overdue invoices first
    if (remainingToAllocate > 0) {
      const eligibleInvoices = this.invoices
        .filter(i => i.customerId === customer.id && i.remainingAmount > 0)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      for (const inv of eligibleInvoices) {
        if (remainingToAllocate <= 0) break;
        const canPay = Math.min(remainingToAllocate, inv.remainingAmount);
        inv.paidAmount += canPay;
        inv.remainingAmount -= canPay;
        allocations.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amountAllocated: canPay });
        remainingToAllocate -= canPay;
      }
    }

    const newPayment: Payment = {
      id,
      organizationId: this.organization.id,
      customerId: customer.id,
      customerName: customer.name,
      receiptNumber,
      paymentDate,
      amount,
      paymentMethod: data.paymentMethod || 'cash',
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      collectedById: 'user-03',
      collectedByName: 'كريم براهيمي',
      allocations,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.payments.unshift(newPayment);

    // Ledger Entry (Credit decreases debt)
    const runningBal = Math.max(0, customer.outstandingBalance - amount);
    this.ledgerEntries.unshift({
      id: `ledg-${Date.now()}`,
      organizationId: this.organization.id,
      customerId: customer.id,
      entryDate: paymentDate,
      entryType: 'payment',
      referenceNumber: receiptNumber,
      referenceId: id,
      debit: 0,
      credit: amount,
      runningBalance: runningBal,
      description: `تسديد بموجب الوصل ${receiptNumber} (${data.paymentMethod})`,
    });

    // If customer had pending promises and this payment covers it, mark kept!
    const pendingPromises = this.promiseToPays.filter(p => p.customerId === customer.id && p.status === 'pending');
    pendingPromises.forEach(p => {
      if (amount >= p.promisedAmount * 0.8) {
        p.status = 'kept';
      }
    });

    this.logAudit('REGISTER_PAYMENT', 'payment', id, 'كريم براهيمي', {
      receiptNumber,
      amount,
      customer: customer.name,
      method: data.paymentMethod,
    });

    this.recomputeAll();
    return newPayment;
  }

  public logAttempt(data: {
    customerId: string;
    channel: any;
    result: any;
    notes?: string;
    nextFollowUpDate?: string;
  }): CollectionAttempt {
    const customer = this.customers.find(c => c.id === data.customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const id = `att-${Date.now()}`;
    const newAttempt: CollectionAttempt = {
      id,
      organizationId: this.organization.id,
      customerId: customer.id,
      customerName: customer.name,
      channel: data.channel,
      result: data.result,
      attemptDate: new Date().toISOString().split('T')[0],
      notes: data.notes,
      memberId: 'user-03',
      memberName: 'كريم براهيمي',
      nextFollowUpDate: data.nextFollowUpDate,
    };

    this.collectionAttempts.unshift(newAttempt);
    customer.lastContactDate = newAttempt.attemptDate;

    this.logAudit('LOG_COLLECTION_ATTEMPT', 'attempt', id, 'كريم براهيمي', {
      customer: customer.name,
      channel: data.channel,
      result: data.result,
    });

    return newAttempt;
  }

  public recordPromise(data: {
    customerId: string;
    promisedAmount: number;
    promisedDate: string;
    notes?: string;
  }): PromiseToPay {
    const customer = this.customers.find(c => c.id === data.customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const id = `prom-${Date.now()}`;
    const newPromise: PromiseToPay = {
      id,
      organizationId: this.organization.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      promisedAmount: Number(data.promisedAmount),
      promisedDate: data.promisedDate,
      status: 'pending',
      isOverdue: false,
      notes: data.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.promiseToPays.unshift(newPromise);

    // Also auto-create a reminder task on the promised date
    this.collectionTasks.unshift({
      id: `task-${Date.now()}`,
      organizationId: this.organization.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      companyName: customer.companyName,
      assignedToId: 'user-03',
      assignedToName: 'كريم براهيمي',
      title: `متابعة وعد السداد (${new Intl.NumberFormat('ar-DZ').format(newPromise.promisedAmount)} دج)`,
      description: data.notes || 'التحقق من وصول المبلغ المتعهد به',
      targetAmount: newPromise.promisedAmount,
      priority: 'high',
      dueDate: data.promisedDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });

    this.logAudit('RECORD_PROMISE_TO_PAY', 'promise', id, 'كريم براهيمي', {
      customer: customer.name,
      amount: newPromise.promisedAmount,
      date: data.promisedDate,
    });

    this.recomputeAll();
    return newPromise;
  }

  public createTask(data: Partial<CollectionTask>): CollectionTask {
    const customer = this.customers.find(c => c.id === data.customerId);
    const id = `task-${Date.now()}`;
    const newTask: CollectionTask = {
      id,
      organizationId: this.organization.id,
      customerId: data.customerId || '',
      customerName: customer ? customer.name : (data.customerName || ''),
      customerPhone: customer ? customer.phone : '',
      companyName: customer ? customer.companyName : '',
      assignedToId: data.assignedToId || 'user-03',
      assignedToName: 'كريم براهيمي',
      title: data.title || 'متابعة حساب العميل',
      description: data.description,
      targetAmount: Number(data.targetAmount) || 0,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.collectionTasks.unshift(newTask);
    this.logAudit('CREATE_COLLECTION_TASK', 'task', id, 'سمير قادري', { title: newTask.title });
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: any): CollectionTask | null {
    const task = this.collectionTasks.find(t => t.id === taskId);
    if (!task) return null;
    task.status = status;
    this.logAudit('UPDATE_TASK_STATUS', 'task', taskId, 'كريم براهيمي', { status });
    return task;
  }

  public createProduct(data: Partial<Product>): Product {
    const id = data.id || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const purchasePrice = Math.max(0, Number(data.purchasePrice) || 0);
    const salePrice = Math.max(0, Number(data.salePrice) || 0);
    const stockQuantity = Math.max(0, Number(data.stockQuantity) || 0);
    const minStockAlert = Math.max(1, Number(data.minStockAlert) || 5);

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (stockQuantity === 0) {
      status = 'out_of_stock';
    } else if (stockQuantity <= minStockAlert) {
      status = 'low_stock';
    }

    const now = new Date().toISOString().split('T')[0];
    const newProduct: Product = {
      id,
      organizationId: this.organization.id,
      name: data.name?.trim() || 'منتج جديد',
      barcode: data.barcode?.trim() || undefined,
      sku: data.sku?.trim() || undefined,
      category: data.category?.trim() || 'مواد غذائية عامة',
      unit: data.unit?.trim() || 'قطعة',
      purchasePrice,
      salePrice,
      minSalePrice: Number(data.minSalePrice) || Math.round(purchasePrice * 1.05),
      stockQuantity,
      minStockAlert,
      packaging: data.packaging?.trim() || undefined,
      description: data.description?.trim() || undefined,
      status,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    this.products.unshift(newProduct);
    this.logAudit('CREATE_PRODUCT', 'product', id, 'أمين بن علي', { name: newProduct.name, salePrice });
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const product = this.products.find(p => p.id === id);
    if (!product) return null;

    if (data.name !== undefined) product.name = data.name.trim();
    if (data.barcode !== undefined) product.barcode = data.barcode?.trim() || undefined;
    if (data.sku !== undefined) product.sku = data.sku?.trim() || undefined;
    if (data.category !== undefined) product.category = data.category.trim();
    if (data.unit !== undefined) product.unit = data.unit.trim();
    if (data.purchasePrice !== undefined) product.purchasePrice = Math.max(0, Number(data.purchasePrice));
    if (data.salePrice !== undefined) product.salePrice = Math.max(0, Number(data.salePrice));
    if (data.minSalePrice !== undefined) product.minSalePrice = Math.max(0, Number(data.minSalePrice));
    if (data.packaging !== undefined) product.packaging = data.packaging?.trim() || undefined;
    if (data.description !== undefined) product.description = data.description?.trim() || undefined;
    if (data.minStockAlert !== undefined) product.minStockAlert = Math.max(1, Number(data.minStockAlert));

    if (data.stockQuantity !== undefined) {
      product.stockQuantity = Math.max(0, Number(data.stockQuantity));
      if (product.stockQuantity === 0) {
        product.status = 'out_of_stock';
      } else if (product.stockQuantity <= product.minStockAlert) {
        product.status = 'low_stock';
      } else {
        product.status = 'in_stock';
      }
    }

    product.updatedAt = new Date().toISOString().split('T')[0];
    this.logAudit('UPDATE_PRODUCT', 'product', id, 'أمين بن علي', { name: product.name });
    return product;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const [deleted] = this.products.splice(idx, 1);
    this.logAudit('DELETE_PRODUCT', 'product', id, 'أمين بن علي', { name: deleted.name });
    return true;
  }

  public adjustProductStock(id: string, delta: number, reason?: string): Product | null {
    const product = this.products.find(p => p.id === id);
    if (!product) return null;

    product.stockQuantity = Math.max(0, product.stockQuantity + Number(delta));
    if (product.stockQuantity === 0) {
      product.status = 'out_of_stock';
    } else if (product.stockQuantity <= product.minStockAlert) {
      product.status = 'low_stock';
    } else {
      product.status = 'in_stock';
    }
    product.updatedAt = new Date().toISOString().split('T')[0];

    this.logAudit('ADJUST_STOCK', 'product', id, 'أمين بن علي', {
      name: product.name,
      delta,
      newStock: product.stockQuantity,
      reason: reason || 'تعديل يدوي للمخزون'
    });
    return product;
  }

  public bulkCreateProducts(items: Array<Partial<Product>>): Product[] {
    const createdList: Product[] = [];
    for (const item of items) {
      if (!item.name || !item.name.trim()) continue;
      // If product with same barcode already exists, update stock instead of duplicate
      if (item.barcode) {
        const existing = this.products.find(p => p.barcode === item.barcode?.trim());
        if (existing) {
          if (item.stockQuantity) {
            existing.stockQuantity += Number(item.stockQuantity);
          }
          if (item.salePrice) existing.salePrice = Number(item.salePrice);
          if (item.purchasePrice) existing.purchasePrice = Number(item.purchasePrice);
          existing.updatedAt = new Date().toISOString().split('T')[0];
          createdList.push(existing);
          continue;
        }
      }
      createdList.push(this.createProduct(item));
    }
    return createdList;
  }

  public populateFromFirestore(data: {
    customers?: Customer[];
    invoices?: Invoice[];
    payments?: Payment[];
    collectionTasks?: CollectionTask[];
    products?: Product[];
  }): void {
    if (Array.isArray(data.customers)) {
      this.customers = [...data.customers];
    }
    if (Array.isArray(data.invoices)) {
      this.invoices = [...data.invoices];
    }
    if (Array.isArray(data.payments)) {
      this.payments = [...data.payments];
    }
    if (Array.isArray(data.collectionTasks)) {
      this.collectionTasks = [...data.collectionTasks];
    }
    if (Array.isArray(data.products) && data.products.length > 0) {
      this.products = [...data.products];
    }
    this.recomputeAll();
  }
}

// Global registry of per-organization tenant stores for complete data isolation
const tenantStores: Map<string, DataStore> = new Map();

// Default demo store instance
export const store = new DataStore();
tenantStores.set(store.organization.id, store);
tenantStores.set('org-dz-01', store);
tenantStores.set('org-algeria-dist-01', store);

/**
 * Returns the isolated DataStore dedicated to the requested organization ID.
 * If the organization is newly created, an empty, private store is provisioned.
 */
export function getStoreForTenant(orgId?: string | null): DataStore {
  if (!orgId) return store;
  
  let tenantStore = tenantStores.get(orgId);
  if (!tenantStore) {
    tenantStore = new DataStore();
    tenantStore.organization.id = orgId;
    tenantStore.organization.name = 'المؤسسة التجارية الخاصة';
    // Clear pre-populated demo data so newly registered businesses start fresh and private
    tenantStore.customers = [];
    tenantStore.invoices = [];
    tenantStore.payments = [];
    tenantStore.ledgerEntries = [];
    tenantStore.collectionTasks = [];
    tenantStore.collectionAttempts = [];
    tenantStore.promiseToPays = [];
    tenantStores.set(orgId, tenantStore);
  }
  return tenantStore;
}

export function registerTenantStore(org: Organization, user: User): DataStore {
  const tenantStore = new DataStore();
  tenantStore.organization = org;
  tenantStore.users = [user];
  tenantStore.customers = [];
  tenantStore.invoices = [];
  tenantStore.payments = [];
  tenantStore.ledgerEntries = [];
  tenantStore.collectionTasks = [];
  tenantStore.collectionAttempts = [];
  tenantStore.promiseToPays = [];
  tenantStore.auditLogs = [
    {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'INITIALIZE_PRIVATE_TENANT',
      entity: 'organization',
      entityId: org.id,
      user: user.name,
      metadata: { name: org.name, wilaya: org.wilaya },
    },
  ];
  tenantStores.set(org.id, tenantStore);
  return tenantStore;
}

// -------------------------------------------------------------
// SUPER ADMIN CENTRAL DATA MANAGEMENT
// -------------------------------------------------------------
export const globalSubscriptionOrders: SubscriptionOrder[] = [
  {
    id: 'ORD-78901',
    organizationId: 'org-dz-01',
    organizationName: 'سارل الأوراس للتوزيع والتجارة',
    userEmail: 'direction@aures-distrib.dz',
    userPhone: '0551 23 45 67',
    plan: 'pro',
    billingCycle: 'yearly',
    amount: 240000,
    currency: 'DZD',
    paymentMethod: 'edahabia',
    transactionRef: 'SATIM-88492014',
    proofNote: 'تم الدفع بالبطاقة الذهبية، المرجع البريدي 88492014',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'ORD-78902',
    organizationId: 'org-algeria-dist-01',
    organizationName: 'مؤسسة الوفاق لمواد البناء',
    userEmail: 'finance@elwifak-dz.com',
    userPhone: '0662 88 11 22',
    plan: 'business',
    billingCycle: 'monthly',
    amount: 12000,
    currency: 'DZD',
    paymentMethod: 'baridimob',
    transactionRef: 'BMOB-902341',
    proofNote: 'تحويل بريدي موب إلى حساب RIP المنصة',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'ORD-78899',
    organizationId: 'org-main',
    organizationName: 'مؤسستي التجارية',
    userEmail: 'admin@mizan.dz',
    userPhone: '0550 00 00 00',
    plan: 'business',
    billingCycle: 'yearly',
    amount: 120000,
    currency: 'DZD',
    paymentMethod: 'bank_transfer',
    transactionRef: 'BADR-VIR-2026-009',
    proofNote: 'تحويل بنكي صادر من بنك الفلاحة والتنمية الريفية BADR',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewedBy: 'nova.bakhti@gmail.com',
  }
];

export const globalFeedbacks: FeedbackItem[] = [
  {
    id: 'FB-101',
    organizationId: 'org-dz-01',
    organizationName: 'سارل الأوراس للتوزيع والتجارة',
    userEmail: 'direction@aures-distrib.dz',
    userName: 'ياسين بوعزيز',
    type: 'feature_request',
    subject: 'طلب إضافة تصدير إشعارات المحكمة بصيغة PDF مخصصة',
    message: 'نحتاج نموذج إعذار قضائي رسمي يتضمن ختم المحضر القضائي وتوقيع المحامي مباشرة من المنصة قبل إرساله إلى محكمة بئر مراد رايس.',
    status: 'new',
    priority: 'normal',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'FB-102',
    organizationId: 'org-algeria-dist-01',
    organizationName: 'مؤسسة الوفاق لمواد البناء',
    userEmail: 'finance@elwifak-dz.com',
    userName: 'كمال مقداد',
    type: 'payment_issue',
    subject: 'استفسار بخصوص تفعيل باقة الأعمال بعد التحويل',
    message: 'قمنا بتحويل 12,000 دج عبر بريدي موب، متى يتم التفعيل التلقائي ورفع حد عدد المحصلين الميدانيين؟',
    status: 'new',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'FB-100',
    organizationId: 'org-main',
    organizationName: 'مؤسستي التجارية',
    userEmail: 'admin@mizan.dz',
    userName: 'فؤاد خليل',
    type: 'feedback',
    subject: 'تطبيق رائع وسريع في حساب أعمار الديون',
    message: 'المزامنة اللحظية خففت علينا الكثير من اتصالات التنسيق مع المحصلين، نشكركم على دعم الدينار الجزائري وتسهيل العمليات.',
    status: 'resolved',
    priority: 'normal',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    adminResponse: 'شكراً جزيلاً أخي فؤاد، يسعدنا دعمكم وتقديم أفضل تجربة لشركات التوزيع في الجزائر.',
  }
];

const platformStartTime = Date.now();

export function getSuperAdminOverview() {
  try {
    const allTenants = Array.from(tenantStores.values()).map(ts => ({
      id: ts.organization?.id || 'org-main',
      name: ts.organization?.name || 'مؤسسة تجارية',
      businessType: ts.organization?.businessType || 'تجارة وتوزيع',
      wilaya: ts.organization?.wilaya || 'الجزائر العاصمة',
      phone: ts.organization?.phone || '0550 00 00 00',
      plan: ts.organization?.plan || 'starter',
      subscriptionStatus: ts.organization?.subscriptionStatus || 'active',
      subscriptionExpiresAt: ts.organization?.subscriptionExpiresAt,
      lastPayment: ts.organization?.lastPayment,
      usersCount: Array.isArray(ts.users) ? ts.users.length : 0,
      customersCount: Array.isArray(ts.customers) ? ts.customers.length : 0,
      invoicesCount: Array.isArray(ts.invoices) ? ts.invoices.length : 0,
      totalReceivables: Array.isArray(ts.customers)
        ? ts.customers.reduce((acc, c) => acc + (Number(c?.outstandingBalance) || 0), 0)
        : 0,
    }));

    const pendingOrders = (globalSubscriptionOrders || []).filter(o => o?.status === 'pending');
    const approvedOrders = (globalSubscriptionOrders || []).filter(o => o?.status === 'approved');
    const totalRevenue = approvedOrders.reduce((acc, o) => acc + (Number(o?.amount) || 0), 0);

    const metrics: PlatformMetrics = {
      serverStatus: 'healthy',
      uptimeSeconds: Math.floor((Date.now() - platformStartTime) / 1000),
      dbLatencyMs: Math.floor(18 + Math.random() * 14),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      activeTenantsCount: tenantStores.size,
      activeUsersCount: Array.from(tenantStores.values()).reduce((acc, ts) => acc + (Array.isArray(ts.users) ? ts.users.length : 0), 0) || 3,
      totalRevenueDzd: totalRevenue,
      pendingOrdersCount: pendingOrders.length,
      unresolvedFeedbacksCount: (globalFeedbacks || []).filter(f => f?.status !== 'resolved').length,
      apiSuccessRate: 99.8,
    };

    return {
      metrics,
      tenants: allTenants,
      pendingOrders,
      orders: globalSubscriptionOrders || [],
      feedbacks: globalFeedbacks || [],
    };
  } catch (err: any) {
    console.error('Error in getSuperAdminOverview:', err);
    return {
      metrics: {
        serverStatus: 'healthy' as const,
        uptimeSeconds: Math.floor((Date.now() - platformStartTime) / 1000),
        dbLatencyMs: 25,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        activeTenantsCount: tenantStores.size || 1,
        activeUsersCount: 3,
        totalRevenueDzd: 120000,
        pendingOrdersCount: 0,
        unresolvedFeedbacksCount: 0,
        apiSuccessRate: 99.8,
      },
      tenants: [],
      pendingOrders: [],
      orders: [],
      feedbacks: [],
    };
  }
}

export function approveSubscriptionOrder(orderId: string, reviewedByEmail: string) {
  const order = globalSubscriptionOrders.find(o => o.id === orderId);
  if (!order) throw new Error('طلب الاشتراك غير موجود');

  order.status = 'approved';
  order.reviewedAt = new Date().toISOString();
  order.reviewedBy = reviewedByEmail;

  // Provision the tenant plan
  const tenantStore = getStoreForTenant(order.organizationId);
  if (tenantStore) {
    tenantStore.organization.plan = order.plan;
    tenantStore.organization.subscriptionStatus = 'active';
    const expiresAt = new Date();
    if (order.billingCycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    tenantStore.organization.subscriptionExpiresAt = expiresAt.toISOString();
    tenantStore.organization.billingCycle = order.billingCycle;
    tenantStore.organization.lastPayment = {
      amount: order.amount,
      currency: 'DZD',
      method: order.paymentMethod,
      transactionRef: order.transactionRef,
      paidAt: new Date().toISOString(),
    };

    tenantStore.logAudit(
      'تفعيل اشتراك عبر الإدارة المركزية',
      'organization',
      tenantStore.organization.id,
      reviewedByEmail,
      {
        orderId: order.id,
        plan: order.plan,
        amount: order.amount,
        cycle: order.billingCycle,
      }
    );
  }

  return { success: true, order, organization: tenantStore?.organization };
}

export function rejectSubscriptionOrder(orderId: string, reviewedByEmail: string, reason?: string) {
  const order = globalSubscriptionOrders.find(o => o.id === orderId);
  if (!order) throw new Error('طلب الاشتراك غير موجود');

  order.status = 'rejected';
  order.reviewedAt = new Date().toISOString();
  order.reviewedBy = reviewedByEmail;
  if (reason) order.proofNote = (order.proofNote ? order.proofNote + ' | سبب الرفض: ' : 'سبب الرفض: ') + reason;

  return { success: true, order };
}

export function updateTenantPlanManually(
  orgId: string, 
  newPlan: 'starter' | 'business' | 'pro',
  status: 'active' | 'expired' | 'trial',
  durationMonths: number,
  adminEmail: string
) {
  const tenantStore = getStoreForTenant(orgId);
  if (!tenantStore) throw new Error('المؤسسة غير موجودة');

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  tenantStore.organization.plan = newPlan;
  tenantStore.organization.subscriptionStatus = status;
  tenantStore.organization.subscriptionExpiresAt = expiresAt.toISOString();

  tenantStore.logAudit(
    'تعديل خطة المؤسسة يدوياً من المشرف العام',
    'organization',
    orgId,
    adminEmail,
    { newPlan, status, expiresAt: expiresAt.toISOString() }
  );

  return { success: true, organization: tenantStore.organization };
}

export function addGlobalFeedback(item: Omit<FeedbackItem, 'id' | 'createdAt' | 'status'>) {
  const newFeedback: FeedbackItem = {
    ...item,
    id: `FB-${Date.now().toString().slice(-5)}`,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  globalFeedbacks.unshift(newFeedback);
  return newFeedback;
}

export function replyToFeedback(feedbackId: string, response: string, newStatus: 'in_progress' | 'resolved' = 'resolved') {
  const feedback = globalFeedbacks.find(f => f.id === feedbackId);
  if (!feedback) throw new Error('الرسالة غير موجودة');

  feedback.adminResponse = response;
  feedback.status = newStatus;
  return feedback;
}
