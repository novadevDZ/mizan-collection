import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Mic, MicOff, Plus, Check, AlertCircle, 
  Trash2, X, FileText, ArrowRight, Barcode, DollarSign, Package,
  Layers, RefreshCw, HelpCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Product, SmartProductParsedItem } from '../../types';

interface SmartProductInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: Array<Partial<Product>>) => Promise<void>;
  organizationId: string;
}

type InputTab = 'smart_text' | 'voice' | 'manual';

const SAMPLE_TEXTS = [
  {
    label: 'فاتورة سلع غذائية',
    text: `1. حليب كونديا 1 لتر 12 علبة - شراء 1350 دج - بيع 1520 دج - كمية 80 كرتونة - باركود 613000100123
2. زيت إيليو 5 لتر - شراء 2450 دج - بيع 2700 دج - كمية 40 كرتونة - باركود 613000200456
3. سكر أبيض سيفيتال 1 كغ - شراء 85 دج - بيع 95 دج - كمية 200 كيس - فئة مواد غذائية
4. قهوة فاميكو 250غ - شراء 3800 دج - بيع 4300 دج - كمية 25 كرتونة`
  },
  {
    label: 'وصول مورد منظفات',
    text: `مسحوق غسيل إيزيس 3 كغ أوتوماتيك: سعر الشراء 510 دج، سعر البيع 580 دج، المخزون 50 كيس، باركود 613000300789
ماء جافيل برافو 2 لتر 6 قارورات: شراء 360 دج، بيع 420 دج، المخزون 30 حزمة
صابون يدين دوف 100غ: شراء 130 دج، بيع 160 دج، المخزون 120 قطعة، فئة عناية شخصية`
  },
  {
    label: 'رسالة واتساب سريعة',
    text: `السلام عليكم السلعة الجديدة دخلت اليوم:
طماطم مصبرة كاب 800غ 12 علبة / كرتونة سعر 2900 بيع 3250 الكمية 60
معكرونة سيم 500غ كوع 20 كيس سعر 850 بيع 980 مخزون 100 كرتونة
شامبو هيد آند شولدرز 400مل شراء 480 بيع 560 كمية 36 قارورة`
  }
];

export const SmartProductInputModal: React.FC<SmartProductInputModalProps> = ({
  isOpen,
  onClose,
  onAddProducts,
  organizationId
}) => {
  const [activeTab, setActiveTab] = useState<InputTab>('smart_text');
  
  // Smart Text State
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSource, setParseSource] = useState<'gemini' | 'regex_parser' | null>(null);
  const [parsedItems, setParsedItems] = useState<SmartProductParsedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    sku: '',
    category: 'مواد غذائية عامة',
    unit: 'كرتونة',
    purchasePrice: 0,
    salePrice: 0,
    minSalePrice: 0,
    stockQuantity: 10,
    minStockAlert: 5,
    packaging: '',
    description: '',
  });

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  if (!isOpen) return null;

  // Generate Algerian EAN-13 barcode starting with 613 (Algeria prefix)
  const generateAlgerianBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const barcode12 = `613${randomDigits}`;
    // Compute EAN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode12[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const fullBarcode = `${barcode12}${checkDigit}`;
    setManualForm(prev => ({ ...prev, barcode: fullBarcode }));
  };

  // Handle Smart Parsing
  const handleParseText = async (textToParse: string) => {
    if (!textToParse.trim()) {
      setErrorMessage('يرجى إدخال نص يحتوي على تفاصيل المنتجات والأسعار');
      return;
    }
    setIsParsing(true);
    setErrorMessage(null);
    setSuccessCount(null);

    try {
      const res = await fetch('/api/ai/parse-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': organizationId,
        },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!res.ok) {
        throw new Error('فشل في معالجة النص الذكي');
      }

      const data = await res.json();
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        setParsedItems(data.products);
        setParseSource(data.source);
      } else {
        setErrorMessage('لم يتم العثور على منتجات واضحة في النص المدخل. يرجى التأكد من ذكر اسم السلعة والسعر أو الكمية.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تحليل المنتجات');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Voice Recording
  const toggleRecording = () => {
    if (!voiceSupported) return;

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-DZ'; // Algerian Arabic
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      setVoiceTranscript(transcript.trim());
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Update a single parsed item in table
  const updateParsedItem = (index: number, field: keyof SmartProductParsedItem, value: any) => {
    setParsedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Delete parsed item from table
  const removeParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save all parsed items
  const handleSaveParsedItems = async () => {
    if (parsedItems.length === 0) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onAddProducts(parsedItems);
      setSuccessCount(parsedItems.length);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ المنتجات');
    } finally {
      setIsSaving(false);
    }
  };

  // Save manual form
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name?.trim()) {
      setErrorMessage('يرجى كتابة اسم المنتج');
      return;
    }
    if ((manualForm.salePrice || 0) <= 0) {
      setErrorMessage('يرجى تحديد سعر بيع صحيح');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onAddProducts([manualForm]);
      setSuccessCount(1);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live profit margin for manual form
  const purchasePrice = Number(manualForm.purchasePrice) || 0;
  const salePrice = Number(manualForm.salePrice) || 0;
  const profitMarginVal = salePrice - purchasePrice;
  const profitMarginPercent = purchasePrice > 0 ? ((profitMarginVal / purchasePrice) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                الإدخال الذكي للمنتجات والسلع
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  AI Smart Input
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إدخال المنتجات دفعة واحدة من نصوص الموردين، رسائل الواتساب، الإملاء الصوتي أو الإدخال اليدوي المباشر
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2">
          <button
            onClick={() => setActiveTab('smart_text')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'smart_text'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            تحليل النصوص والوصول الذكي
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'voice'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-500" />
            الإملاء الصوتي المباشر
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-600" />
            إضافة منتج مفرد
          </button>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>تمت إضافة {successCount} منتج بنجاح إلى قاعدة المخزون!</span>
          </div>
        )}

        {/* TAB BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: SMART TEXT PARSING */}
          {activeTab === 'smart_text' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    الصق نص السلع أو الفاتورة أو رسالة الواتساب:
                  </label>
                  <span className="text-xs text-slate-400">
                    يدعم العربية والفرنسية وأسعار الدينار الجزائري دج
                  </span>
                </div>

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="مثال: حليب كونديا 1 لتر 12 علبة - شراء 1350 دج - بيع 1520 دج - كمية 80 كرتونة - باركود 613000100123&#10;زيت إيليو 5 لتر شراء 2450 بيع 2700 كمية 40 كرتونة..."
                  rows={5}
                  className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono leading-relaxed"
                />

                {/* Sample Prompt Chips */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">نماذج جاهزة للاختبار:</span>
                  {SAMPLE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(sample.text)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                    >
                      {sample.label}
                    </button>
                  ))}
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => { setRawText(''); setParsedItems([]); }}
                      className="text-xs text-slate-400 hover:text-slate-600 ml-auto"
                    >
                      مسح النص
                    </button>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  يقوم الذكاء الاصطناعي باستخراج الأسماء، الباركود، الأسعار، التعبئة، والكميات تلقائياً.
                </div>

                <button
                  type="button"
                  onClick={() => handleParseText(rawText)}
                  disabled={isParsing || !rawText.trim()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري التحليل الذكي...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      استخراج المنتجات الآن
                    </>
                  )}
                </button>
              </div>

              {/* Parsed Items Review Table */}
              {parsedItems.length > 0 && (
                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        تم استخراج ({parsedItems.length}) منتج
                      </span>
                      {parseSource === 'gemini' && (
                        <span className="text-[11px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Gemini 2.5 AI
                        </span>
                      )}
                      {parseSource === 'regex_parser' && (
                        <span className="text-[11px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                          Smart Algerian Parser
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      يمكنك تعديل أي قيمة مباشرة في الجدول قبل الحفظ
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100/90 text-slate-600 sticky top-0 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">اسم المنتج</th>
                          <th className="p-2.5">الباركود</th>
                          <th className="p-2.5">الفئة</th>
                          <th className="p-2.5">الوحدة</th>
                          <th className="p-2.5">سعر الشراء (دج)</th>
                          <th className="p-2.5">سعر البيع (دج)</th>
                          <th className="p-2.5">الكمية</th>
                          <th className="p-2.5 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parsedItems.map((item, idx) => {
                          const margin = item.salePrice - item.purchasePrice;
                          const marginPct = item.purchasePrice > 0 ? Math.round((margin / item.purchasePrice) * 100) : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateParsedItem(idx, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-800 font-medium focus:border-emerald-500"
                                />
                                {item.packaging && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">{item.packaging}</div>
                                )}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.barcode || ''}
                                  onChange={(e) => updateParsedItem(idx, 'barcode', e.target.value)}
                                  placeholder="تلقائي"
                                  className="w-28 px-2 py-1 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.category || 'مواد غذائية'}
                                  onChange={(e) => updateParsedItem(idx, 'category', e.target.value)}
                                  className="w-24 px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.unit || 'قطعة'}
                                  onChange={(e) => updateParsedItem(idx, 'unit', e.target.value)}
                                  className="w-16 px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.purchasePrice}
                                  onChange={(e) => updateParsedItem(idx, 'purchasePrice', Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-slate-200 rounded text-xs font-bold text-slate-800 focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={item.salePrice}
                                    onChange={(e) => updateParsedItem(idx, 'salePrice', Number(e.target.value))}
                                    className="w-20 px-2 py-1 border border-slate-200 rounded text-xs font-bold text-emerald-700 focus:border-emerald-500"
                                  />
                                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-mono">
                                    +{marginPct}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.stockQuantity}
                                  onChange={(e) => updateParsedItem(idx, 'stockQuantity', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeParsedItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="حذف من القائمة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setParsedItems(prev => [
                        ...prev,
                        {
                          name: 'منتج إضافي',
                          category: 'مواد غذائية عامة',
                          unit: 'قطعة',
                          purchasePrice: 100,
                          salePrice: 120,
                          stockQuantity: 10,
                          minStockAlert: 5
                        }
                      ])}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة سطر منتج فارغ
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveParsedItems}
                      disabled={isSaving}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري الحفظ في المخزون...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          حفظ جميع المنتجات ({parsedItems.length}) في المخزون
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VOICE INPUT */}
          {activeTab === 'voice' && (
            <div className="space-y-6 text-center py-4">
              {!voiceSupported ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  ميزة الإملاء الصوتي غير مدعومة مباشرة في هذا المتصفح. يمكنك استخدام خيار "تحليل النصوص والوصول الذكي" لكتابة أو لصق المنتجات.
                </div>
              ) : (
                <>
                  <div className="max-w-md mx-auto space-y-3">
                    <p className="text-sm text-slate-600 font-medium">
                      اضغط على زر الميكروفون وتحدث بحرية بالدارجة الجزائرية أو العربية. اذكر اسم السلعة، سعر الشراء والبيع والكمية:
                    </p>
                    <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500 text-right leading-relaxed font-mono">
                      مثال: "زيت إيليو 5 لتر 4 قارورات سعر الشراء 2450 وسعر البيع 2700 الكمية 30 كرتونة"
                    </div>
                  </div>

                  {/* Microphone Button */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isRecording 
                          ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </button>
                    <span className="text-sm font-semibold text-slate-700">
                      {isRecording ? 'جاري الاستماع إليك... اضغط للإيقاف' : 'اضغط للبدء في الإملاء الصوتي'}
                    </span>
                  </div>

                  {/* Live Transcript Display */}
                  {voiceTranscript && (
                    <div className="max-w-xl mx-auto text-right space-y-3">
                      <label className="text-xs font-bold text-slate-600">النص المنطوق المسجل:</label>
                      <div className="p-4 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium shadow-inner">
                        {voiceTranscript}
                      </div>

                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleParseText(voiceTranscript)}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          تحويل الصوت إلى منتجات بالمخزون
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceTranscript('')}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl"
                        >
                          مسح
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL SINGLE PRODUCT ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم السلعة / المنتج <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: حليب كونديا معقم 1 لتر"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Barcode with Algerian EAN generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-slate-500" />
                      الباركود (Code-barres)
                    </label>
                    <button
                      type="button"
                      onClick={generateAlgerianBarcode}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                    >
                      توليد باركود جزائري (613...)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={manualForm.barcode}
                    onChange={(e) => setManualForm(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="مثال: 613000100123"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرمز التعريفي (SKU / Référence)
                  </label>
                  <input
                    type="text"
                    value={manualForm.sku}
                    onChange={(e) => setManualForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="مثال: CND-1L-BLUE"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الفئة والتصنيف
                  </label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="مواد غذائية عامة">مواد غذائية عامة</option>
                    <option value="مشروبات وألبان">مشروبات وألبان</option>
                    <option value="منظفات ومواد تعقيم">منظفات ومواد تعقيم</option>
                    <option value="عناية وتجميل">عناية وتجميل (Cosmétique)</option>
                    <option value="خردوات ومواد بناء">خردوات ومواد بناء (Quincaillerie)</option>
                    <option value="إلكترونيات وهواتف">إلكترونيات وهواتف</option>
                    <option value="ملابس وأقمشة">ملابس وأقمشة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وحدة البيع
                  </label>
                  <select
                    value={manualForm.unit}
                    onChange={(e) => setManualForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="كرتونة">كرتونة (Carton)</option>
                    <option value="قطعة">قطعة (Pièce)</option>
                    <option value="علبة">علبة (Boite / Pack)</option>
                    <option value="حزمة">حزمة (Fardeau)</option>
                    <option value="كيلوغرام">كيلوغرام (Kg)</option>
                    <option value="لتر">لتر (Litre)</option>
                    <option value="متر">متر (Mètre)</option>
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر الشراء / التكلفة (دج)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={manualForm.purchasePrice || ''}
                    onChange={(e) => setManualForm(prev => ({ 
                      ...prev, 
                      purchasePrice: Number(e.target.value),
                      minSalePrice: prev.minSalePrice || Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر البيع الافتراضي (دج) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={manualForm.salePrice || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>

                {/* Live Margin Card */}
                {salePrice > 0 && purchasePrice > 0 && (
                  <div className="md:col-span-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900">هامش الربح المحسوب:</span>
                      <span className="text-emerald-700 font-bold text-sm font-mono">
                        +{profitMarginVal.toLocaleString('ar-DZ')} دج في الوحدة
                      </span>
                    </div>
                    {profitMarginPercent && (
                      <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full text-xs">
                        +{profitMarginPercent}%
                      </span>
                    )}
                  </div>
                )}

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية الابتدائية في المخزن
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.stockQuantity || 0}
                    onChange={(e) => setManualForm(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حد التنبيه عند نقص المخزون
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.minStockAlert || 5}
                    onChange={(e) => setManualForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Packaging */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات التعبئة والتغليف (Conditionnement)
                  </label>
                  <input
                    type="text"
                    value={manualForm.packaging}
                    onChange={(e) => setManualForm(prev => ({ ...prev, packaging: e.target.value }))}
                    placeholder="مثال: 12 علبة في الكرتون، أو حزمة 6 قارورات"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      إضافة المنتج للمخزون
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
