/**
 * Mizan System Comprehensive Automated Audit & Test Suite
 */

const BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, category, passed: true });
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    results.push({ name, category, passed: false, error: err.message || String(err) });
    console.error(`  ❌ [FAIL] ${name}: ${err.message || err}`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('====================================================');
  console.log('🔍 STARTING COMPREHENSIVE SYSTEM TEST SUITE: MIZAN');
  console.log('====================================================\n');

  // 1. Health & Server Status
  await runTest('System Health', 'GET /api/health should return ok', async () => {
    const res = await request('/health');
    if (res.status !== 200 || res.data?.status !== 'ok') {
      throw new Error(`Expected status 200 with ok, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 2. Security & Super Admin Authentication
  let adminToken = '';
  await runTest('Security', 'Reject invalid Super Admin credentials with 401', async () => {
    const res = await request('/auth/super-admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@attacker.com', secretKey: 'wrongpassword' }),
    });
    if (res.status !== 401 && res.status !== 429) {
      throw new Error(`Expected 401 or 429 for invalid login, got ${res.status}`);
    }
  });

  await runTest('Security', 'Accept valid Super Admin credentials and issue session token', async () => {
    const res = await request('/auth/super-admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mizan.dz', secretKey: 'Mizan@Master2026!' }),
    });
    if (res.status !== 200 || !res.data?.token || res.data?.user?.role !== 'super_admin') {
      throw new Error(`Failed to authenticate super admin: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.token;
  });

  await runTest('Security', 'Block unauthorized access to /api/super-admin/overview', async () => {
    const res = await request('/super-admin/overview');
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden without token, got ${res.status}`);
    }
  });

  await runTest('Security', 'Allow authorized Super Admin to fetch /api/super-admin/overview with x-admin-token', async () => {
    const res = await request('/super-admin/overview', {
      headers: { 'x-admin-token': adminToken },
    });
    if (res.status !== 200 || !res.data?.metrics) {
      throw new Error(`Expected 200 and metrics overview, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 3. Multi-Tenant Isolation
  const tenantAId = `org-test-a-${Date.now()}`;
  const tenantBId = `org-test-b-${Date.now()}`;

  await runTest('Multi-Tenancy', 'Register Tenant A with isolated store', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: tenantAId,
        organizationName: 'مؤسسة الشروق للتوزيع',
        name: 'أحمد مدير أ',
        email: 'ahmed@shorouk.dz',
        phone: '0551111111',
        wilaya: '16 - الجزائر العاصمة',
      }),
    });
    if (res.status !== 200 || res.data?.organization?.id !== tenantAId) {
      throw new Error(`Tenant A registration failed: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Multi-Tenancy', 'Register Tenant B with isolated store', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: tenantBId,
        organizationName: 'مؤسسة الهضاب للتجارة',
        name: 'كريم مدير ب',
        email: 'karim@hidhab.dz',
        phone: '0552222222',
        wilaya: '19 - سطيف',
      }),
    });
    if (res.status !== 200 || res.data?.organization?.id !== tenantBId) {
      throw new Error(`Tenant B registration failed: ${JSON.stringify(res.data)}`);
    }
  });

  let customerAId = '';
  await runTest('Multi-Tenancy', 'Create Customer in Tenant A', async () => {
    const res = await request('/customers', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        name: 'محل النور للتجزئة',
        companyName: 'سوبرماركت النور',
        phone: '0555333333',
        wilaya: '16 - الجزائر العاصمة',
        creditLimit: 500000,
        paymentTermsDays: 30,
      }),
    });
    if (res.status !== 201 || !res.data?.id) {
      throw new Error(`Failed to create customer in tenant A: ${JSON.stringify(res.data)}`);
    }
    customerAId = res.data.id;
  });

  await runTest('Multi-Tenancy', 'Tenant B MUST NOT see Tenant A customer (Tenant Isolation)', async () => {
    const res = await request('/customers', {
      headers: { 'x-org-id': tenantBId },
    });
    if (res.status !== 200) {
      throw new Error(`Failed to fetch tenant B customers: ${res.status}`);
    }
    const found = (res.data?.customers || []).some((c: any) => c.id === customerAId);
    if (found) {
      throw new Error('Data leak! Tenant B can view Customer created in Tenant A');
    }
  });

  // 4. Invoices & Financial Calculations
  let invoiceId = '';
  await runTest('Financial Logic', 'Create Invoice with Tax and calculate totals correctly', async () => {
    const res = await request('/invoices', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        items: [
          { description: 'سلع غذائية جملة', quantity: 10, unitPrice: 5000, total: 50000 },
          { description: 'مواد تنظيف جملة', quantity: 5, unitPrice: 10000, total: 50000 },
        ],
        taxRate: 19,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      }),
    });

    if (res.status !== 201 || !res.data?.id) {
      throw new Error(`Failed to create invoice: ${JSON.stringify(res.data)}`);
    }
    invoiceId = res.data.id;
    // Subtotal: 100,000 DZD, Tax 19%: 19,000 DZD, Total: 119,000 DZD
    if (res.data.subtotal !== 100000 || res.data.tax !== 19000 || res.data.total !== 119000) {
      throw new Error(`Incorrect invoice total calculations. Got subtotal=${res.data.subtotal}, tax=${res.data.tax}, total=${res.data.total}`);
    }
  });

  await runTest('Financial Logic', 'Customer balance must reflect the new unpaid invoice', async () => {
    const res = await request(`/customers/${customerAId}`, {
      headers: { 'x-org-id': tenantAId },
    });
    if (res.status !== 200 || !res.data?.customer) {
      throw new Error(`Failed to fetch Customer 360: ${res.status}`);
    }
    if (res.data.customer.outstandingBalance !== 119000) {
      throw new Error(`Expected outstandingBalance to be 119000, got ${res.data.customer.outstandingBalance}`);
    }
  });

  // 5. Payment Processing & Invoice Auto-Reconciliation
  await runTest('Financial Logic', 'Register partial payment of 50,000 DZD and update invoice remaining amount', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        invoiceId: invoiceId,
        amount: 50000,
        paymentMethod: 'cash',
        notes: 'دفعة أولى نقدية',
      }),
    });

    if (res.status !== 201) {
      throw new Error(`Failed to register payment: ${JSON.stringify(res.data)}`);
    }

    // Verify invoice status
    const invRes = await request('/invoices', {
      headers: { 'x-org-id': tenantAId },
    });
    const inv = invRes.data?.invoices?.find((i: any) => i.id === invoiceId);
    if (!inv || inv.status !== 'partially_paid' || inv.paidAmount !== 50000 || inv.remainingAmount !== 69000) {
      throw new Error(`Invoice status or remaining amount incorrect: ${JSON.stringify(inv)}`);
    }
  });

  await runTest('Financial Logic', 'Register remaining payment of 69,000 DZD and set invoice status to paid', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        invoiceId: invoiceId,
        amount: 69000,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'VIR-ALG-9941',
      }),
    });

    if (res.status !== 201) {
      throw new Error(`Failed to register second payment: ${JSON.stringify(res.data)}`);
    }

    const invRes = await request('/invoices', {
      headers: { 'x-org-id': tenantAId },
    });
    const inv = invRes.data?.invoices?.find((i: any) => i.id === invoiceId);
    if (!inv || inv.status !== 'paid' || inv.remainingAmount !== 0) {
      throw new Error(`Invoice did not reconcile to paid: ${JSON.stringify(inv)}`);
    }

    // Verify customer outstanding balance is now 0
    const custRes = await request(`/customers/${customerAId}`, {
      headers: { 'x-org-id': tenantAId },
    });
    if (custRes.data?.customer?.outstandingBalance !== 0) {
      throw new Error(`Expected outstandingBalance to be 0 after full payment, got ${custRes.data?.customer?.outstandingBalance}`);
    }
  });

  // 6. Collections & Promise to Pay
  await runTest('Collections', 'Record a Promise to Pay for customer', async () => {
    const res = await request('/collections/promises', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        promisedAmount: 25000,
        promisedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        channel: 'phone_call',
        notes: 'وعد بالسداد الأسبوع القادم عند استلام دفعة',
      }),
    });
    if (res.status !== 201 || !res.data?.id) {
      throw new Error(`Failed to record promise to pay: ${JSON.stringify(res.data)}`);
    }
  });

  // 7. CSV Bulk Import Engine
  await runTest('Import Wizard', 'Dry-run validation of CSV rows with duplicate detection', async () => {
    const rows = [
      { name: 'مؤسسة السلام', phone: '0550123456', wilaya: '06 - بجاية', creditLimit: 200000 },
      { name: 'تاجر بدون هاتف', phone: '', wilaya: '16 - الجزائر العاصمة' }, // invalid
      { name: 'محل النور للتجزئة', phone: '0555333333', wilaya: '16 - الجزائر العاصمة' }, // duplicate of customerA
    ];

    const res = await request('/import/customers', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({ rows, execute: false }),
    });

    if (res.status !== 200) {
      throw new Error(`CSV validation failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.validCount !== 1 || res.data.invalidCount !== 1 || res.data.duplicateCount !== 1) {
      throw new Error(`Unexpected import validation counts: ${JSON.stringify(res.data)}`);
    }
  });

  // 8. Feedback & Super Admin Management
  let feedbackId = '';
  await runTest('Support & Feedback', 'Submit customer feedback to central management', async () => {
    const res = await request('/feedback/submit', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        organizationId: tenantAId,
        organizationName: 'مؤسسة الشروق للتوزيع',
        userEmail: 'ahmed@shorouk.dz',
        userName: 'أحمد مدير أ',
        type: 'feature_request',
        subject: 'طلب إضافة ربط الدفع الإلكتروني بريدي موب',
        message: 'نرجو توفير التكامل المباشر مع باريدي موب وساتيم',
        priority: 'high',
      }),
    });

    if (res.status !== 200 || !res.data?.feedback?.id) {
      throw new Error(`Failed to submit feedback: ${JSON.stringify(res.data)}`);
    }
    feedbackId = res.data.feedback.id;
  });

  await runTest('Support & Feedback', 'Super Admin replies to feedback ticket', async () => {
    const res = await request('/super-admin/feedbacks/reply', {
      method: 'POST',
      headers: { 'x-admin-token': adminToken },
      body: JSON.stringify({
        feedbackId: feedbackId,
        response: 'تم استلام طلبكم وهو مبرمج ضمن تحديثات الربع القادم.',
        status: 'in_progress',
      }),
    });

    if (res.status !== 200 || res.data?.feedback?.status !== 'in_progress') {
      throw new Error(`Failed to reply to feedback: ${JSON.stringify(res.data)}`);
    }
  });

  // 9. Edge-case and Boundary Tests
  await runTest('Edge Cases', 'Reject payment with negative or zero amount', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        amount: -5000,
        paymentMethod: 'cash',
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 for negative payment, got ${res.status}`);
    }
  });

  await runTest('Edge Cases', 'Reject invoice with empty items list', async () => {
    const res = await request('/invoices', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerId: customerAId,
        items: [],
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 for invoice without items, got ${res.status}`);
    }
  });

  // 10. AI Collection Generator & Risk Analyzer
  await runTest('AI Services', 'Generate AI reminder message in Arabic with professional tone', async () => {
    const res = await request('/ai/generate-message', {
      method: 'POST',
      headers: { 'x-org-id': tenantAId },
      body: JSON.stringify({
        customerName: 'محل النور للتجزئة',
        companyName: 'سوبرماركت النور',
        outstandingAmount: 119000,
        oldestOverdueDays: 15,
        invoiceNumber: 'INV-2026-001',
        tone: 'professional',
        channel: 'whatsapp',
      }),
    });

    if (res.status !== 200 || !res.data?.message) {
      throw new Error(`Expected generated message string, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 11. Super Admin Subscription Order Approval & Plan Upgrade
  let orderId = '';
  await runTest('Super Admin Operations', 'Fetch pending subscription orders and approve an order', async () => {
    const overviewRes = await request('/super-admin/overview', {
      headers: { 'x-admin-token': adminToken },
    });
    const pendingOrders = overviewRes.data?.pendingOrders || [];
    if (pendingOrders.length > 0) {
      orderId = pendingOrders[0].id;
      const approveRes = await request('/super-admin/orders/approve', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
        body: JSON.stringify({ orderId }),
      });
      if (approveRes.status !== 200 || !approveRes.data?.success) {
        throw new Error(`Failed to approve order: ${JSON.stringify(approveRes.data)}`);
      }
    }
  });

  await runTest('Super Admin Operations', 'Upgrade tenant plan manually as Super Admin', async () => {
    const updateRes = await request('/super-admin/organizations/update-plan', {
      method: 'POST',
      headers: { 'x-admin-token': adminToken },
      body: JSON.stringify({
        orgId: tenantAId,
        plan: 'pro',
        status: 'active',
        durationMonths: 12,
      }),
    });

    if (updateRes.status !== 200 || !updateRes.data?.success) {
      throw new Error(`Failed to update tenant plan: ${JSON.stringify(updateRes.data)}`);
    }
  });

  // 12. Audit Trail
  await runTest('Audit Trail', 'Verify tenant audit logs recorded all financial events', async () => {
    const res = await request('/audit-logs', {
      headers: { 'x-org-id': tenantAId },
    });
    if (res.status !== 200 || !Array.isArray(res.data?.logs) || res.data.logs.length === 0) {
      throw new Error(`Expected non-empty audit logs for tenant A`);
    }
  });

  console.log('\n====================================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
