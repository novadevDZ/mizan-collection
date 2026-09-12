export type Role = 'owner' | 'manager' | 'collector' | 'super_admin';

export type CustomerType = 'wholesaler' | 'retailer' | 'distributor' | 'company' | 'individual';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'ccp' | 'edahabia' | 'cib' | 'bank_transfer' | 'cheque' | 'other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type AttemptChannel = 'phone' | 'whatsapp' | 'sms' | 'email' | 'in_person';

export type AttemptResult = 
  | 'answered' 
  | 'no_answer' 
  | 'busy' 
  | 'promise_to_pay' 
  | 'dispute' 
  | 'refusal' 
  | 'wrong_number';

export type PromiseStatus = 'pending' | 'kept' | 'broken' | 'cancelled';

export type LedgerEntryType = 'invoice' | 'payment' | 'adjustment' | 'refund';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  organizationId: string;
  isSuperAdmin?: boolean;
}

export interface SubscriptionOrder {
  id: string;
  organizationId: string;
  organizationName: string;
  userEmail: string;
  userPhone?: string;
  plan: 'starter' | 'business' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  proofNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FeedbackItem {
  id: string;
  organizationId: string;
  organizationName: string;
  userEmail: string;
  userName: string;
  type: 'feedback' | 'feature_request' | 'bug' | 'payment_issue';
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'normal' | 'urgent';
  createdAt: string;
  adminResponse?: string;
}

export interface PlatformMetrics {
  serverStatus: 'healthy' | 'degraded' | 'maintenance';
  uptimeSeconds: number;
  dbLatencyMs: number;
  memoryUsageMb: number;
  activeTenantsCount: number;
  activeUsersCount: number;
  totalRevenueDzd: number;
  pendingOrdersCount: number;
  unresolvedFeedbacksCount: number;
  apiSuccessRate: number;
}

export interface Organization {
  id: string;
  name: string;
  tradeName?: string;
  legalName?: string;
  commercialRegister?: string;
  taxNumber?: string;
  businessType: string;
  wilaya: string;
  commune?: string;
  phone: string;
  currency: string;
  plan: 'starter' | 'business' | 'pro';
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'pending';
  subscriptionExpiresAt?: string;
  subscriptionStartedAt?: string;
  billingCycle?: 'monthly' | 'yearly';
  lastPayment?: {
    amount: number;
    currency: string;
    method: string;
    transactionRef: string;
    paidAt: string;
  };
  createdAt?: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  accountNumber: string;
  name: string;
  companyName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  wilaya: string;
  commune?: string;
  customerType: CustomerType;
  creditLimit: number;
  paymentTermsDays: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  overdueBalance: number;
  oldestDueDate?: string;
  lastPaymentDate?: string;
  lastContactDate?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  daysOverdue: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amountAllocated: number;
}

export interface Payment {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  collectedById: string;
  collectedByName: string;
  allocations?: PaymentAllocation[];
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  organizationId: string;
  customerId: string;
  entryDate: string;
  entryType: LedgerEntryType;
  referenceNumber: string;
  referenceId: string;
  debit: number;   // Invoiced (increases debt)
  credit: number;  // Paid (decreases debt)
  runningBalance: number;
  description: string;
}

export interface CollectionTask {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  companyName: string;
  assignedToId?: string;
  assignedToName?: string;
  title: string;
  description?: string;
  targetAmount: number;
  priority: TaskPriority;
  dueDate: string;
  status: taskStatusEnum;
  daysOverdue?: number;
  createdAt: string;
}
export type taskStatusEnum = TaskStatus;

export interface CollectionAttempt {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  channel: AttemptChannel;
  result: AttemptResult;
  attemptDate: string;
  notes?: string;
  memberId: string;
  memberName: string;
  nextFollowUpDate?: string;
}

export interface PromiseToPay {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  promisedAmount: number;
  promisedDate: string;
  status: PromiseStatus;
  notes?: string;
  isOverdue: boolean;
  createdAt: string;
}

export interface AgingBucket {
  key: 'current' | 'days_1_7' | 'days_8_30' | 'days_31_60' | 'days_61_90' | 'days_90_plus';
  labelAr: string;
  labelFr: string;
  amount: number;
  percentage: number;
  customerCount: number;
  invoiceCount: number;
}

export interface DashboardStats {
  totalReceivables: number;
  overdueReceivables: number;
  dueToday: number;
  dueThisWeek: number;
  collectedThisMonth: number;
  collectionRate: number; // percentage e.g. 74.5%
  averageDaysToPayment: number;
  highRiskCustomersCount: number;
  totalCustomersCount: number;
  agingBreakdown: AgingBucket[];
  todayActionsCount: number;
  brokenPromisesCount: number;
}

export interface TodayActionItem {
  customer: Customer;
  overdueInvoicesCount: number;
  oldestOverdueDays: number;
  totalOverdueAmount: number;
  latestPromise?: PromiseToPay;
  recommendedAction: string;
  priorityScore: number;
}

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  barcode?: string;
  sku?: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice?: number;
  stockQuantity: number;
  minStockAlert: number;
  packaging?: string;
  description?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SmartProductParsedItem {
  name: string;
  barcode?: string;
  sku?: string;
  category?: string;
  unit?: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice?: number;
  stockQuantity: number;
  minStockAlert?: number;
  packaging?: string;
  confidence?: number;
}
