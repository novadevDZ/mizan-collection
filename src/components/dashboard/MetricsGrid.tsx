import React from 'react';
import { 
  Wallet, AlertOctagon, Calendar, CheckCircle, 
  TrendingUp, Clock, ShieldAlert, Users, ArrowUpRight
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { formatDZD } from '../../lib/algeriaData';

interface MetricsGridProps {
  stats: DashboardStats;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ stats }) => {
  const overduePercentage = stats.totalReceivables > 0 
    ? Math.round((stats.overdueReceivables / stats.totalReceivables) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Receivables */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">إجمالي الديون القائمة</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
          {formatDZD(stats.totalReceivables)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span>أموالك غير المحصلة لدى</span>
          <strong className="text-slate-700 font-bold">{stats.totalCustomersCount} زبون</strong>
        </div>
      </div>

      {/* 2. Overdue Receivables (High Danger Metric) */}
      <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-700">الديون المتأخرة عن الأجل</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-rose-700 tracking-tight">
          {formatDZD(stats.overdueReceivables)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
            {overduePercentage}% من إجمالي ديونك
          </span>
          <span>تجاوزت مهلة السداد</span>
        </div>
      </div>

      {/* 3. Collected This Month */}
      <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700">تم تحصيله هذا الشهر</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-emerald-800 tracking-tight">
          {formatDZD(stats.collectedThisMonth)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>نسبة التحصيل الإجمالية:</span>
          <strong className="font-bold">{stats.collectionRate}%</strong>
        </div>
      </div>

      {/* 4. Risk & Speed Indicators */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">الخطر وسرعة السداد</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <div className="text-xl font-black text-amber-700">
              {stats.highRiskCustomersCount} <span className="text-xs font-normal text-slate-500">عملاء</span>
            </div>
            <div className="text-[11px] text-amber-800 font-semibold">تصنيف عالي / حرج</div>
          </div>
          <div className="text-left border-r border-slate-200 pr-3">
            <div className="text-xl font-black text-slate-800">
              {stats.averageDaysToPayment} <span className="text-xs font-normal text-slate-500">يوم</span>
            </div>
            <div className="text-[11px] text-slate-500">متوسط أجل الدفع</div>
          </div>
        </div>
      </div>
    </div>
  );
};
