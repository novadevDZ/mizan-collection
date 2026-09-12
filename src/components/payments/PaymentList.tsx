import React, { useState } from 'react';
import { Payment } from '../../types';
import { formatDZD, PAYMENT_METHOD_DICT } from '../../lib/algeriaData';
import { Search, Plus, Banknote, FileCheck, ExternalLink } from 'lucide-react';

interface PaymentListProps {
  payments: Payment[];
  onNewPayment: () => void;
  onViewCustomer: (customerId: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, onNewPayment, onViewCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = payments.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">سجل المقبوضات والتحصيلات</h1>
          <p className="text-xs text-slate-500">
            إجمالي الأموال المحصلة: <strong className="text-emerald-700 font-bold">{formatDZD(totalCollected)}</strong> عبر مختلف وسائل الدفع الجزائرية
          </p>
        </div>

        <button
          onClick={onNewPayment}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          تسجيل دفعة جديدة
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث برقم الوصل، العميل، أو رقم الشيك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">رقم الوصل</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">تاريخ الدفع</th>
                <th className="py-3 px-4">وسيلة الدفع</th>
                <th className="py-3 px-4">المرجع / الشيك</th>
                <th className="py-3 px-4">المبلغ المقبوض</th>
                <th className="py-3 px-4">المحصل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const method = PAYMENT_METHOD_DICT[p.paymentMethod] || PAYMENT_METHOD_DICT.cash;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <button
                        onClick={() => onViewCustomer(p.customerId)}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {p.customerName}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {method.labelAr}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">{formatDZD(p.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{p.collectedByName || 'كريم براهيمي'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد مدفوعات مسجلة.
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
