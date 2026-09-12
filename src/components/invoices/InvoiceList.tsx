import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatDZD } from '../../lib/algeriaData';
import { Search, Plus, Filter, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewCustomer: (customerId: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onNewInvoice, onViewCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter((i) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && i.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">سجل فواتير البيع بالدين</h1>
          <p className="text-xs text-slate-500">
            متابعة الفواتير الصادرة، المبالغ المحصلة، وحالات التأخر عن الأجل
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          إصدار فاتورة جديدة
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث برقم الفاتورة أو اسم الزبون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">كل الحالات</option>
          <option value="overdue">متأخرة عن الأجل</option>
          <option value="issued">مستحقة (ضمن الأجل)</option>
          <option value="partially_paid">مسددة جزئياً</option>
          <option value="paid">مسددة بالكامل</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">تاريخ الإصدار</th>
                <th className="py-3 px-4">تاريخ الاستحقاق</th>
                <th className="py-3 px-4">المبلغ الإجمالي</th>
                <th className="py-3 px-4">المدفوع</th>
                <th className="py-3 px-4">المتبقي للتحصيل</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">التأخير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <button
                      onClick={() => onViewCustomer(inv.customerId)}
                      className="hover:text-emerald-700 hover:underline"
                    >
                      {inv.customerName}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{inv.issueDate}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{inv.dueDate}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatDZD(inv.total)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{formatDZD(inv.paidAmount)}</td>
                  <td className="py-3 px-4 font-black text-rose-700">{formatDZD(inv.remainingAmount)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                      inv.status === 'partially_paid' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {inv.status === 'paid' ? 'مسددة' :
                       inv.status === 'overdue' ? 'متأخرة' :
                       inv.status === 'partially_paid' ? 'جزئية' : 'مستحقة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">
                    {inv.daysOverdue > 0 ? (
                      <span className="text-rose-700 font-mono">{inv.daysOverdue} يوماً</span>
                    ) : (
                      <span className="text-emerald-700">ضمن الأجل</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    لا توجد فواتير تطابق شروط البحث.
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
