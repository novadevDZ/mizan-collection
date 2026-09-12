import React from 'react';
import { 
  AlertTriangle, PhoneCall, MessageCircle, FileSpreadsheet, 
  ExternalLink, Sparkles, Clock, CheckCircle2, ChevronRight, User, Building2
} from 'lucide-react';
import { TodayActionItem } from '../../types';
import { formatDZD, RISK_LEVEL_DICT, getWhatsAppUrl } from '../../lib/algeriaData';

interface GoldenFollowUpWidgetProps {
  items: TodayActionItem[];
  onViewCustomer: (customerId: string) => void;
  onLogAttempt: (customerId: string) => void;
  onGenerateAiMessage: (item: TodayActionItem) => void;
  onQuickPayment: (customerId: string) => void;
  onViewAllPriority: () => void;
}

export const GoldenFollowUpWidget: React.FC<GoldenFollowUpWidgetProps> = ({
  items,
  onViewCustomer,
  onLogAttempt,
  onGenerateAiMessage,
  onQuickPayment,
  onViewAllPriority,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-base">لا توجد ديون مستعجلة للمتابعة اليوم!</h3>
        <p className="text-slate-500 text-xs mt-1">كافة الحسابات ضمن فترات السماح أو تم الاتفاق عليها.</p>
      </div>
    );
  }

  // Display top 3-4 on the widget, with view all link
  const displayItems = items.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-amber-200/80 shadow-sm overflow-hidden">
      {/* Widget Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 px-5 py-3.5 border-b border-amber-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-base">يحتاج متابعة اليوم</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {items.length} عملاء ذوو أولوية
              </span>
            </div>
            <p className="text-xs text-slate-600">
              ديون متأخرة أو وعود سداد انتهت مهلتها تستوجب التدخل الفوري
            </p>
          </div>
        </div>

        <button
          onClick={onViewAllPriority}
          className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
        >
          عرض كل أولويات التحصيل
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Widget Items Grid */}
      <div className="divide-y divide-slate-100">
        {displayItems.map((item) => {
          const cust = item.customer;
          const riskInfo = RISK_LEVEL_DICT[cust.riskLevel] || RISK_LEVEL_DICT.medium;
          const isBrokenPromise = item.latestPromise && item.latestPromise.status === 'broken';

          // Pre-drafted WhatsApp message
          const defaultWaText = `السلام عليكم سيدي ${cust.name}، نود تذكيركم بمبلغ مستحق قدره ${formatDZD(cust.overdueBalance)} متأخر عن أجل السداد. نرجو التكرم بموافاتنا بوصل الدفع أو موعد السداد، وشكراً لتعاونكم.`;
          const waUrl = getWhatsAppUrl(cust.whatsapp || cust.phone, defaultWaText);

          return (
            <div
              key={cust.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Customer Info & Financials */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-base">{cust.name}</span>
                  {cust.companyName && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {cust.companyName}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">({cust.wilaya})</span>
                  
                  {/* Risk Badge */}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${riskInfo.bg} ${riskInfo.color}`}>
                    خطر: {riskInfo.labelAr} ({cust.riskScore}/100)
                  </span>

                  {isBrokenPromise && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                      وعد دفع لم ينفذ!
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <span>المبلغ المتأخر:</span>
                    <span className="text-sm font-black">{formatDZD(cust.overdueBalance)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>متأخر منذ: <strong className="text-slate-800 font-bold">{item.oldestOverdueDays} يوماً</strong></span>
                  </div>

                  <div className="text-slate-500">
                    الهاتف: <strong className="font-mono text-slate-700">{cust.phone}</strong>
                  </div>
                </div>

                {/* Recommended Next Action */}
                <div className="mt-2 text-xs text-amber-900 bg-amber-50/70 border border-amber-200/50 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>الإجراء المقترح: <strong>{item.recommendedAction}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                {/* 1. View Account */}
                <button
                  id={`btn-view-360-${cust.id}`}
                  onClick={() => onViewCustomer(cust.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="فتح الملف المالي وكشف الحساب"
                >
                  عرض الحساب
                </button>

                {/* 2. Log Attempt */}
                <button
                  id={`btn-log-attempt-${cust.id}`}
                  onClick={() => onLogAttempt(cust.id)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="تسجيل مكالمة هاتفية أو زيارة ميدانية"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  تسجيل متابعة
                </button>

                {/* 3. AI Message Generator */}
                <button
                  id={`btn-ai-msg-${cust.id}`}
                  onClick={() => onGenerateAiMessage(item)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="توليد رسالة مطالبة ذكية عبر Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  إنشاء رسالة AI
                </button>

                {/* 4. Quick WhatsApp */}
                <a
                  id={`btn-whatsapp-${cust.id}`}
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="إرسال رسالة مباشرة عبر واتساب"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  إرسال واتساب
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
