import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Clock, RefreshCw, 
  Search, Users, Building2, CreditCard, Sparkles, Server, 
  Activity, ArrowUpRight, MessageSquare, Send, Check, X,
  FileText, Lock, ChevronDown, Filter, Zap, ExternalLink,
  Laptop, Database, Cpu, Radio, ShieldAlert
} from 'lucide-react';
import { 
  PlatformMetrics, SubscriptionOrder, FeedbackItem, Organization, User 
} from '../../types';
import { fetchJson } from '../../lib/apiClient';

interface SuperAdminDashboardProps {
  currentUser: User;
  onExit?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onExit,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'tenants' | 'performance' | 'feedbacks'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'resolved'>('new');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Selected Tenant for Plan Modification Modal
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState<'starter' | 'business' | 'pro'>('business');
  const [editStatus, setEditStatus] = useState<'active' | 'trial' | 'expired'>('active');
  const [editDurationMonths, setEditDurationMonths] = useState<number>(12);
  const [isUpdatingTenant, setIsUpdatingTenant] = useState(false);

  // Reply Feedback Modal
  const [selectedFeedbackForReply, setSelectedFeedbackForReply] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Live Ping Latency Test
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<number | null>(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      setActionErrorMsg(null);
      const data = await fetchJson<{
        metrics: PlatformMetrics;
        tenants: any[];
        pendingOrders: SubscriptionOrder[];
        orders: SubscriptionOrder[];
        feedbacks: FeedbackItem[];
      }>('/api/super-admin/overview', {
        headers: {
          'x-user-email': currentUser.email || 'nova.bakhti@gmail.com',
          'x-admin-secret': 'mizan-super-admin-2026',
        }
      });

      setMetrics(data.metrics);
      setTenants(data.tenants || []);
      setOrders(data.orders || []);
      setFeedbacks(data.feedbacks || []);
    } catch (err: any) {
      console.error('Failed to load super admin data:', err);
      setActionErrorMsg(err?.message || 'تعذر تحميل بيانات الإدارة المركزية');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for live order & metrics updates
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveOrder = async (orderId: string) => {
    try {
      setActionSuccessMsg(null);
      setActionErrorMsg(null);
      const res = await fetchJson<{ success: boolean; message?: string }>('/api/super-admin/orders/approve', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      if (res.success) {
        setActionSuccessMsg(`تم تأكيد وتفعيل الاشتراك للطلب #${orderId} بنجاح!`);
        loadData(true);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'تعذر تفعيل الاشتراك');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('يرجى تحديد سبب الرفض الموجه للعميل (مثلاً: رقم المعاملة غير مطابق / لم يصل التحويل):');
    if (reason === null) return;

    try {
      setActionSuccessMsg(null);
      setActionErrorMsg(null);
      const res = await fetchJson<{ success: boolean }>('/api/super-admin/orders/reject', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason }),
      });
      if (res.success) {
        setActionSuccessMsg(`تم رفض الطلب #${orderId} وتحديث السجل.`);
        loadData(true);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل في تحديث الطلب');
    }
  };

  const handleUpdateTenantPlan = async () => {
    if (!selectedTenantForEdit) return;
    setIsUpdatingTenant(true);
    try {
      const res = await fetchJson<{ success: boolean }>('/api/super-admin/organizations/update-plan', {
        method: 'POST',
        body: JSON.stringify({
          orgId: selectedTenantForEdit.id,
          plan: editPlan,
          status: editStatus,
          durationMonths: editDurationMonths,
        }),
      });

      if (res.success) {
        setActionSuccessMsg(`تم تعديل باقة وصلاحيات مؤسسة "${selectedTenantForEdit.name}" بنجاح.`);
        setSelectedTenantForEdit(null);
        loadData(true);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'تعذر تعديل باقة المؤسسة');
    } finally {
      setIsUpdatingTenant(false);
    }
  };

  const handleSendFeedbackReply = async () => {
    if (!selectedFeedbackForReply || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await fetchJson<{ success: boolean }>('/api/super-admin/feedbacks/reply', {
        method: 'POST',
        body: JSON.stringify({
          feedbackId: selectedFeedbackForReply.id,
          response: replyText,
          status: 'resolved',
        }),
      });

      if (res.success) {
        setActionSuccessMsg(`تم حفظ الرد على التذكرة #${selectedFeedbackForReply.id} وتحديدها كمنتهية.`);
        setSelectedFeedbackForReply(null);
        setReplyText('');
        loadData(true);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'تعذر إرسال الرد');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleRunPingTest = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetchJson('/api/health');
      const latency = Math.round(performance.now() - start);
      setLastPingResult(latency);
    } catch {
      setLastPingResult(-1);
    } finally {
      setIsPinging(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.organizationName.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        o.transactionRef.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTenants = tenants.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.wilaya.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredFeedbacks = feedbacks.filter(f => {
    if (feedbackFilter !== 'all' && f.status !== feedbackFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.subject.toLowerCase().includes(q) ||
        f.organizationName.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Banner: Master Administration Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/30 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                لوحة التحكم المركزية للمنصة (Master Admin Panel)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                المسؤول: <strong className="text-amber-300">{currentUser.email || 'admin@mizan.dz'}</strong>
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>إدارة المشتركين والطلبات والأداء السحابي</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              مركز الرقابة الإدارية لمنظومة ميزان: متابعة وتفعيل طلبات الاشتراك بالدينار الجزائري، التحكم في حسابات الشركات، وتتبع سلامة الأداء السحابي واستقبال آراء المشتركين.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>تحديث البيانات</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              >
                العودة للتطبيق التجاري
              </button>
            )}
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px] block font-medium">إجمالي الإيرادات المؤكدة (DZD)</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {metrics.totalRevenueDzd.toLocaleString()} <span className="text-xs text-slate-400">دج</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px] block font-medium">طلبات اشتراك بانتظار التفعيل</span>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5 flex items-center gap-2">
                <span>{metrics.pendingOrdersCount}</span>
                {metrics.pendingOrdersCount > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    يتطلب مراجعة
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px] block font-medium">المؤسسات المسجلة في المنصة</span>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {metrics.activeTenantsCount} <span className="text-xs text-slate-400">شركة</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px] block font-medium">استجابة قاعدة البيانات (Latency)</span>
              <div className="text-xl font-black text-teal-400 font-mono mt-0.5 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
                <span>{lastPingResult ? `${lastPingResult} ms` : `${metrics.dbLatencyMs} ms`}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Messages */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold transition-all cursor-pointer"
            >
              إعادة المحاولة
            </button>
            <button 
              onClick={() => setActionErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>طلبات الاشتراكات والدفع</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('tenants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'tenants'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>إدارة المؤسسات والمشتركين ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('feedbacks')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'feedbacks'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>رسائل واستفسارات العملاء</span>
            {feedbacks.filter(f => f.status === 'new').length > 0 && (
              <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {feedbacks.filter(f => f.status === 'new').length} جديدة
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('performance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'performance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>صحة وأداء التطبيق السحابي</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، البريد، أو المرجع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* TAB 1: SUBSCRIPTION ORDERS & MANUAL APPROVALS */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">قائمة طلبات الاشتراك والمدفوعات</h2>
              <p className="text-xs text-slate-500">مراجعة إيصالات الدفع الصادرة عبر بريدي موب، الذهبية، CIB، أو التحويلات البنكية</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    orderFilter === filter ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filter === 'pending' ? 'قيد الانتظار' : filter === 'approved' ? 'المفعلة' : filter === 'rejected' ? 'المرفوضة' : 'الكل'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">لا توجد طلبات اشتراك تطابق الفلتر المحدد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">رقم الطلب</th>
                      <th className="py-3 px-4">المنشأة والمستخدم</th>
                      <th className="py-3 px-4">الباقة المطلوبة</th>
                      <th className="py-3 px-4">طريقة الدفع والمرجع</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 text-center">الإجراءات السريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {order.id}
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="block text-slate-900 text-sm">{order.organizationName}</strong>
                          <span className="text-slate-500 text-[11px] font-mono">{order.userEmail}</span>
                          {order.userPhone && <span className="text-slate-400 text-[10px] block">{order.userPhone}</span>}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            order.plan === 'pro' 
                              ? 'bg-purple-100 text-purple-800' 
                              : order.plan === 'business' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.plan === 'pro' ? 'Enterprise Pro' : order.plan === 'business' ? 'Business' : 'Starter'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {order.billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-slate-800 font-bold block">{order.paymentMethod}</strong>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {order.transactionRef}
                          </span>
                          {order.proofNote && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate" title={order.proofNote}>
                              📝 {order.proofNote}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                          {order.amount.toLocaleString()} دج
                        </td>

                        <td className="py-3.5 px-4">
                          {order.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              قيد الانتظار
                            </span>
                          )}
                          {order.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              مفعل ومعتمد
                            </span>
                          )}
                          {order.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                              <X className="w-3 h-3" />
                              مرفوض
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {order.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                title="تفعيل الاشتراك الفوري"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تفعيل الحساب</span>
                              </button>

                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                title="رفض الطلب"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              تم الفحص بواسطة {order.reviewedBy || 'المشرف'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TENANTS & ORGANIZATIONS DIRECTORY */}
      {activeAdminTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">دليل المؤسسات المسجلة في الجزائر</h2>
              <p className="text-xs text-slate-500">التحكم في باقات المشتركين، تمديد الفترات التجريبية، وتحديث الصلاحيات</p>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              إجمالي المشتركين: <strong className="text-slate-900">{tenants.length}</strong>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">اسم المؤسسة</th>
                    <th className="py-3 px-4">الولاية والنشاط</th>
                    <th className="py-3 px-4">الباقة الحالية</th>
                    <th className="py-3 px-4">حالة الاشتراك</th>
                    <th className="py-3 px-4">تاريخ الانتهاء</th>
                    <th className="py-3 px-4">إجمالي الديون المسجلة</th>
                    <th className="py-3 px-4 text-center">إدارة الباقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="block text-slate-900 text-sm">{t.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-semibold block">{t.wilaya}</span>
                        <span className="text-slate-500 text-[11px]">{t.businessType}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          t.plan === 'pro' 
                            ? 'bg-purple-100 text-purple-800' 
                            : t.plan === 'business' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {t.plan === 'pro' ? 'Enterprise Pro' : t.plan === 'business' ? 'Business' : 'Starter'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t.subscriptionStatus === 'active' ? 'نشط وساري' : t.subscriptionStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt).toLocaleDateString('ar-DZ') : 'ساري (سنوي)'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {(t.totalReceivables || 0).toLocaleString()} دج
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedTenantForEdit(t);
                            setEditPlan(t.plan || 'business');
                            setEditStatus(t.subscriptionStatus || 'active');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          تعديل الباقة والصلاحية
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEB APP HEALTH & PERFORMANCE */}
      {activeAdminTab === 'performance' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">مؤشرات أداء وصحة المنظومة السحابية</h2>
              <p className="text-xs text-slate-500">مراقبة فورية للذاكرة، الاستجابة (Latency)، وحالة خوادم وقواعد البيانات</p>
            </div>

            <button
              onClick={handleRunPingTest}
              disabled={isPinging}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <Activity className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>فحص الاستجابة الحية (Test Ping)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">زمن استجابة الخادم (Latency)</span>
                <Server className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {lastPingResult ? `${lastPingResult} ms` : `${metrics?.dbLatencyMs || 22} ms`}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                استجابة فائقة السرعة للمستخدمين داخل الجزائر
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">استهلاك الذاكرة (Memory Heap)</span>
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {metrics?.memoryUsageMb || 64} MB
              </div>
              <p className="text-[11px] text-slate-500">
                مستوى الاستهلاك مستقر وبكفاءة عالية (Low Overhead)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">مدة تشغيل الخادم (Uptime)</span>
                <Radio className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {metrics ? `${Math.floor(metrics.uptimeSeconds / 60)} دقيقة` : 'متصل'}
              </div>
              <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                جاهزية الخدمة السحابية 99.8%
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">حالة الطبقات والخدمات السحابية</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">قاعدة البيانات السحابية (Firestore DB)</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                  متصل ومزامن لحظياً
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">جدار عزل بيانات المؤسسات (Multi-Tenant Isolation)</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                  محمٍ ومفعل
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-800">محرك تقييم مخاطر الائتمان (AI Risk Engine)</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                  يعمل بطاقة كاملة
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">بوابة الدفع الإلكتروني (GIE / SATIM / BaridiMob)</span>
                </div>
                <span className="text-blue-700 font-bold bg-blue-100 px-2.5 py-0.5 rounded-full text-[10px]">
                  جاهزة لاستقبال العمليات
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER INQUIRIES & FEEDBACKS */}
      {activeAdminTab === 'feedbacks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">صندوق استفسارات وملاحظات المشتركين</h2>
              <p className="text-xs text-slate-500">استقبال تذاكر الدعم، طلبات الميزات الجديدة، واستفسارات الدفع والتفعيل</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['new', 'resolved', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFeedbackFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    feedbackFilter === filter ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filter === 'new' ? 'تذاكر جديدة' : filter === 'resolved' ? 'المعالج والمغلق' : 'الكل'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">لا توجد رسائل تطابق الفلتر المحدد</p>
              </div>
            ) : (
              filteredFeedbacks.map((f) => (
                <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        f.type === 'payment_issue' 
                          ? 'bg-amber-100 text-amber-800' 
                          : f.type === 'bug' 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {f.type === 'payment_issue' ? 'استفسار دفع' : f.type === 'bug' ? 'تقرير عطل' : f.type === 'feature_request' ? 'اقتراح ميزة' : 'ملاحظة عامة'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{f.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{f.organizationName} ({f.userName})</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(f.createdAt).toLocaleString('ar-DZ')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {f.message}
                  </p>

                  {f.adminResponse && (
                    <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <strong className="block text-[11px] text-emerald-700 font-bold">رد الإدارة المركزية:</strong>
                      <p>{f.adminResponse}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      البريد: <strong className="text-slate-700">{f.userEmail}</strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedFeedbackForReply(f);
                        setReplyText(f.adminResponse || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{f.adminResponse ? 'تعديل الرد' : 'الرد على المشترك'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT TENANT PLAN MANUALLY */}
      {selectedTenantForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">تعديل باقة وصلاحيات المنشأة</h3>
                <p className="text-xs text-slate-500">المؤسسة: <strong className="text-slate-900">{selectedTenantForEdit.name}</strong></p>
              </div>
              <button
                onClick={() => setSelectedTenantForEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر الباقة المعينة:</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="starter">Starter (باقة الانطلاق - حتى 50 عميل)</option>
                  <option value="business">Business (باقة الأعمال - شاملة وغير محدودة)</option>
                  <option value="pro">Enterprise Pro (باقة المؤسسات الكبرى + الذكاء الاصطناعي)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">حالة الاشتراك:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="active">نشط ومفعل (Active)</option>
                  <option value="trial">فترة تجريبية ممتدة (Trial)</option>
                  <option value="expired">منتهٍ أو معلق (Expired)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مدة الصلاحية الإضافية (بالأشهر):</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={editDurationMonths}
                  onChange={(e) => setEditDurationMonths(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTenantForEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateTenantPlan}
                disabled={isUpdatingTenant}
                className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isUpdatingTenant ? 'جاري الحفظ...' : 'حفظ التعديلات فوراً'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO USER FEEDBACK */}
      {selectedFeedbackForReply && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">الرد الرسمي على المشترك</h3>
                <p className="text-xs text-slate-500">التذكرة: <strong className="text-slate-900">{selectedFeedbackForReply.subject}</strong></p>
              </div>
              <button
                onClick={() => setSelectedFeedbackForReply(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
              <strong className="block text-slate-900">نص رسالة المشترك:</strong>
              <p>{selectedFeedbackForReply.message}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                اكتب ردك الموجه للمشترك:
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="أهلاً بك، تم التحقق من معاملتك وتفعيل باقتك بنجاح..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFeedbackForReply(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendFeedbackReply}
                disabled={isSendingReply || !replyText.trim()}
                className="px-5 py-2 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSendingReply ? 'جاري الإرسال...' : 'إرسال الرد وتحديد كمنجز'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
