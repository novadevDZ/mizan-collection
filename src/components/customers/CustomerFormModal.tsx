import React, { useState } from 'react';
import { X, UserPlus, Building2, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import { ALGERIA_WILAYAS } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';
import { saveCustomerToFirestore } from '../../lib/firestoreService';
import { Customer } from '../../types';

interface CustomerFormModalProps {
  onClose: () => void;
  onSuccess: (newCust: any) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    wilaya: 'الجزائر العاصمة',
    commune: '',
    customerType: 'retailer',
    creditLimit: '300000',
    paymentTermsDays: '30',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف على الأقل');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetchJson<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      try {
        if (res && res.id) {
          await saveCustomerToFirestore(res);
        }
      } catch (fsErr) {
        console.warn('Firestore customer persist notice:', fsErr);
      }
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ العميل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">إضافة عميل تجاري جديد</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم العميل المسؤول *</label>
              <input
                type="text"
                required
                placeholder="مثال: جمال بن عمارة"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم المحل أو الشركة</label>
              <input
                type="text"
                placeholder="مثال: سوبرماركت الواحة"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم الهاتف (الجزائر) *</label>
              <input
                type="tel"
                required
                placeholder="مثال: 0550 12 34 56"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: formData.whatsapp || e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم الواتساب</label>
              <input
                type="tel"
                placeholder="مثال: 0550 12 34 56"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الولاية (58 ولاية)</label>
              <select
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.nameAr}>
                    {w.code} - {w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">البلدية أو الحي</label>
              <input
                type="text"
                placeholder="مثال: الحراش"
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الحد الائتماني المسموح به (دج)</label>
              <input
                type="number"
                step="10000"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">أجل السداد الممنوح (بالأيام)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ملاحظات إضافية عن الزبون</label>
            <textarea
              rows={2}
              placeholder="مثال: يفضل الدفع بشيكات كل نهاية أسبوع، الاتصال به صباحاً..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {saving ? 'جاري الحفظ...' : 'حفظ العميل في النظام'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
