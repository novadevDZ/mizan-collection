import React, { useState } from 'react';
import { X, CalendarClock, AlertCircle, ShieldAlert } from 'lucide-react';
import { Customer } from '../../types';
import { formatDZD } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';

interface PromiseToPayModalProps {
  customers: Customer[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (newPromise: any) => void;
}

export const PromiseToPayModal: React.FC<PromiseToPayModalProps> = ({
  customers,
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || (customers[0]?.id || ''));
  const selectedCust = customers.find((c) => c.id === customerId);

  const [promisedAmount, setPromisedAmount] = useState(
    selectedCust ? selectedCust.overdueBalance || selectedCust.outstandingBalance : ''
  );

  // Default promised date = 3 days ahead
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  const [promisedDate, setPromisedDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !promisedAmount || !promisedDate) {
      setError('يرجى تحديد العميل والمبلغ المتعهد به وتاريخ السداد المحدد');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetchJson('/api/collections/promises', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          promisedAmount: Number(promisedAmount),
          promisedDate,
          notes,
        }),
      });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل وعد الدفع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-amber-900 text-white p-4 px-6 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">تثبيت وعد بالدفع (Promise To Pay)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-amber-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">العميل المتعهد *</label>
            <select
              required
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = customers.find((cust) => cust.id === e.target.value);
                if (c) setPromisedAmount(c.overdueBalance || c.outstandingBalance);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - الدين القائم: {formatDZD(c.outstandingBalance)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">المبلغ المتعهد بدفعه (دج) *</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ الوفاء بالوعد *</label>
              <input
                type="date"
                required
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ملاحظات والتزامات العميل</label>
            <textarea
              rows={3}
              placeholder="مثال: وعد بإيداع 150 ألف عبر بريدي موب في حدود الساعة 14:00..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Warning notice about Broken Promise automation */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              سيقوم النظام آلياً بإنشاء مهمة متابعة في تاريخ الوعد. في حال انقضاء التاريخ دون تسجيل سداد، سيُصنف كـ <strong>وعد منقوض (Broken Promise)</strong> مما يرفع مؤشر خطر العميل فوراً.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {saving ? 'جاري التثبيت...' : 'تثبيت الوعد وجدولة المتابعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
