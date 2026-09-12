import React from 'react';
import { AgingBucket } from '../../types';
import { formatDZD } from '../../lib/algeriaData';
import { BarChart3, Users, FileText } from 'lucide-react';

interface AgingChartProps {
  buckets: AgingBucket[];
  onSelectBucket?: (key: string) => void;
}

export const AgingChart: React.FC<AgingChartProps> = ({ buckets, onSelectBucket }) => {
  if (!buckets || buckets.length === 0) return null;

  const totalAmount = buckets.reduce((sum, b) => sum + b.amount, 0);

  // Color mapping based on risk progression
  const colors: Record<string, { bar: string; text: string; bg: string }> = {
    current: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    days_1_7: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    days_8_30: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    days_31_60: { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    days_61_90: { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
    days_90_plus: { bar: 'bg-purple-900', text: 'text-purple-900', bg: 'bg-purple-50' },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            تحليل تقادم الديون (Receivables Aging)
          </h3>
          <p className="text-xs text-slate-500">
            توزيع المبالغ غير المحصلة حسب فترات التأخر عن موعد الاستحقاق
          </p>
        </div>

        <div className="text-left">
          <span className="text-xs text-slate-400">إجمالي الرصيد:</span>
          <div className="font-black text-slate-800 text-sm">{formatDZD(totalAmount)}</div>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-inner mb-6">
        {buckets.map((b) => {
          if (b.percentage <= 0) return null;
          const c = colors[b.key] || colors.current;
          return (
            <div
              key={b.key}
              style={{ width: `${b.percentage}%` }}
              className={`${c.bar} h-full transition-all hover:opacity-90 cursor-pointer`}
              title={`${b.labelAr}: ${formatDZD(b.amount)} (${b.percentage}%)`}
              onClick={() => onSelectBucket && onSelectBucket(b.key)}
            />
          );
        })}
      </div>

      {/* Grid of Buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {buckets.map((b) => {
          const c = colors[b.key] || colors.current;
          return (
            <div
              key={b.key}
              onClick={() => onSelectBucket && onSelectBucket(b.key)}
              className={`p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer ${
                b.amount > 0 ? 'bg-slate-50/50' : 'bg-white opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
                <span className="text-xs font-bold text-slate-700 truncate">{b.labelAr}</span>
              </div>

              <div className="font-extrabold text-slate-900 text-sm">
                {formatDZD(b.amount)}
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{b.percentage}%</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  {b.customerCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
