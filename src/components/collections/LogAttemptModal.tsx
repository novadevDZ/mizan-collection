import React, { useState } from 'react';
import { X, PhoneCall, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types';
import { fetchJson } from '../../lib/apiClient';

interface LogAttemptModalProps {
  customers: Customer[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (newAttempt: any) => void;
}

export const LogAttemptModal: React.FC<LogAttemptModalProps> = ({
  customers,
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || (customers[0]?.id || ''));
  const [channel, setChannel] = useState<'phone_call' | 'in_person_visit' | 'whatsapp' | 'official_notice'>('phone_call');
  const [result, setResult] = useState<'promised_payment' | 'no_answer' | 'refused' | 'asked_for_delay'>('promised_payment');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('يرجى اختيار العميل');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetchJson('/api/collections/attempts', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          channel,
          result,
          notes,
          nextFollowUpDate,
        }),
      });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل المتابعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">تسجيل متابعة تحصيل (Log Attempt)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
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
            <label className="font-bold text-slate-700 block mb-1">العميل *</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.companyName || c.wilaya})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">وسيلة التواصل *</label>
              <select
                value={channel}
                onChange={(e: any) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="phone_call">اتصال هاتفي</option>
                <option value="in_person_visit">زيارة ميدانية للمحل</option>
                <option value="whatsapp">مراسلة واتساب</option>
                <option value="official_notice">إشعار رسمي كتابي</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">النتيجة الأولية *</label>
              <select
                value={result}
                onChange={(e: any) => setResult(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="promised_payment">تعهد بالدفع (وعد)</option>
                <option value="asked_for_delay">طلب مهلة وتمديد</option>
                <option value="no_answer">لم يجب / مغلق</option>
                <option value="refused">رفض السداد أو تعنت</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">تفاصيل المحادثة والملاحظات</label>
            <textarea
              rows={3}
              required
              placeholder="مثال: تحدثت مع السيد أحمد، قال إن السلع بيعت وسيودع المبلغ عبر بريدي موب يوم الخميس..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">تاريخ المتابعة القادمة (اختياري)</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {saving ? 'جاري الحفظ...' : 'تسجيل المتابعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
