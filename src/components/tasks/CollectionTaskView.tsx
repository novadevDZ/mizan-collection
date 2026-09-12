import React, { useState } from 'react';
import { CollectionTask, Customer } from '../../types';
import { formatDZD } from '../../lib/algeriaData';
import { CheckSquare, Plus, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react';
import { fetchJson } from '../../lib/apiClient';

interface CollectionTaskViewProps {
  tasks: CollectionTask[];
  customers: Customer[];
  onRefresh: () => void;
  onViewCustomer: (customerId: string) => void;
}

export const CollectionTaskView: React.FC<CollectionTaskViewProps> = ({
  tasks,
  customers,
  onRefresh,
  onViewCustomer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await fetchJson(`/api/collections/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchJson('/api/collections/tasks', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          title,
          targetAmount: Number(targetAmount) || 0,
          dueDate,
          priority,
        }),
      });
      setShowAddModal(false);
      setTitle('');
      setTargetAmount('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">مهام التحصيل اليومية</h1>
          <p className="text-xs text-slate-500">
            جدول متابعات فريق التحصيل الميداني والمكتبي
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          مهمة تحصيل جديدة
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {tasks.map((t) => {
          const isDone = t.status === 'completed';
          return (
            <div
              key={t.id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                isDone ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleTask(t.id, t.status)}
                  className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-emerald-500 bg-white'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {t.title}
                    </span>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      t.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                      t.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority === 'high' ? 'أولوية قصوى' : t.priority === 'medium' ? 'متوسطة' : 'عادية'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {t.customerName && (
                      <button
                        onClick={() => onViewCustomer(t.customerId)}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        العميل: {t.customerName}
                      </button>
                    )}

                    {t.targetAmount > 0 && (
                      <span className="font-bold text-slate-800">
                        المبلغ المستهدف: {formatDZD(t.targetAmount)}
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      تاريخ الاستحقاق: {t.dueDate}
                    </span>

                    <span className="flex items-center gap-1 text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      المكلف: {t.assignedToName || 'المحصل'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد مهام تحصيل حالية.
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <h3 className="font-bold text-sm">إضافة مهمة تحصيل جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">العميل المستهدف</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المهمة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زيارة متجر الأمل لاستلام شيك الدفعة الثانية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المبلغ المطلوب (دج)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ التنفيذ</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold"
                >
                  حفظ المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
