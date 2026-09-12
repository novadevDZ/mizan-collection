import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, MessageCircle, Copy, Check, 
  Send, RefreshCw, AlertCircle, Smartphone 
} from 'lucide-react';
import { formatDZD, getWhatsAppUrl } from '../../lib/algeriaData';
import { fetchJson } from '../../lib/apiClient';

interface AiMessageModalProps {
  initialData?: {
    customerName: string;
    companyName?: string;
    outstandingAmount: number;
    oldestOverdueDays: number;
    invoiceNumber?: string;
    phone?: string;
  };
  onClose: () => void;
}

export const AiMessageModal: React.FC<AiMessageModalProps> = ({ initialData, onClose }) => {
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [outstandingAmount, setOutstandingAmount] = useState(initialData?.outstandingAmount || 100000);
  const [oldestOverdueDays, setOldestOverdueDays] = useState(initialData?.oldestOverdueDays || 15);
  const [tone, setTone] = useState<'friendly' | 'professional' | 'firm' | 'final_warning'>('professional');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [phone, setPhone] = useState(initialData?.phone || '0550123456');

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setCopied(false);
      const res = await fetchJson<{ message: string; subject?: string; isFallback?: boolean }>(
        '/api/ai/generate-message',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName,
            companyName,
            outstandingAmount,
            oldestOverdueDays,
            tone,
            channel,
          }),
        }
      );
      setMessage(res.message);
      if (res.subject) setSubject(res.subject);
      setIsFallback(!!res.isFallback);
    } catch (err) {
      console.error('Failed to generate message:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [tone, channel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waUrl = getWhatsAppUrl(phone, message);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-purple-900 text-white p-4 px-6 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <div>
              <h3 className="font-bold text-base">مساعد التحصيل الذكي (AI Collection Assistant)</h3>
              <p className="text-[11px] text-purple-200">توليد رسائل مطالبة مخصصة بالذكاء الاصطناعي مع الحفاظ على العلاقة التجارية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-purple-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Target Customer Strip */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 flex items-center justify-between">
            <div>
              <span className="text-purple-900 font-bold">{customerName} {companyName ? `(${companyName})` : ''}</span>
              <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                المبلغ المستحق: <strong>{formatDZD(outstandingAmount)}</strong> | التأخير: <strong>{oldestOverdueDays} يوماً</strong>
              </div>
            </div>
            <span className="text-[11px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono font-bold">
              Gemini Pro
            </span>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">نبرة الخطاب والمطالبة (Tone):</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTone('friendly')}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  tone === 'friendly'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ودية ومحترمة
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">تأخير بسيط</span>
              </button>

              <button
                type="button"
                onClick={() => setTone('professional')}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  tone === 'professional'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                مهنية ومعتادة
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">تذكير رسمي</span>
              </button>

              <button
                type="button"
                onClick={() => setTone('firm')}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  tone === 'firm'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                حازمة وجدية
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">+20 يوماً</span>
              </button>

              <button
                type="button"
                onClick={() => setTone('final_warning')}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  tone === 'final_warning'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                إنذار أخير
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">قبل الإجراءات</span>
              </button>
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">قناة الإرسال:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                واتساب (WhatsApp)
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  channel === 'sms'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                رسالة نصية (SMS)
              </button>
            </div>
          </div>

          {/* Message Output Preview */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">نص الرسالة المقترح:</label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                إعادة صياغة النص
              </button>
            </div>

            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Actions & WhatsApp Launch */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ للحافظة!' : 'نسخ النص'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                إغلاق
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                فتح في واتساب ويب فوراً
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
