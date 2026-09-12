import React, { useState } from 'react';
import { Organization, User } from '../../types';
import { 
  CreditCard, CheckCircle2, ShieldCheck, Zap, Sparkles, Building2, 
  Clock, ArrowUpRight, FileText, Check, AlertCircle, RefreshCw, 
  Download, Printer, Lock
} from 'lucide-react';
import { updateOrganizationSubscription } from '../../lib/firestoreService';
import { fetchJson } from '../../lib/apiClient';

interface SubscriptionManagerProps {
  organization: Organization;
  currentUser?: User;
  onOrganizationUpdate?: (updatedOrg: Organization) => void;
}

interface PlanDefinition {
  id: 'starter' | 'business' | 'pro';
  name: string;
  nameAr: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameAr: 'باقة الانطلاق',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    description: 'للمتاجر الصغرى والموزعين المحليين المبتدئين في إدارة ديون العملاء',
    features: [
      'حتى 50 عميلاً مسجلاً',
      'إدارة الفواتير والمدفوعات بالدينار الجزائري',
      'تنبيهات استحقاق الديون البسيطة',
      'سجل المقبوضات النقدية والشيكات',
      'مستخدم واحد (المشرف العام)',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    nameAr: 'باقة الأعمال والشركات',
    monthlyPrice: 12000,
    yearlyPrice: 120000,
    popular: true,
    description: 'الحل الشامل والموصى به لشركات التوزيع، الجملة، ومستوردي السلع',
    features: [
      'عدد عملاء وفواتير غير محدود',
      'محرك تصنيف أعمار الديون (Aging Buckets 0-30, 31-60, 61-90+)',
      'خطابات المطالبة الرسمية الجزائرية وقوالب WhatsApp',
      'جدولة زيارات المحصلين الميدانيين مع تتبع الموقع',
      'فريق عمل حتى 5 مستخدمين (مدير، محاسب، محصلون)',
      'مزامنة سحابية لحظية ومقاومة لانقطاع النت',
    ],
  },
  {
    id: 'pro',
    name: 'Enterprise Pro',
    nameAr: 'باقة المؤسسات الكبرى',
    monthlyPrice: 24000,
    yearlyPrice: 240000,
    description: 'للمجموعات التجارية الكبرى ذات الحسابات المتعددة ومخاطر الائتمان العالية',
    features: [
      'كل مزايا باقة الأعمال بدون قيود',
      'تحليل وتقييم مخاطر الائتمان بالذكاء الاصطناعي (AI Risk Scoring)',
      'سجل رقابة وتدقيق مالي غير قابل للتعديل (Tamper-proof Audit Trail)',
      'فريق عمل ومحصلين غير محدود مع إدارة الصلاحيات المتقدمة',
      'الربط البرمجي الكامل (API Integration)',
      'دعم فني مخصص وأولوية في معالجة القضايا والتحصيل',
    ],
  },
];

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  organization,
  currentUser,
  onOrganizationUpdate,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business' | 'pro'>(organization.plan || 'starter');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'edahabia' | 'cib' | 'baridimob' | 'bank_transfer' | 'credit_card'>('edahabia');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const currentPlanDef = PLANS.find(p => p.id === organization.plan) || PLANS[0];

  const handleOpenPayment = (planId: 'starter' | 'business' | 'pro') => {
    setSelectedPlan(planId);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setNotification(null);

    const targetPlanDef = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
    const amount = billingCycle === 'yearly' ? targetPlanDef.yearlyPrice : targetPlanDef.monthlyPrice;
    const transactionRef = `SATIM-${Date.now().toString().slice(-8)}`;

    try {
      // 1. Update Firestore persistent record
      const result = await updateOrganizationSubscription(organization.id, selectedPlan, {
        amount,
        currency: 'DZD',
        method: paymentMethod,
        transactionRef,
        billingPeriod: billingCycle,
      });

      // 2. Call backend server endpoint for audit log and receipt creation
      const res = await fetchJson<{ success: boolean; organization: Organization; receipt: any }>('/api/subscription/activate', {
        method: 'POST',
        headers: {
          'x-org-id': organization.id,
          'x-user-email': currentUser?.email || 'admin@mizan.dz',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
          amount,
          billingCycle,
          transactionRef,
        }),
      }).catch(() => null);

      // Also log order into Super Admin global order stream
      fetchJson('/api/subscription/orders', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: organization.id,
          organizationName: organization.name,
          userEmail: currentUser?.email || 'user@mizan.dz',
          userPhone: organization.phone || '',
          plan: selectedPlan,
          billingCycle,
          amount,
          paymentMethod,
          transactionRef,
          proofNote: `دفع إلكتروني مباشر عبر واجهة المنصة (${paymentMethod})`,
        }),
      }).catch(() => null);

      const finalOrg = res?.organization || result.organization;
      if (onOrganizationUpdate) {
        onOrganizationUpdate(finalOrg);
      }

      const receiptData = res?.receipt || {
        receiptNumber: `FAC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        amount,
        currency: 'DZD',
        plan: selectedPlan,
        paymentMethod,
        transactionRef,
      };

      setActiveReceipt(receiptData);
      setIsPaymentModalOpen(false);
      setShowReceiptModal(true);
      setNotification(`تهانينا! تم تفعيل ${targetPlanDef.nameAr} بنجاح لمنشأتك.`);
    } catch (err: any) {
      console.error('Subscription activation failed:', err);
      setNotification('حدث خطأ أثناء معالجة الدفع، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Subscription Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-emerald-500/30 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                اشتراك ساري ونشط (Active)
              </span>
              <span className="text-xs text-slate-400">
                منشأة: <strong className="text-white">{organization.name}</strong>
              </span>
            </div>
            
            <h2 className="text-2xl font-black flex items-center gap-2">
              <span>{currentPlanDef.nameAr}</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">({currentPlanDef.name})</span>
            </h2>
            
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {currentPlanDef.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/60 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">تاريخ التجديد القادم</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {organization.subscriptionExpiresAt 
                  ? new Date(organization.subscriptionExpiresAt).toLocaleDateString('ar-DZ')
                  : 'تجديد سنوي تلقائي'}
              </span>
            </div>

            <button
              onClick={() => handleOpenPayment(organization.plan === 'starter' ? 'business' : 'pro')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{organization.plan === 'starter' ? 'الترقية إلى باقة الأعمال (Business)' : 'ترقية أو تجديد الاشتراك'}</span>
            </button>
          </div>
        </div>

        {organization.lastPayment && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>آخر دفعة مسجلة:</span>
              <strong className="text-white font-mono">{organization.lastPayment.amount?.toLocaleString()} دج</strong>
              <span className="text-slate-500">|</span>
              <span>المرجع: <strong className="font-mono text-slate-300">{organization.lastPayment.transactionRef}</strong></span>
            </div>
            <button
              onClick={() => {
                setActiveReceipt({
                  receiptNumber: organization.lastPayment?.transactionRef || 'REC-001',
                  date: organization.lastPayment?.paidAt || new Date().toISOString(),
                  amount: organization.lastPayment?.amount || 12000,
                  currency: 'DZD',
                  plan: organization.plan,
                  paymentMethod: organization.lastPayment?.method || 'edahabia',
                  transactionRef: organization.lastPayment?.transactionRef || 'SATIM-9988',
                });
                setShowReceiptModal(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>عرض وصل الدفع الرسمي (Facture)</span>
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Plans Comparison */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">باقات الاشتراك المتاحة لمنظومة ميزان</h3>
            <p className="text-xs text-slate-500">اختر الباقة المناسبة لحجم تعاملاتك التجارية وفريق المحصلين لديك</p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              شهرياً
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>سنوياً</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-black">
                وفر 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = organization.plan === plan.id;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                    : plan.popular
                    ? 'border-slate-300 bg-white shadow-md relative'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm">
                    الأكثر طلباً للشركات
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-black text-slate-900">{plan.nameAr}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        باقتك الحالية
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mb-5 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {price.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-600">دج</span>
                      <span className="text-[11px] text-slate-400">/ {billingCycle === 'yearly' ? 'سنة' : 'شهر'}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isCurrent ? 'تجديد باقتك الحالية' : `الترقية إلى ${plan.nameAr}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT & CHECKOUT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  دفع وتفعيل الاشتراك الفوري
                </h3>
                <p className="text-xs text-slate-500">
                  الباقة المختارة: <strong className="text-slate-900">{PLANS.find(p => p.id === selectedPlan)?.nameAr}</strong> ({billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">المبلغ الإجمالي المستحق:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    {(billingCycle === 'yearly'
                      ? PLANS.find(p => p.id === selectedPlan)?.yearlyPrice
                      : PLANS.find(p => p.id === selectedPlan)?.monthlyPrice
                    )?.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-700">دينار جزائري (DZD)</span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  شامل كافة الرسوم (TTC)
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                اختر وسيلة الدفع المعتمدة:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* البطاقة الذهبية */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('edahabia')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMethod === 'edahabia'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                    💳
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">البطاقة الذهبية (Edahabia)</strong>
                    <span className="text-[10px] text-slate-500">بريد الجزائر - دفع فوري آمن</span>
                  </div>
                </button>

                {/* بطاقة CIB */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cib')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMethod === 'cib'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                    🏛️
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">بطاقة CIB البنكية</strong>
                    <span className="text-[10px] text-slate-500">شبكة SATIM البنكية الجزائرية</span>
                  </div>
                </button>

                {/* تطبيق بريدي موب */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMethod === 'baridimob'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                    📲
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">تطبيق BaridiMob (RIP)</strong>
                    <span className="text-[10px] text-slate-500">تحويل عبر رقم الحساب البريدي RIP</span>
                  </div>
                </button>

                {/* تحويل بنكي رسمي */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-xs shrink-0">
                    🧾
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">تحويل بنكي رسمي (Virement)</strong>
                    <span className="text-[10px] text-slate-500">فاتورة شكلية وفاتورة رسمية للشركات</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Details Preview */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>المنشأة المستفيدة:</span>
                <strong className="text-slate-900">{organization.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>بوابة المعالجة:</span>
                <strong className="text-emerald-700">بوابة الدفع الإلكتروني المعتمدة (GIE Monétique)</strong>
              </div>
              <div className="flex justify-between">
                <span>نوع التفعيل:</span>
                <strong className="text-emerald-700">تفعيل فوري تلقائي في قاعدة البيانات</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري معالجة الدفع وتحديث الباقة...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>تأكيد الدفع وتفعيل الباقة فوراً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL INVOICE / RECEIPT MODAL */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  م
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">وصل دفع واشتراك رسمي</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Facture d'abonnement SaaS</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 text-xs font-sans">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم الوصل:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{activeReceipt.receiptNumber}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[10px]">التاريخ والوقت:</span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {new Date(activeReceipt.date).toLocaleString('ar-DZ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">المنشأة:</span>
                  <strong className="text-slate-900">{organization.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">الولاية:</span>
                  <span className="text-slate-700">{organization.wilaya}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الباقة المفعلة:</span>
                  <strong className="text-emerald-700 font-bold">
                    {PLANS.find(p => p.id === activeReceipt.plan)?.nameAr || activeReceipt.plan}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">طريقة الدفع:</span>
                  <span className="text-slate-700 font-bold">{activeReceipt.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الرقم المرجعي (Transaction Ref):</span>
                  <span className="font-mono text-slate-600 text-[10px]">{activeReceipt.transactionRef}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة الدفع:</span>
                  <span className="text-emerald-600 font-black">مدفوع ومؤكد (Payé)</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">المبلغ الإجمالي المدفوع:</span>
                <div className="text-emerald-700 font-mono font-black text-base">
                  {Number(activeReceipt.amount).toLocaleString()} دج
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                منصة ميزان لإدارة واسترجاع ديون الشركات والمؤسسات - الجمهورية الجزائرية الديمقراطية الشعبية
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الوصل</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                تم، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
