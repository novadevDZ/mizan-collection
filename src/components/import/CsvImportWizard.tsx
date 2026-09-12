import React, { useState } from 'react';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, 
  ArrowRight, Check, RefreshCw, FileText, Database 
} from 'lucide-react';
import { fetchJson } from '../../lib/apiClient';

interface CsvImportWizardProps {
  onSuccess: () => void;
}

export const CsvImportWizard: React.FC<CsvImportWizardProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedSuccessMsg, setImportedSuccessMsg] = useState<string | null>(null);

  // Pre-loaded Algerian distributor sample
  const sampleData = `الاسم,المحل,الهاتف,الولاية,الحد الائتماني,أجل السداد
حكيم بوجمعة,مكتبة النجاح,0661203040,البليدة,250000,30
سفيان بلحاج,ميني ماركت الأمل,0555987654,الجزائر العاصمة,400000,21
مصطفى قادري,مؤسسة قادري لمواد البناء,0770112233,سطيف,600000,45
رضوان تلمساني,تجهيزات الغرب,0540889900,وهران,350000,30
عمار لعماري,تغذية عامة السلام,0662334455,قسنطينة,180000,15`;

  const handleLoadSample = () => {
    setRawText(sampleData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setRawText(content);
    };
    reader.readAsText(file);
  };

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        const val = cols[idx] || '';
        if (h.includes('اسم') && !h.includes('محل')) rowObj.name = val;
        else if (h.includes('محل') || h.includes('شركة')) rowObj.companyName = val;
        else if (h.includes('هاتف')) rowObj.phone = val;
        else if (h.includes('ولاية')) rowObj.wilaya = val;
        else if (h.includes('حد') || h.includes('ائتمان')) rowObj.creditLimit = val;
        else if (h.includes('أجل') || h.includes('سداد')) rowObj.paymentTermsDays = val;
        else rowObj[h] = val;
      });
      rows.push(rowObj);
    }

    return rows;
  };

  const handleRunValidation = async () => {
    const rows = parseCsvText(rawText);
    if (rows.length === 0) {
      alert('يرجى لصق بيانات CSV صالحة أو تحميل العينة التجريبية');
      return;
    }

    try {
      setLoading(true);
      const res = await fetchJson('/api/import/customers', {
        method: 'POST',
        body: JSON.stringify({ rows, execute: false }),
      });
      setValidationResult(res);
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'فشل فحص البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    const rows = parseCsvText(rawText);
    try {
      setImporting(true);
      const res = await fetchJson<any>('/api/import/customers', {
        method: 'POST',
        body: JSON.stringify({ rows, execute: true }),
      });
      setImportedSuccessMsg(res.message);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'فشل استيراد البيانات');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">معالج استيراد بيانات العملاء (CSV / Excel)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              استورد قوائم زبائنك من ملفات الإكسل أو دفاتر الكريدي مع فحص وتدقيق أرقام الهواتف والازدواجية
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</span>
            <span>إدخال أو رفع الملف</span>
          </div>
          <div className="h-0.5 w-16 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</span>
            <span>المطابقة والتدقيق (Validation)</span>
          </div>
          <div className="h-0.5 w-16 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
            <span>اكتمال الاستيراد</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Upload or Paste */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">الصق محتوى CSV أو حمل ملفاً:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                تحميل عينة تجريبية (موزع جزائري)
              </button>
              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                اختيار ملف CSV
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <textarea
            rows={8}
            placeholder="الاسم,المحل,الهاتف,الولاية,الحد الائتماني,أجل السداد&#10;محمد بن سالم,سوبرماركت التوفيق,0550112233,الجزائر العاصمة,300000,30"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleRunValidation}
              disabled={loading || !rawText.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              فحص البيانات والتحقق من التكرار
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Validation Report & Confirm */}
      {step === 2 && validationResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
          <h3 className="font-extrabold text-slate-900 text-base">تقرير الفحص والتحقق الأولي (Dry-Run Audit):</h3>

          {/* KPI stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-emerald-700 font-bold block">سجلات صالحة للاستيراد</span>
              <span className="text-xl font-black text-emerald-800">{validationResult.validCount}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-amber-700 font-bold block">مكررة (مسجلة مسبقاً)</span>
              <span className="text-xl font-black text-amber-800">{validationResult.duplicateCount}</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-rose-700 font-bold block">سجلات غير صالحة / أخطاء</span>
              <span className="text-xl font-black text-rose-800">{validationResult.invalidCount}</span>
            </div>
          </div>

          {/* Sample of Valid Records */}
          {validationResult.validRows && validationResult.validRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <span className="font-bold text-slate-800 block mb-2">معاينة أولية للعملاء الصالحين:</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {validationResult.validRows.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
                    <span className="font-sans font-bold text-slate-800">{r.name} ({r.companyName || 'محل'})</span>
                    <span className="text-slate-500">{r.phone}</span>
                    <span className="text-slate-600 font-sans">{r.wilaya}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              رجوع وتعديل البيانات
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || validationResult.validCount === 0}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              تأكيد واستيراد {validationResult.validCount} عميل إلى قاعدة البيانات
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Completed */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">{importedSuccessMsg || 'تم الاستيراد بنجاح!'}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            تم تسجيل العملاء وتعيين حدودهم الائتمانية واحتساب أرصدتهم في قاعدة بيانات المؤسسة بنجاح.
          </p>
          <div className="pt-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              استيراد دفعة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
