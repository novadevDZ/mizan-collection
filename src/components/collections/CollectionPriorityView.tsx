import React, { useState } from 'react';
import { 
  Zap, AlertTriangle, PhoneCall, MessageCircle, 
  CalendarClock, ShieldAlert, Sparkles, Building2, 
  CheckCircle, Filter, ArrowUpDown, Banknote
} from 'lucide-react';
import { TodayActionItem } from '../../types';
import { formatDZD, RISK_LEVEL_DICT, getWhatsAppUrl } from '../../lib/algeriaData';

interface CollectionPriorityViewProps {
  items: TodayActionItem[];
  onViewCustomer: (customerId: string) => void;
  onLogAttempt: (customerId: string) => void;
  onRecordPromise: (customerId: string) => void;
  onGenerateAiMessage: (item: TodayActionItem) => void;
  onQuickPayment: (customerId: string) => void;
}

export const CollectionPriorityView: React.FC<CollectionPriorityViewProps> = ({
  items,
  onViewCustomer,
  onLogAttempt,
  onRecordPromise,
  onGenerateAiMessage,
  onQuickPayment,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'broken' | 'critical' | 'high_amount'>('all');

  const filteredItems = items.filter((it) => {
    if (filterType === 'broken') {
      return it.latestPromise && it.latestPromise.status === 'broken';
    }
    if (filterType === 'critical') {
      return it.customer.riskLevel === 'critical' || it.customer.riskLevel === 'high';
    }
    if (filterType === 'high_amount') {
      return it.totalOverdueAmount >= 200000;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900">أولويات التحصيل الذكية</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ترتيب العملاء آلياً حسب: حجم الدين + مدة التأخير + مؤشر الخطر + وعود الدفع المنقوضة.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setFilterType('broken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'broken'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            وعود لم تُنفّذ
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'critical'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            خطر مرتفع / حرج
          </button>
          <button
            onClick={() => setFilterType('high_amount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'high_amount'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            المبالغ الكبيرة (+200,000 دج)
          </button>
        </div>
      </div>

      {/* Target List: "أفضل العملاء الذين يجب متابعتهم الآن" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            قائمة التحصيل المرتبة حسب الأولوية
          </span>
          <span className="text-xs text-slate-500 font-medium">
            عدد الحسابات: {filteredItems.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredItems.map((item, index) => {
            const cust = item.customer;
            const riskInfo = RISK_LEVEL_DICT[cust.riskLevel] || RISK_LEVEL_DICT.medium;
            const isBrokenPromise = item.latestPromise && item.latestPromise.status === 'broken';

            // Pre-drafted WhatsApp message
            const defaultWaText = `السلام عليكم سيدي ${cust.name}، نود تذكيركم بضرورة تسوية الرصيد المستحق قدره ${formatDZD(cust.overdueBalance)} المتأخر عن موعده بـ ${item.oldestOverdueDays} يوماً. نرجو منكم تحديد موعد السداد وشكراً لتعاونكم مع مؤسستنا.`;
            const waUrl = getWhatsAppUrl(cust.whatsapp || cust.phone, defaultWaText);

            return (
              <div
                key={cust.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Priority Rank & Details */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    index === 0
                      ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                      : index < 3
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onViewCustomer(cust.id)}
                        className="font-extrabold text-slate-900 text-base hover:text-emerald-700 transition-colors text-right"
                      >
                        {cust.name}
                      </button>
                      {cust.companyName && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Building2 className="w-3 h-3" />
                          {cust.companyName}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">({cust.wilaya})</span>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${riskInfo.bg} ${riskInfo.color}`}>
                        خطر {riskInfo.labelAr} ({cust.riskScore})
                      </span>

                      {isBrokenPromise && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          وعد سداد لم يتم الوفاء به!
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs flex-wrap">
                      <div className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        المبلغ المتأخر: {formatDZD(cust.overdueBalance)}
                      </div>
                      <div className="text-slate-600">
                        إجمالي الرصيد: <strong className="font-bold text-slate-800">{formatDZD(cust.outstandingBalance)}</strong>
                      </div>
                      <div className="text-slate-500">
                        التأخير: <strong className="font-bold text-slate-700">{item.oldestOverdueDays} يوماً</strong>
                      </div>
                      <div className="text-slate-500">
                        الهاتف: <strong className="font-mono text-slate-700">{cust.phone}</strong>
                      </div>
                    </div>

                    {/* Action Suggestion */}
                    <div className="mt-2 text-xs text-slate-600 bg-slate-100/80 rounded px-2.5 py-1 inline-flex items-center gap-1.5 border border-slate-200/50">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>الإجراء الموصى به: <strong className="text-slate-900">{item.recommendedAction}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Inline Action Toolbar */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap border-t lg:border-t-0 pt-3 lg:pt-0">
                  {/* View Customer 360 */}
                  <button
                    onClick={() => onViewCustomer(cust.id)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    كشف الحساب
                  </button>

                  {/* Log Call */}
                  <button
                    onClick={() => onLogAttempt(cust.id)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    تسجيل اتصال
                  </button>

                  {/* Record Promise to Pay */}
                  <button
                    onClick={() => onRecordPromise(cust.id)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CalendarClock className="w-3 h-3" />
                    تثبيت وعد دفع
                  </button>

                  {/* AI Message */}
                  <button
                    onClick={() => onGenerateAiMessage(item)}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    رسالة ذكية
                  </button>

                  {/* Quick Payment */}
                  <button
                    onClick={() => onQuickPayment(cust.id)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Banknote className="w-3 h-3" />
                    سداد
                  </button>

                  {/* WhatsApp */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    واتساب
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
