import React, { useState } from 'react';
import { X, Package, AlertCircle, Check, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { Product } from '../../types';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, delta: number, reason: string) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('توريد واستلام بضاعة جديدة');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity;

  let delta = 0;
  let newStock = currentStock;

  if (adjustType === 'in') {
    delta = Math.max(0, quantity);
    newStock = currentStock + delta;
  } else if (adjustType === 'out') {
    delta = -Math.min(currentStock, Math.max(0, quantity));
    newStock = Math.max(0, currentStock + delta);
  } else {
    // set absolute
    newStock = Math.max(0, quantity);
    delta = newStock - currentStock;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      setError('يرجى تحديد كمية للتعديل');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(product.id, delta, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث المخزون');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">تعديل المخزون</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{product.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Current Stock Badge */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المخزون الحالي:</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {currentStock} {product.unit}
            </span>
          </div>

          {/* Operation Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustType('in');
                  setReason('توريد واستلام بضاعة جديدة');
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  adjustType === 'in'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>إضافة (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustType('out');
                  setReason('إتلاف أو خروج بضاعة');
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  adjustType === 'out'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                <span>خصم (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustType('set');
                  setQuantity(currentStock);
                  setReason('جرد تسوية دوري للمخزن');
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  adjustType === 'set'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>جرد وتسوية (=)</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {adjustType === 'set' ? 'الكمية الفعلية بعد الجرد:' : 'الكمية المراد تعديلها:'}
            </label>
            <input
              type="number"
              min={adjustType === 'set' ? 0 : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">سبب التعديل / ملاحظات:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: فاتورة استلام من المورد رقم 842"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Resulting Stock Preview */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-900">المخزون الجديد المتوقع:</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              {newStock} {product.unit} 
              <span className="text-xs text-slate-400 mr-1.5 font-normal">
                ({delta >= 0 ? `+${delta}` : delta})
              </span>
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  تأكيد تعديل المخزون
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
