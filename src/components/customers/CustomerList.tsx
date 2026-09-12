import React, { useState } from 'react';
import { Customer } from '../../types';
import { formatDZD, RISK_LEVEL_DICT, ALGERIA_WILAYAS } from '../../lib/algeriaData';
import { 
  Search, Plus, Filter, Eye, PhoneCall, Building2, 
  MapPin, ShieldAlert, ArrowUpDown, ChevronLeft 
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onViewCustomer: (customerId: string) => void;
  onNewCustomer: () => void;
  onQuickPayment: (customerId: string) => void;
  plan?: string;
  onUpgrade?: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onViewCustomer,
  onNewCustomer,
  onQuickPayment,
  plan = 'starter',
  onUpgrade,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [onlyDebtors, setOnlyDebtors] = useState(false);

  const filtered = customers.filter((c) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches = 
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.accountNumber.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (selectedWilaya !== 'all' && c.wilaya !== selectedWilaya) {
      return false;
    }

    if (selectedRisk !== 'all' && c.riskLevel !== selectedRisk) {
      return false;
    }

    if (onlyDebtors && c.outstandingBalance <= 0) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">سجل العملاء التجاريين</h1>
            {plan === 'starter' && (
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                customers.length >= 50
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                باقة الانطلاق: {customers.length} / 50 عميلاً
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            إدارة الزبائن، الحدود الائتمانية، وأرصدة الديون المستحقة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {plan === 'starter' && customers.length >= 40 && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              الترقية لباقة غير محدودة
            </button>
          )}
          <button
            onClick={() => {
              if (plan === 'starter' && customers.length >= 50) {
                if (onUpgrade) onUpgrade();
                return;
              }
              onNewCustomer();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث بالاسم، المحل، الهاتف، أو رقم الحساب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Wilaya Filter */}
        <select
          value={selectedWilaya}
          onChange={(e) => setSelectedWilaya(e.target.value)}
          className="w-full md:w-44 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">كل الولايات (58)</option>
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w.code} value={w.nameAr}>
              {w.code} - {w.nameAr}
            </option>
          ))}
        </select>

        {/* Risk Filter */}
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="w-full md:w-36 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">كل درجات الخطر</option>
          <option value="low">منخفض (0-30)</option>
          <option value="medium">متوسط (31-60)</option>
          <option value="high">مرتفع (61-80)</option>
          <option value="critical">حرج جداً (+80)</option>
        </select>

        {/* Debtors Only Checkbox */}
        <label className="flex items-center gap-1.5 text-xs text-slate-700 select-none cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyDebtors}
            onChange={(e) => setOnlyDebtors(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          فقط من لديهم ديون
        </label>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">رقم الحساب والعميل</th>
                <th className="py-3 px-4">المحل والولاية</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4">الحد الائتماني</th>
                <th className="py-3 px-4">إجمالي الديون</th>
                <th className="py-3 px-4">المبلغ المتأخر</th>
                <th className="py-3 px-4">مؤشر الخطر</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cust) => {
                const risk = RISK_LEVEL_DICT[cust.riskLevel] || RISK_LEVEL_DICT.medium;
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onViewCustomer(cust.id)}
                        className="font-bold text-slate-900 text-sm hover:text-emerald-700 text-right block"
                      >
                        {cust.name}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">{cust.accountNumber}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{cust.companyName || 'بدون اسم تجاري'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cust.wilaya} {cust.commune ? `- ${cust.commune}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {cust.phone}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {formatDZD(cust.creditLimit)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-black text-sm ${cust.outstandingBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                        {formatDZD(cust.outstandingBalance)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cust.overdueBalance > 0 ? (
                        <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {formatDZD(cust.overdueBalance)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${risk.bg} ${risk.color}`}>
                        {risk.labelAr} ({cust.riskScore})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewCustomer(cust.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="فتح الملف المالي وكشف الحساب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onQuickPayment(cust.id)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px] transition-colors"
                          title="تسجيل دفعة لهذا العميل"
                        >
                          سداد
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    لم يتم العثور على عملاء يطابقون شروط البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
