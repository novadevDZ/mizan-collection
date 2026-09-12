import React from 'react';
import { AgingBucket, Customer } from '../../types';
import { formatDZD, RISK_LEVEL_DICT } from '../../lib/algeriaData';
import { BarChart3, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

interface AgingReportViewProps {
  buckets: AgingBucket[];
  customers: Customer[];
  onViewCustomer: (customerId: string) => void;
}

export const AgingReportView: React.FC<AgingReportViewProps> = ({ buckets, customers, onViewCustomer }) => {
  const totalReceivables = buckets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900">تقرير أعمار الديون (Aging Schedule)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            جدول زمني محاسبي دقيق لتصنيف كافة المستحقات غير المسددة حسب فترات التأخر عن موعد الاستحقاق
          </p>
        </div>

        <div className="text-left">
          <span className="text-xs text-slate-400">إجمالي الديون القائمة:</span>
          <div className="text-xl font-black text-slate-900">{formatDZD(totalReceivables)}</div>
        </div>
      </div>

      {/* Buckets Visual Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {buckets.map((b) => (
          <div key={b.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-500 mb-1">{b.labelAr}</div>
            <div className="text-base font-black text-slate-900">{formatDZD(b.amount)}</div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">{b.percentage}% من المجموع</span>
              <span className="text-slate-500 font-mono">{b.customerCount} عملاء</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Overdue Risk Clients Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700">
            تفصيل العملاء الذين تجاوزت ديونهم آجال السداد
          </span>
          <span className="text-xs text-slate-500">
            مرتبين تنازلياً حسب حجم الدين المتأخر
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/60 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">الولاية</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4">إجمالي الدين</th>
                <th className="py-3 px-4 text-rose-700">المبلغ المتأخر</th>
                <th className="py-3 px-4">مستوى الخطر</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers
                .filter((c) => c.overdueBalance > 0)
                .sort((a, b) => b.overdueBalance - a.overdueBalance)
                .map((cust) => {
                  const risk = RISK_LEVEL_DICT[cust.riskLevel] || RISK_LEVEL_DICT.medium;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cust.name} {cust.companyName ? `(${cust.companyName})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{cust.wilaya}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{cust.phone}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{formatDZD(cust.outstandingBalance)}</td>
                      <td className="py-3 px-4 font-black text-rose-700">{formatDZD(cust.overdueBalance)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${risk.bg} ${risk.color}`}>
                          {risk.labelAr} ({cust.riskScore})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewCustomer(cust.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs cursor-pointer"
                        >
                          عرض الحساب
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
