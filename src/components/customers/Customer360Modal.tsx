import React, { useState, useEffect } from 'react';
import { 
  X, Building2, Phone, MapPin, CreditCard, ShieldAlert, 
  Calendar, FileText, Banknote, History, CalendarClock, 
  Sparkles, MessageCircle, PhoneCall, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { Customer, Invoice, Payment, LedgerEntry, CollectionAttempt, PromiseToPay, CollectionTask } from '../../types';
import { formatDZD, RISK_LEVEL_DICT, PAYMENT_METHOD_DICT, getWhatsAppUrl } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';

interface Customer360ModalProps {
  customerId: string;
  onClose: () => void;
  onOpenPaymentModal: (customerId: string) => void;
  onOpenAttemptModal: (customerId: string) => void;
  onOpenPromiseModal: (customerId: string) => void;
  onOpenAiMessageModal: (data: any) => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customerId,
  onClose,
  onOpenPaymentModal,
  onOpenAttemptModal,
  onOpenPromiseModal,
  onOpenAiMessageModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'invoices' | 'payments' | 'attempts' | 'promises' | 'risk'>('ledger');
  const [data, setData] = useState<{
    customer: Customer;
    invoices: Invoice[];
    payments: Payment[];
    ledger: LedgerEntry[];
    tasks: CollectionTask[];
    attempts: CollectionAttempt[];
    promises: PromiseToPay[];
    riskBreakdown: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        const res = await fetchJson<any>(`/api/customers/${customerId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load customer 360:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [customerId]);

  const handleRequestAiRiskExplanation = async () => {
    if (!data) return;
    try {
      setLoadingAi(true);
      const res = await fetchJson<{ explanation: string }>(`/api/ai/analyze-risk`, {
        method: 'POST',
        body: JSON.stringify({ customerId }),
      });
      setAiExplanation(res.explanation);
    } catch (err) {
      console.error('Failed AI risk explanation:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">جاري تحميل الملف المالي الموحد (Customer 360)...</p>
        </div>
      </div>
    );
  }

  const { customer, invoices, payments, ledger, attempts, promises, riskBreakdown } = data;
  const risk = RISK_LEVEL_DICT[customer.riskLevel] || RISK_LEVEL_DICT.medium;

  const waUrl = getWhatsAppUrl(
    customer.whatsapp || customer.phone,
    `السلام عليكم ${customer.name}، نود تذكيركم بمراجعة كشف الحساب الخاص بكم لدى مؤسستنا، الرصيد المستحق حالياً: ${formatDZD(customer.outstandingBalance)}.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black">{customer.name}</h2>
                {customer.companyName && (
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {customer.companyName}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">({customer.accountNumber})</span>
              </div>

              <div className="mt-1 flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {customer.wilaya} {customer.commune ? `- ${customer.commune}` : ''}
                </span>
                <span className="text-slate-400">
                  شروط الأجل: <strong>{customer.paymentTermsDays} يوماً</strong>
                </span>
                <span className="text-slate-400">
                  الحد الائتماني: <strong>{formatDZD(customer.creditLimit)}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Highlights Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">إجمالي المبيعات (Debit)</div>
            <div className="text-sm font-black text-slate-800">{formatDZD(customer.totalInvoiced)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">إجمالي المدفوعات (Credit)</div>
            <div className="text-sm font-black text-emerald-700">{formatDZD(customer.totalPaid)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">الرصيد المتبقي بذمته</div>
            <div className="text-sm font-black text-slate-900">{formatDZD(customer.outstandingBalance)}</div>
          </div>
          <div>
            <div className="text-[11px] text-rose-600 font-semibold">المبلغ المتأخر عن الأجل</div>
            <div className="text-sm font-black text-rose-700">{formatDZD(customer.overdueBalance)}</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${risk.bg} ${risk.color}`}>
              مؤشر الخطر: {risk.labelAr} ({customer.riskScore}/100)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenPaymentModal(customer.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5" />
              تسجيل دفعة
            </button>

            <button
              onClick={() => onOpenAttemptModal(customer.id)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              تسجيل متابعة
            </button>

            <button
              onClick={() => onOpenPromiseModal(customer.id)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              تثبيت وعد دفع
            </button>

            <button
              onClick={() => onOpenAiMessageModal({
                customerName: customer.name,
                companyName: customer.companyName,
                outstandingAmount: customer.overdueBalance || customer.outstandingBalance,
                oldestOverdueDays: 25,
              })}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              رسالة تحصيل AI
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              واتساب
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50 gap-4 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            كشف الحساب المحاسبي ({ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الفواتير ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            المدفوعات ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'attempts'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            سجل المتابعات ({attempts.length})
          </button>
          <button
            onClick={() => setActiveTab('promises')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'promises'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            وعود الدفع ({promises.length})
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'risk'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تحليل المخاطر AI
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* 1. LEDGER TAB */}
          {activeTab === 'ledger' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">البيان</th>
                    <th className="py-2.5 px-3">رقم المرجع</th>
                    <th className="py-2.5 px-3 text-rose-700">مدين (دين جديد)</th>
                    <th className="py-2.5 px-3 text-emerald-700">دائن (تسديد)</th>
                    <th className="py-2.5 px-3 font-black">الرصيد الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{entry.entryDate}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{entry.description}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{entry.referenceNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {entry.debit > 0 ? formatDZD(entry.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {entry.credit > 0 ? formatDZD(entry.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 bg-slate-50/50">
                        {formatDZD(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">لا توجد حركات مسجلة في كشف الحساب.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. INVOICES TAB */}
          {activeTab === 'invoices' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">تاريخ الإصدار</th>
                    <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">المتبقي</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3">أيام التأخير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{inv.issueDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{inv.dueDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{formatDZD(inv.total)}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{formatDZD(inv.remainingAmount)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                          inv.status === 'partially_paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {inv.status === 'paid' ? 'مسددة بالكامل' :
                           inv.status === 'overdue' ? 'متأخرة عن الأجل' :
                           inv.status === 'partially_paid' ? 'مسددة جزئياً' : 'مستحقة'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {inv.daysOverdue > 0 ? (
                          <span className="text-rose-700 font-mono">{inv.daysOverdue} يوماً</span>
                        ) : (
                          <span className="text-emerald-700">ضمن المهلة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الوصل</th>
                    <th className="py-2.5 px-3">تاريخ الدفع</th>
                    <th className="py-2.5 px-3">طريقة الدفع</th>
                    <th className="py-2.5 px-3">الرقم المرجعي / الشيك</th>
                    <th className="py-2.5 px-3">المبلغ المحصل</th>
                    <th className="py-2.5 px-3">المحصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const method = PAYMENT_METHOD_DICT[p.paymentMethod] || PAYMENT_METHOD_DICT.cash;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.receiptNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.paymentDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-700">{method.labelAr}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                        <td className="py-2.5 px-3 font-black text-emerald-700">{formatDZD(p.amount)}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.collectedByName || 'كريم براهيمي'}</td>
                      </tr>
                    );
                  })}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">لا توجد مدفوعات مسجلة حتى الآن.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. ATTEMPTS TAB */}
          {activeTab === 'attempts' && (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div key={att.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {att.channel === 'phone_call' ? 'اتصال هاتفي' :
                         att.channel === 'in_person_visit' ? 'زيارة ميدانية' :
                         att.channel === 'whatsapp' ? 'مراسلة واتساب' : 'إشعار رسمي'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">({att.attemptDate})</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                        {att.result === 'promised_payment' ? 'تعهد بالدفع' :
                         att.result === 'no_answer' ? 'لم يجب' :
                         att.result === 'refused' ? 'رفض السداد' : 'طلب مهلة إضافية'}
                      </span>
                    </div>
                    {att.notes && <p className="text-slate-600">{att.notes}</p>}
                    {att.nextFollowUpDate && (
                      <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        موعد المتابعة القادم: {att.nextFollowUpDate}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{att.memberName || 'المحصل'}</span>
                </div>
              ))}
              {attempts.length === 0 && (
                <div className="py-8 text-center text-slate-400">لا توجد محاولات تواصل مسجلة بعد.</div>
              )}
            </div>
          )}

          {/* 5. PROMISES TAB */}
          {activeTab === 'promises' && (
            <div className="space-y-3">
              {promises.map((p) => (
                <div key={p.id} className={`p-4 rounded-xl border ${
                  p.status === 'broken' ? 'bg-rose-50 border-rose-200' :
                  p.status === 'kept' ? 'bg-emerald-50 border-emerald-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        تعهد بدفع: {formatDZD(p.promisedAmount)}
                      </div>
                      <div className="text-slate-600 mt-1">
                        تاريخ الاستحقاق المتعهد به: <strong className="font-mono">{p.promisedDate}</strong>
                      </div>
                      {p.notes && <p className="text-slate-500 mt-1 italic">{p.notes}</p>}
                    </div>

                    <div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.status === 'broken' ? 'bg-rose-600 text-white' :
                        p.status === 'kept' ? 'bg-emerald-600 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                        {p.status === 'broken' ? 'وعد منقوض (Broken)' :
                         p.status === 'kept' ? 'تم الوفاء بالوعد (Kept)' :
                         'قيد الانتظار (Pending)'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {promises.length === 0 && (
                <div className="py-8 text-center text-slate-400">لا توجد وعود دفع مسجلة.</div>
              )}
            </div>
          )}

          {/* 6. RISK TAB */}
          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-2">تفكيك مؤشر المخاطر الحتمي (Deterministic Math):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500">حجم الرصيد المتأخر</span>
                    <div className="font-bold text-slate-800 mt-1">{riskBreakdown?.factors?.balanceScore || 0} / 35</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500">مدة التأخير بالأيام</span>
                    <div className="font-bold text-slate-800 mt-1">{riskBreakdown?.factors?.daysOverdueScore || 0} / 25</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500">انتظام السداد التاريخي</span>
                    <div className="font-bold text-slate-800 mt-1">{riskBreakdown?.factors?.paymentFrequencyScore || 0} / 20</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500">وعود الدفع المنقوضة</span>
                    <div className="font-bold text-rose-700 mt-1">{riskBreakdown?.factors?.brokenPromisesScore || 0} / 20</div>
                  </div>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    تفسير وتوصية الذكاء الاصطناعي (Gemini Advisor)
                  </span>
                  <button
                    onClick={handleRequestAiRiskExplanation}
                    disabled={loadingAi}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    {loadingAi ? 'جاري التحليل...' : 'تحديث التحليل الذكي'}
                  </button>
                </div>

                <div className="text-xs text-purple-950 whitespace-pre-line leading-relaxed">
                  {aiExplanation || (
                    <span>
                      انقر على "تحديث التحليل الذكي" للحصول على تقييم سياقي للعميل، سبب تصنيف المخاطر، والخطوات التكتيكية الموصى بها للتفاوض واسترداد المبلغ دون خسارة العلاقة التجارية.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
