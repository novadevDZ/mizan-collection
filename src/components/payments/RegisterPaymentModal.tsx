import React, { useState } from 'react';
import { X, Banknote, CreditCard, Building, FileCheck } from 'lucide-react';
import { Customer, Payment } from '../../types';
import { formatDZD, PAYMENT_METHODS } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';
import { savePaymentToFirestore } from '../../lib/firestoreService';

interface RegisterPaymentModalProps {
  customers: Customer[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (newPayment: any) => void;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  customers,
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || (customers[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleFillFullBalance = () => {
    if (selectedCustomer) {
      setAmount(selectedCustomer.outstandingBalance.toString());
    }
  };

  const handleFillOverdueBalance = () => {
    if (selectedCustomer) {
      setAmount(selectedCustomer.overdueBalance.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('يرجى اختيار العميل');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('يرجى إدخال مبلغ دفع صالح أكبر من الصفر');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetchJson<Payment>('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          amount: numAmount,
          paymentMethod,
          referenceNumber,
          paymentDate,
          notes,
        }),
      });
      try {
        if (res && res.id) {
          await savePaymentToFirestore(res);
        }
      } catch (fsErr) {
        console.warn('Firestore payment persist notice:', fsErr);
      }
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-emerald-900 text-white p-4 px-6 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">تسجيل دفعة وقبض أموال (Payment Entry)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white rounded-lg">
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
            <label className="font-bold text-slate-700 block mb-1">العميل الذي قام بالسداد *</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - المستحق بذمته: {formatDZD(c.outstandingBalance)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Balance Fill */}
          {selectedCustomer && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500">إجمالي الدين القائم:</span>
                <span className="font-black text-slate-900 mr-2">{formatDZD(selectedCustomer.outstandingBalance)}</span>
              </div>
              <div className="flex gap-1.5">
                {selectedCustomer.overdueBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleFillOverdueBalance}
                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold text-[11px]"
                  >
                    المتأخر ({formatDZD(selectedCustomer.overdueBalance)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFillFullBalance}
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-[11px]"
                >
                  كامل الرصيد
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">المبلغ المدفوع (دج) *</label>
              <input
                type="number"
                required
                min="100"
                step="500"
                placeholder="مثال: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-base font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ العملية</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">وسيلة الدفع الجزائرية *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.labelAr} ({m.labelFr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الرقم المرجعي / رقم الشيك</label>
              <input
                type="text"
                placeholder="مثال: CHQ-994102 أو وصل CCP"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ملاحظات القبض</label>
            <input
              type="text"
              placeholder="مثال: دفعة جزئية عن فاتورة شهر ماي، استلمها كريم..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {saving ? 'جاري التسجيل...' : 'تأكيد القبض وتخفيض الدين'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
