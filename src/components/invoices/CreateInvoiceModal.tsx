import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Calculator, Package } from 'lucide-react';
import { Customer, Invoice, Product } from '../../types';
import { formatDZD } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';
import { saveInvoiceToFirestore } from '../../lib/firestoreService';

interface CreateInvoiceModalProps {
  customers: Customer[];
  products?: Product[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (newInv: any) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  customers,
  products = [],
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || (customers[0]?.id || ''));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // If customer changes and no custom due date, compute from customer's terms
  const calculateDefaultDueDate = (cust?: Customer) => {
    if (!cust) return '';
    const d = new Date(issueDate);
    d.setDate(d.getDate() + (cust.paymentTermsDays || 30));
    return d.toISOString().split('T')[0];
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;

    // Check if entered description matches a registered product to auto-fill unitPrice
    if (field === 'description' && products && products.length > 0) {
      const matched = products.find(p => 
        p.name.toLowerCase() === String(val).toLowerCase().trim() ||
        p.barcode === String(val).trim()
      );
      if (matched && matched.salePrice > 0) {
        updated[index].unitPrice = matched.salePrice;
      }
    }

    setItems(updated);
  };

  const totalAmount = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('يرجى اختيار العميل');
      return;
    }
    if (items.length === 0 || totalAmount <= 0) {
      setError('يرجى إضافة بند واحد على الأقل بمبلغ صالح');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetchJson<Invoice>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          items,
          issueDate,
          dueDate: dueDate || calculateDefaultDueDate(selectedCustomer),
          notes,
        }),
      });
      try {
        if (res && res.id) {
          await saveInvoiceToFirestore(res);
        }
      } catch (fsErr) {
        console.warn('Firestore invoice persist notice:', fsErr);
      }
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل إصدار الفاتورة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">إصدار فاتورة بيع جديدة بالدين (Credit Invoice)</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="font-bold text-slate-700 block mb-1">العميل المستفيد *</label>
              <select
                required
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) setDueDate(calculateDefaultDueDate(cust));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName || c.wilaya})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ الفاتورة</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ الاستحقاق (Due Date)</label>
              <input
                type="date"
                value={dueDate || calculateDefaultDueDate(selectedCustomer)}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800">بنود الفاتورة والسلع</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة سطر جديد
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    list="products-datalist"
                    placeholder="وصف السلعة / البضاعة..."
                    value={it.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="products-datalist">
                    {products.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} - {formatDZD(p.salePrice)} ({p.stockQuantity} متوفر بالمخزن)
                      </option>
                    ))}
                  </datalist>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="الكمية"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center focus:outline-none"
                    />
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder="سعر الوحدة"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-left focus:outline-none"
                    />
                  </div>

                  <div className="w-28 text-left font-black text-slate-800 font-mono py-1.5 px-2">
                    {formatDZD(it.quantity * it.unitPrice)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total Calculation */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-black text-sm">
              <span className="text-slate-600">المجموع الإجمالي للفاتورة:</span>
              <span className="text-emerald-700 text-base">{formatDZD(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ملاحظات الفاتورة</label>
            <input
              type="text"
              placeholder="مثال: تسليم مستودع بومرداس، شيك ضمان..."
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
              {saving ? 'جاري الإصدار...' : 'إصدار الفاتورة وتحديث الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
