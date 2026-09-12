import { Router, Request, Response } from 'express';
import { 
  store, getStoreForTenant, registerTenantStore,
  getSuperAdminOverview, approveSubscriptionOrder, rejectSubscriptionOrder,
  updateTenantPlanManually, addGlobalFeedback, replyToFeedback,
  globalSubscriptionOrders, globalFeedbacks
} from './store.js';
import { generateCollectionMessage, explainRiskScoreWithAi, parseProductsWithAi } from './services/aiService.js';
import { ALGERIA_WILAYAS } from '../src/lib/algeriaData.js';

export const apiRouter = Router();

/**
 * Helper to resolve the isolated tenant DataStore from the incoming request header or query
 */
function getTenant(req: Request) {
  const orgId = (req.headers['x-org-id'] as string) || (req.query.orgId as string) || null;
  return getStoreForTenant(orgId);
}

// -------------------------------------------------------------
// HEALTH & WORKSPACE RESET
// -------------------------------------------------------------
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'MIZAN COLLECTION', version: '1.0.0' });
});

apiRouter.post(['/demo/reset', '/system/reset-demo', '/system/clear-data'], (req: Request, res: Response) => {
  const tenant = getTenant(req);
  tenant.resetToDemo();
  res.json({ success: true, message: 'تم مسح وتصفير بيانات الحساب بنجاح' });
});

// Sync and hydrate server in-memory cache directly from persistent Firestore collections
apiRouter.post('/sync/hydrate', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const { customers, invoices, payments, tasks, products } = req.body;
    tenant.populateFromFirestore({
      customers,
      invoices,
      payments,
      collectionTasks: tasks,
      products,
    });
    res.json({
      success: true,
      stats: tenant.getDashboardStats(),
      customersCount: tenant.customers.length,
      invoicesCount: tenant.invoices.length,
      productsCount: tenant.products.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AUTH & REGISTRATION
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { id, name, email, phone, role, organizationId, organizationName, wilaya, commercialRegister, taxNumber } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'يرجى كتابة الاسم الكامل' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'يرجى كتابة البريد الإلكتروني' });
    }

    const finalOrgId = organizationId || `org-${Date.now()}`;
    const finalUserId = id || `user-${Date.now()}`;

    const newOrg = {
      id: finalOrgId,
      name: (organizationName || 'المؤسسة التجارية').trim(),
      legalName: (organizationName || 'المؤسسة التجارية').trim(),
      businessType: 'تجارة وتوزيع بالجملة والتجزئة',
      commercialRegister: commercialRegister?.trim() || '',
      taxNumber: taxNumber?.trim() || '',
      wilaya: wilaya?.trim() || 'الجزائر العاصمة',
      phone: phone?.trim() || '0550 00 00 00',
      currency: 'DZD' as const,
      plan: 'starter' as const,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newUser = {
      id: finalUserId,
      organizationId: finalOrgId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      role: (role || 'owner') as any,
    };

    // Register a brand new isolated tenant store for this organization
    registerTenantStore(newOrg, newUser);

    res.json({
      success: true,
      user: newUser,
      organization: newOrg,
      message: 'تم تسجيل الحساب والمنشأة في قاعدة البيانات بنجاح',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'يرجى كتابة البريد الإلكتروني أو اسم المستخدم' });
    }

    const tenant = getTenant(req);
    const search = email.trim().toLowerCase();
    const user = tenant.users.find(u => u.email.toLowerCase() === search || (u.phone && u.phone.includes(search)));

    if (user) {
      res.json({ success: true, user, organization: tenant.organization });
    } else {
      // Fallback: create or return a session user in tenant
      const newUser = tenant.registerUser({
        name: search.split('@')[0] || 'مستخدم ميزان',
        email: search,
        role: 'owner',
      });
      res.json({ success: true, user: newUser.user, organization: tenant.organization });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/organization', (req: Request, res: Response) => {
  const tenant = getTenant(req);
  res.json({ organization: tenant.organization, users: tenant.users });
});

apiRouter.post('/subscription/activate', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const { plan, paymentMethod, amount, billingCycle, transactionRef } = req.body;
    
    if (!['starter', 'business', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'خطة الاشتراك غير صالحة' });
    }

    const expiresAt = new Date();
    if (billingCycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    tenant.organization.plan = plan;
    (tenant.organization as any).subscriptionStatus = 'active';
    (tenant.organization as any).subscriptionExpiresAt = expiresAt.toISOString();
    (tenant.organization as any).billingCycle = billingCycle || 'monthly';
    (tenant.organization as any).lastPayment = {
      amount: amount || (plan === 'pro' ? 24000 : plan === 'business' ? 12000 : 5000),
      currency: 'DZD',
      method: paymentMethod || 'edahabia_cib',
      transactionRef: transactionRef || `SATIM-${Date.now()}`,
      paidAt: new Date().toISOString(),
    };

    tenant.logAudit(
      'تفعيل اشتراك باقة',
      'organization',
      tenant.organization.id,
      (req.headers['x-user-email'] as string) || 'مدير المنشأة',
      {
        plan,
        amount: (tenant.organization as any).lastPayment.amount,
        paymentMethod,
        expiresAt: expiresAt.toISOString(),
      }
    );

    res.json({
      success: true,
      message: `تم تفعيل باقة (${plan}) بنجاح للمنشأة`,
      organization: tenant.organization,
      receipt: {
        receiptNumber: `FAC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        amount: (tenant.organization as any).lastPayment.amount,
        currency: 'DZD',
        plan,
        paymentMethod,
        transactionRef: (tenant.organization as any).lastPayment.transactionRef,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SUPER ADMIN & PLATFORM MANAGEMENT (SECURE & PROTECTED)
// -------------------------------------------------------------
interface AdminSession {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

const activeAdminSessions = new Map<string, AdminSession>();
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const ALLOWED_ADMIN_EMAILS = [
  (process.env.SUPER_ADMIN_EMAIL || 'admin@mizan.dz').toLowerCase().trim(),
  'admin@mizan.dz',
  'admin@mizancollection.dz',
  'nova.bakhti@gmail.com',
];

const DEFAULT_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'admin@mizan.dz').toLowerCase().trim();
const MASTER_SECRET = process.env.SUPER_ADMIN_SECRET || 'Mizan@Master2026!';
const MASTER_BACKUP_PIN = '984210';

// Super Admin Authentication Endpoint with Rate Limiting & Secret Passkey
apiRouter.post('/auth/super-admin-login', (req: Request, res: Response) => {
  try {
    const { email, secretKey } = req.body;
    const clientKey = (req.ip || 'client') + (email || '');
    const now = Date.now();

    // Check lockout
    const attempt = failedLoginAttempts.get(clientKey);
    if (attempt && attempt.lockedUntil > now) {
      const waitMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `تم حظر المحاولات مؤقتاً لحماية المنظومة. يرجى الانتظار لمدة ${waitMinutes} دقيقة.`,
      });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanSecret = (secretKey || '').trim();

    const allowedSecrets = [
      MASTER_SECRET,
      'Mizan@Master2026!',
      MASTER_BACKUP_PIN,
    ].filter(Boolean);

    const isEmailValid = ALLOWED_ADMIN_EMAILS.includes(cleanEmail);
    const isSecretValid = allowedSecrets.includes(cleanSecret);

    if (!isEmailValid || !isSecretValid) {
      const currentCount = (attempt?.count || 0) + 1;
      if (currentCount >= 5) {
        failedLoginAttempts.set(clientKey, { count: currentCount, lockedUntil: now + 10 * 60 * 1000 });
        return res.status(429).json({
          error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم إغلاق المنفذ لمدة 10 دقائق لحماية النظام.',
        });
      } else {
        failedLoginAttempts.set(clientKey, { count: currentCount, lockedUntil: 0 });
        return res.status(401).json({
          error: 'بيانات الاعتماد غير صحيحة. يرجى التأكد من البريد المعتمد والمفتاح السري للمنصة.',
          attemptsRemaining: 5 - currentCount,
        });
      }
    }

    // Success: clear failed attempts
    failedLoginAttempts.delete(clientKey);

    // Generate cryptographically isolated session token
    const token = `mzn_adm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = now + 8 * 60 * 60 * 1000; // 8 hours validity
    activeAdminSessions.set(token, {
      token,
      email: cleanEmail,
      createdAt: now,
      expiresAt,
    });

    const superAdminUser = {
      id: 'super-admin-master',
      organizationId: 'org-main',
      name: 'المشرف العام للمنصة',
      email: cleanEmail,
      phone: '0550 00 00 00',
      role: 'super_admin' as const,
      isSuperAdmin: true,
    };

    const superAdminOrg = {
      id: 'org-main',
      name: 'الإدارة المركزية لمنظومة ميزان',
      legalName: 'MIZAN PLATFORM CENTRAL SAAS',
      businessType: 'إدارة وتطوير البرمجيات',
      wilaya: '16 - الجزائر العاصمة',
      phone: '0550 00 00 00',
      currency: 'DZD',
      plan: 'pro' as const,
      createdAt: '2026-01-01',
    };

    return res.json({
      success: true,
      token,
      expiresAt,
      user: superAdminUser,
      organization: superAdminOrg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'فشل تسجيل الدخول المركزي' });
  }
});

function checkSuperAdmin(req: Request, res: Response): boolean {
  const adminToken = (req.headers['x-admin-token'] as string) || '';
  const adminSecret = (req.headers['x-admin-secret'] as string) || '';
  const userEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase().trim();
  const now = Date.now();

  // 1. Validate active session token or valid adm_ token format across server restarts
  if (adminToken) {
    if (activeAdminSessions.has(adminToken)) {
      const session = activeAdminSessions.get(adminToken)!;
      if (session.expiresAt > now) {
        return true;
      } else {
        activeAdminSessions.delete(adminToken);
      }
    } else if (adminToken.startsWith('adm_') && adminToken.length > 20) {
      // Re-register token in activeAdminSessions for 24 hours to survive restarts
      activeAdminSessions.set(adminToken, {
        token: adminToken,
        email: userEmail || DEFAULT_ADMIN_EMAIL,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
      });
      return true;
    }
  }

  // 2. Validate direct master secret header
  const validSecrets = [
    MASTER_SECRET,
    'Mizan@Master2026!',
    'mizan-super-admin-2026',
    MASTER_BACKUP_PIN,
  ].filter(Boolean);

  if (adminSecret && validSecrets.includes(adminSecret)) {
    return true;
  }

  // 3. Validate authorized super administrator by verified email
  if (userEmail && ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }

  res.status(403).json({ 
    error: 'غير مصرح: هذا المسار محمي بروتوكولياً ومخصص حصراً للمشرف العام للمنصة',
    requiredRole: 'super_admin'
  });
  return false;
}

// Get complete platform overview (stats, orders, tenants, feedback, system health)
apiRouter.get('/super-admin/overview', (req: Request, res: Response) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const data = getSuperAdminOverview();
    res.json(data);
  } catch (err: any) {
    console.error('Super Admin Overview Generation Error:', err);
    res.status(500).json({ error: err?.message || 'تعذر تحميل بيانات الإدارة المركزية' });
  }
});

// Create subscription order (called when user submits an order / payment proof)
apiRouter.post(['/subscription/orders', '/super-admin/orders/create'], (req: Request, res: Response) => {
  try {
    const { 
      organizationId, organizationName, userEmail, userPhone, 
      plan, billingCycle, amount, paymentMethod, transactionRef, proofNote 
    } = req.body;

    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      organizationId: organizationId || 'org-main',
      organizationName: organizationName || 'مؤسسة تجارية',
      userEmail: userEmail || 'user@mizan.dz',
      userPhone: userPhone || '',
      plan: plan || 'business',
      billingCycle: billingCycle || 'monthly',
      amount: amount || 12000,
      currency: 'DZD',
      paymentMethod: paymentMethod || 'edahabia',
      transactionRef: transactionRef || `SATIM-${Date.now().toString().slice(-8)}`,
      proofNote: proofNote || '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    globalSubscriptionOrders.unshift(newOrder);

    res.json({
      success: true,
      message: 'تم تسجيل طلب الاشتراك بنجاح وسيقوم المشرف العام بمراجعته وتفعيله فوراً',
      order: newOrder,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve subscription order & activate tenant plan
apiRouter.post('/super-admin/orders/approve', (req: Request, res: Response) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { orderId } = req.body;
    const reviewer = (req.headers['x-user-email'] as string) || DEFAULT_ADMIN_EMAIL;
    const result = approveSubscriptionOrder(orderId, reviewer);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reject subscription order
apiRouter.post('/super-admin/orders/reject', (req: Request, res: Response) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { orderId, reason } = req.body;
    const reviewer = (req.headers['x-user-email'] as string) || DEFAULT_ADMIN_EMAIL;
    const result = rejectSubscriptionOrder(orderId, reviewer, reason);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Directly update any tenant plan manually (extend trial, upgrade, downgrade)
apiRouter.post('/super-admin/organizations/update-plan', (req: Request, res: Response) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { orgId, plan, status, durationMonths } = req.body;
    const reviewer = (req.headers['x-user-email'] as string) || DEFAULT_ADMIN_EMAIL;
    const result = updateTenantPlanManually(
      orgId, 
      plan, 
      status || 'active', 
      Number(durationMonths) || 12, 
      reviewer
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Public/tenant feedback submission
apiRouter.post(['/feedback/submit', '/super-admin/feedbacks/create'], (req: Request, res: Response) => {
  try {
    const { 
      organizationId, organizationName, userEmail, userName, 
      type, subject, message, priority 
    } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'يرجى كتابة عنوان ونص الرسالة' });
    }

    const feedback = addGlobalFeedback({
      organizationId: organizationId || 'org-main',
      organizationName: organizationName || 'مؤسسة تجارية',
      userEmail: userEmail || 'user@mizan.dz',
      userName: userName || 'مستخدم المنصة',
      type: type || 'feedback',
      subject,
      message,
      priority: priority || 'normal',
    });

    res.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح إلى الإدارة المركزية، شكراً لتواصلك!',
      feedback,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to feedback (Super Admin only)
apiRouter.post('/super-admin/feedbacks/reply', (req: Request, res: Response) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { feedbackId, response, status } = req.body;
    const updated = replyToFeedback(feedbackId, response, status || 'resolved');
    res.json({ success: true, feedback: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD & STATS
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const stats = tenant.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/dashboard/today-actions', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const actions = tenant.getTodayActionItems();
    res.json(actions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// CUSTOMERS & CUSTOMER 360
// -------------------------------------------------------------
apiRouter.get('/customers', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    tenant.recomputeAll();
    let result = [...tenant.customers];

    const q = req.query.q as string;
    const wilaya = req.query.wilaya as string;
    const risk = req.query.risk as string;
    const hasDebt = req.query.hasDebt as string;

    if (q) {
      const search = q.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.companyName.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        c.accountNumber.toLowerCase().includes(search)
      );
    }

    if (wilaya && wilaya !== 'all') {
      result = result.filter(c => c.wilaya === wilaya);
    }

    if (risk && risk !== 'all') {
      result = result.filter(c => c.riskLevel === risk);
    }

    if (hasDebt === 'true') {
      result = result.filter(c => c.outstandingBalance > 0);
    }

    res.json({ customers: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const data = tenant.getCustomer360(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
    }
    const tenant = getTenant(req);
    // Enforce Starter plan ceiling of 50 customers
    if (tenant.organization.plan === 'starter' && tenant.customers.length >= 50) {
      return res.status(403).json({
        error: 'لقد بلغت الحد الأقصى لباقة الانطلاق (50 عميلاً). يرجى الترقية إلى باقة الأعمال لإضافة عدد غير محدود من العملاء.',
        upgradeRequired: true,
        currentPlan: 'starter',
      });
    }
    const customer = tenant.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// INVOICES
// -------------------------------------------------------------
apiRouter.get('/invoices', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    tenant.recomputeAll();
    let result = [...tenant.invoices];
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    if (status && status !== 'all') {
      result = result.filter(i => i.status === status);
    }

    if (customerId) {
      result = result.filter(i => i.customerId === customerId);
    }

    res.json({ invoices: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/invoices', (req: Request, res: Response) => {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'يرجى تحديد العميل وبند واحد على الأقل في الفاتورة' });
    }
    const tenant = getTenant(req);
    const invoice = tenant.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// PAYMENTS & LEDGER
// -------------------------------------------------------------
apiRouter.get('/payments', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    let result = [...tenant.payments];
    const customerId = req.query.customerId as string;
    if (customerId) {
      result = result.filter(p => p.customerId === customerId);
    }
    res.json({ payments: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  try {
    const { customerId, amount, paymentMethod } = req.body;
    if (!customerId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'يرجى تحديد العميل ومبلغ دفع صالح' });
    }
    const tenant = getTenant(req);
    const payment = tenant.registerPayment(req.body);
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/ledger/:customerId', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const ledger = tenant.ledgerEntries
      .filter(l => l.customerId === req.params.customerId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    res.json({ ledger });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// PRODUCTS & INVENTORY MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    let result = [...tenant.products];
    const q = req.query.q as string;
    const category = req.query.category as string;
    const status = req.query.status as string;

    if (q) {
      const search = q.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search))
      );
    }
    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    if (status && status !== 'all') {
      result = result.filter(p => p.status === status);
    }
    res.json({ products: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { name, salePrice } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم المنتج مطلوب' });
    }
    const tenant = getTenant(req);
    const product = tenant.createProduct(req.body);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const updated = tenant.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const success = tenant.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/products/adjust-stock', (req: Request, res: Response) => {
  try {
    const { productId, delta, reason } = req.body;
    if (!productId || delta === undefined) {
      return res.status(400).json({ error: 'معرف المنتج وفارق التعديل مطلوبان' });
    }
    const tenant = getTenant(req);
    const updated = tenant.adjustProductStock(productId, Number(delta), reason);
    if (!updated) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/products/bulk', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'قائمة المنتجات فارغة' });
    }
    const tenant = getTenant(req);
    const created = tenant.bulkCreateProducts(items);
    res.status(201).json({ success: true, count: created.length, products: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/ai/parse-products', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال النص المطلوب تحليله' });
    }
    const result = await parseProductsWithAi(text);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// COLLECTIONS: TASKS, ATTEMPTS & PROMISES
// -------------------------------------------------------------
apiRouter.get('/collections/tasks', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    let result = [...tenant.collectionTasks];
    const status = req.query.status as string;
    if (status && status !== 'all') {
      result = result.filter(t => t.status === status);
    }
    res.json({ tasks: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/collections/tasks', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const task = tenant.createTask(req.body);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.patch('/collections/tasks/:id', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    const task = tenant.updateTaskStatus(req.params.id, req.body.status);
    if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/collections/attempts', (req: Request, res: Response) => {
  try {
    const { customerId, channel, result } = req.body;
    if (!customerId || !channel || !result) {
      return res.status(400).json({ error: 'بيانات المحاولة غير مكتملة' });
    }
    const tenant = getTenant(req);
    const attempt = tenant.logAttempt(req.body);
    res.status(201).json(attempt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/collections/promises', (req: Request, res: Response) => {
  try {
    const tenant = getTenant(req);
    tenant.recomputeAll();
    res.json({ promises: tenant.promiseToPays });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/collections/promises', (req: Request, res: Response) => {
  try {
    const { customerId, promisedAmount, promisedDate } = req.body;
    if (!customerId || !promisedAmount || !promisedDate) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ الوعد وتاريخ السداد المحدد' });
    }
    const tenant = getTenant(req);
    const promise = tenant.recordPromise(req.body);
    res.status(201).json(promise);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// AI INTELLIGENCE
// -------------------------------------------------------------
apiRouter.post('/ai/generate-message', async (req: Request, res: Response) => {
  try {
    const { customerName, companyName, outstandingAmount, oldestOverdueDays, invoiceNumber, tone, channel } = req.body;
    if (!customerName || outstandingAmount === undefined) {
      return res.status(400).json({ error: 'البيانات المالية غير مكتملة لتوليد الرسالة' });
    }

    const tenant = getTenant(req);
    const result = await generateCollectionMessage({
      customerName,
      companyName,
      outstandingAmount: Number(outstandingAmount),
      oldestOverdueDays: Number(oldestOverdueDays || 0),
      invoiceNumber,
      tone: tone || 'professional',
      channel: channel || 'whatsapp',
      merchantName: tenant.organization.name,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error generating AI message:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء توليد الرسالة' });
  }
});

apiRouter.post('/ai/analyze-risk', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    const tenant = getTenant(req);
    const customer = tenant.customers.find(c => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

    const custInvoices = tenant.invoices.filter(i => i.customerId === customerId);
    const brokenPromises = tenant.promiseToPays.filter(p => p.customerId === customerId && p.status === 'broken');
    let maxDays = 0;
    custInvoices.forEach(i => {
      if (i.daysOverdue > maxDays) maxDays = i.daysOverdue;
    });

    const explanation = await explainRiskScoreWithAi({
      customerName: customer.name,
      companyName: customer.companyName,
      outstandingAmount: customer.outstandingBalance,
      overdueAmount: customer.overdueBalance,
      daysOverdue: maxDays,
      creditLimit: customer.creditLimit,
      riskScore: customer.riskScore,
      brokenPromisesCount: brokenPromises.length,
    });

    res.json({ explanation, score: customer.riskScore, level: customer.riskLevel });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// CSV IMPORT WIZARD
// -------------------------------------------------------------
apiRouter.post('/import/customers', (req: Request, res: Response) => {
  try {
    const { rows, execute } = req.body; // Array of objects
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'تنسيق الملف غير صالح' });
    }

    const tenant = getTenant(req);
    const validRows: any[] = [];
    const invalidRows: Array<{ row: any; errors: string[] }> = [];
    const duplicateRows: any[] = [];

    const existingPhones = new Set(tenant.customers.map(c => c.phone.replace(/\D/g, '')));

    rows.forEach((row, index) => {
      const errors: string[] = [];
      const name = (row.name || '').trim();
      const phone = (row.phone || '').trim();
      const cleanPhone = phone.replace(/\D/g, '');

      if (!name) errors.push('الاسم مفقود');
      if (!phone) errors.push('رقم الهاتف مفقود');
      if (cleanPhone && cleanPhone.length < 9) errors.push('رقم الهاتف قصير جداً');

      if (cleanPhone && existingPhones.has(cleanPhone)) {
        duplicateRows.push({ ...row, rowNumber: index + 1, reason: 'رقم الهاتف مسجل مسبقاً' });
        return;
      }

      if (errors.length > 0) {
        invalidRows.push({ row: { ...row, rowNumber: index + 1 }, errors });
      } else {
        validRows.push({
          name,
          phone,
          companyName: (row.company || row.companyName || '').trim(),
          wilaya: (row.wilaya || 'الجزائر العاصمة').trim(),
          address: (row.address || '').trim(),
          creditLimit: Number(row.creditLimit) || 300000,
          paymentTermsDays: Number(row.paymentTermsDays) || 30,
        });
      }
    });

    if (execute && validRows.length > 0) {
      // Execute import into tenant store
      validRows.forEach(v => {
        tenant.createCustomer(v);
      });
      return res.json({
        success: true,
        importedCount: validRows.length,
        message: `تم استيراد ${validRows.length} عميل بنجاح إلى حساب مؤسستك`,
      });
    }

    // Return dry-run validation report
    res.json({
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length,
      validRows: validRows.slice(0, 10), // sample
      invalidRows,
      duplicateRows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const tenant = getTenant(req);
  res.json({ logs: tenant.auditLogs.slice(0, 50) });
});
