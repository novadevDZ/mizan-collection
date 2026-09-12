import React, { useState, useEffect } from 'react';
import { Organization, User } from '../../types';
import { Building2, Shield, Users, History, CheckCircle2, Lock, CreditCard, Sparkles, MessageSquare, Send, Check } from 'lucide-react';
import { fetchJson } from '../../lib/apiClient';
import { SubscriptionManager } from './SubscriptionManager';

interface SettingsViewProps {
  organization: Organization;
  users: User[];
  currentUser?: User;
  onOrganizationUpdate?: (updatedOrg: Organization) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  organization, 
  users, 
  currentUser,
  onOrganizationUpdate 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'subscriptions' | 'organization' | 'team' | 'audit' | 'support'>('subscriptions');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Feedback form state
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackType, setFeedbackType] = useState<'payment_issue' | 'feature_request' | 'bug' | 'feedback'>('payment_issue');
  const [feedbackPriority, setFeedbackPriority] = useState<'normal' | 'urgent'>('normal');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) return;

    setIsSendingFeedback(true);
    setFeedbackSuccessMsg(null);
    try {
      await fetchJson('/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: organization.id,
          organizationName: organization.name,
          userEmail: currentUser?.email || 'user@mizan.dz',
          userName: currentUser?.name || 'مستخدم المنظومة',
          type: feedbackType,
          subject: feedbackSubject,
          message: feedbackMessage,
          priority: feedbackPriority,
        }),
      });

      setFeedbackSuccessMsg('تم إرسال رسالتك مباشرة إلى المشرف العام للمنصة بنجاح!');
      setFeedbackSubject('');
      setFeedbackMessage('');
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال الرسالة');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetchJson<{ logs: any[] }>('/api/audit-logs');
        setAuditLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">إعدادات المنشأة والاشتراكات</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة باقات الاشتراك، الفوترة، بيانات المنشأة التجارية، وفريق العمل والرقابة المالية
          </p>
        </div>

        {/* Plan Pill Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-500 font-semibold">الباقة الحالية:</span>
          <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {organization.plan === 'pro' ? 'Enterprise Pro' : organization.plan === 'business' ? 'Business' : 'Starter'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('subscriptions')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'subscriptions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>الاشتراكات والفوترة والدفع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('organization')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'organization'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>معلومات المنشأة التجارية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('team')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'team'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>فريق العمل والصلاحيات (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل التدقيق والرقابة المالية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('support')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'support'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>مراسلة الإدارة المركزية</span>
        </button>
      </div>

      {/* SUB-TAB 1: SUBSCRIPTION & BILLING */}
      {activeSubTab === 'subscriptions' && (
        <SubscriptionManager
          organization={organization}
          currentUser={currentUser}
          onOrganizationUpdate={onOrganizationUpdate}
        />
      )}

      {/* SUB-TAB 2: ORGANIZATION PROFILE */}
      {activeSubTab === 'organization' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">معلومات المنشأة التجارية (المستأجر الحالي)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">اسم المؤسسة</span>
              <span className="font-bold text-slate-900 text-sm">{organization.name}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">الولاية والمقر</span>
              <span className="font-bold text-slate-900 text-sm">{organization.wilaya}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">العملة الأساسية للنظام</span>
              <span className="font-bold text-emerald-700 text-sm">{organization.currency} (دينار جزائري)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">السجل التجاري (RC)</span>
              <span className="font-mono text-slate-700 font-bold">{organization.commercialRegister || 'غير مسجل'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">الرقم الجبائي (NIF)</span>
              <span className="font-mono text-slate-700 font-bold">{organization.taxNumber || 'غير مسجل'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-semibold block">عزل البيانات (Data Isolation)</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                مفعل ومحمٍ بحاجز المنظمة
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TEAM & ROLES */}
      {activeSubTab === 'team' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900">فريق العمل والأدوار والصلاحيات (RBAC)</h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                  <span className="text-slate-400 font-mono text-[11px] block">{u.email}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {u.role === 'owner' ? 'المالك (Owner)' : u.role === 'manager' ? 'مدير المبيعات' : 'محصل ديون ميداني'}
                  </span>
                  <span className="text-emerald-600 text-[11px] font-semibold">حساب نشط</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-black text-slate-900">سجل التدقيق والرقابة المالية (Audit Log)</h2>
          </div>

          <p className="text-xs text-slate-500">
            توثيق آلي غير قابل للتعديل لكافة العمليات المالية الحساسة (إنشاء فواتير، تسجيل مدفوعات، تغيير شروط، وتفعيل الاشتراكات)
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">الوقت والتاريخ</th>
                  <th className="py-2.5 px-3">العملية المسجلة</th>
                  <th className="py-2.5 px-3">المستخدم المنفذ</th>
                  <th className="py-2.5 px-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString('ar-DZ')}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 font-sans">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">{log.user}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans truncate max-w-xs">
                      {log.metadata ? JSON.stringify(log.metadata) : log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CONTACT CENTRAL ADMIN & SUPPORT */}
      {activeSubTab === 'support' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-black text-slate-900">مراسلة المشرف العام وإدارة المنصة</h2>
              <p className="text-xs text-slate-500">إرسال استفسار حول تفعيل الباقة، تأكيد تحويل بنكي، أو اقتراح ميزات جديدة للمنصة</p>
            </div>
          </div>

          {feedbackSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{feedbackSuccessMsg}</span>
              </div>
              <button onClick={() => setFeedbackSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
                إغلاق
              </button>
            </div>
          )}

          <form onSubmit={handleSendFeedback} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع المراسلة:</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                >
                  <option value="payment_issue">استفسار أو تأكيد عملية دفع وتفعيل باقة</option>
                  <option value="feature_request">اقتراح ميزة أو تقرير جديد</option>
                  <option value="bug">إبلاغ عن مشكلة فنية أو عطل</option>
                  <option value="feedback">رأي أو تقييم عام للمنظومة</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الأولوية:</label>
                <select
                  value={feedbackPriority}
                  onChange={(e) => setFeedbackPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                >
                  <option value="normal">عادية (خلال 24 ساعة)</option>
                  <option value="urgent">عاجلة (تفعيل اشتراك فوري أو عائق في العمل)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">عنوان الموضوع:</label>
              <input
                type="text"
                required
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                placeholder="مثال: تأكيد تحويل 12,000 دج عبر بريدي موب لتفعيل باقة الأعمال"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">نص الرسالة أو تفاصيل الدفع:</label>
              <textarea
                required
                rows={5}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="يرجى كتابة رقم العملية، البنك أو مركز البريد، وتاريخ التحويل، وسيقوم المشرف العام بفحصها وتفعيل حسابكم مباشرة..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-between text-[11px]">
              <span>المرسل: <strong className="text-slate-900">{currentUser?.name}</strong> ({organization.name})</span>
              <span className="font-mono text-slate-500">{currentUser?.email}</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSendingFeedback || !feedbackSubject.trim() || !feedbackMessage.trim()}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSendingFeedback ? (
                  <span>جاري الإرسال للإدارة...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>إرسال التذكرة للإدارة المركزية</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
