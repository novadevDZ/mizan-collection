import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, CheckCircle2, ArrowLeft, 
  MessageCircle, TrendingUp, AlertOctagon, Sparkles, 
  Building2, Users, FileText, Banknote, Clock, UserPlus,
  Phone, HelpCircle, ChevronDown, ChevronUp, Calculator,
  Send, Check, ArrowRight, Shield, Award, Play
} from 'lucide-react';
import { formatDZD } from '../../lib/algeriaData';

interface AlgerianLandingPageProps {
  onEnterApp: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  isAuthenticated?: boolean;
}

export const AlgerianLandingPage: React.FC<AlgerianLandingPageProps> = ({ 
  onEnterApp, 
  onLogin,
  onRegister,
  isAuthenticated = false
}) => {
  // Calculator state
  const [outstandingCredit, setOutstandingCredit] = useState<number>(3500000); // 3.5 Million DZD default
  
  // Interactive Preview State
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'priority' | 'statement'>('whatsapp');
  const [messageTone, setMessageTone] = useState<'friendly' | 'firm' | 'urgent'>('friendly');

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculate ROI
  const estimatedRecovery = Math.round(outstandingCredit * 0.72); // 72% recovery rate in 30 days
  const averageDaysSaved = 34; // Reduced DSO by 34 days

  const tonesContent = {
    friendly: {
      label: 'ودية وتذكيرية',
      tag: 'تأخر 1-15 يوم',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      message: `السلام عليكم ورحمة الله أخي كريم،\nمعك مؤسسة التوزيع السريع. نرجو أن تكون بخير وفي أحسن حال.\nنود تذكيركم بمحبة بحلول أجل الفاتورة رقم FA-2024-118 بقيمة ${formatDZD(420000)}.\nيمكنكم التسديد بكل سهولة عبر حسابنا في بريدي موب (BaridiMob) أو صك بنكي.\nشاكرين لكم حسن التعاون الدائم والثقة المتبادلة 🤝.`
    },
    firm: {
      label: 'مهنية حازمة',
      tag: 'تأخر 16-45 يوم',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      message: `تحية طيبة سيدي،\nنلفت عنايتكم الكريمة إلى أن الرصيد المستحق بذمتكم والبالغ ${formatDZD(850000)} قد تجاوز فترة السماح المتفق عليها بـ 28 يوماً.\nللحفاظ على استمرارية التموين بالسلع وفتح الطلبيات القادمة، نرجو تسوية المبلغ أو تأكيد موعد سداد محدد هذا الأسبوع.\nمعلومات الحساب الجاري CCP متوفرة لديكم أو عبر بريدي موب.\nتقبلوا فائق التقدير والاحترافية.`
    },
    urgent: {
      label: 'رسمية مع إشعار بالتقاضي',
      tag: 'تأخر +46 يوم أو نقض وعد',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      message: `إشعار رسمي بالتسوية العاجلة،\nإلى مسير المؤسسة التجارية: بعد انقضاء وعد السداد الأخير دون تسوية، نحيطكم علماً بأن الملف المالي المتعلق بالفواتير غير المسددة بقيمة ${formatDZD(1420000)} قد أحيل لقسم المنازعات والشؤون القانونية.\nنمنحكم مهلة 48 ساعة كفرصة أخيرة للتسوية الودية قبل الشروع في الإجراءات القضائية وتعليق كافة المعاملات التجارية.`
    }
  };

  const faqs = [
    {
      q: 'هل يدعم نظام ميزان كافة الولايات الـ 58 في الجزائر؟',
      a: 'نعم، المنظومة مهيأة خصيصاً للسوق الجزائري وتدعم كل الولايات من الجزائر ووهران وقسنطينة وسطيف إلى ورقلة وتمنراست، مع تصنيف جغرافي دقيق لشبكات التوزيع والزبائن.'
    },
    {
      q: 'هل يمكنني استيراد بيانات زبائني الحالية من ملفات Excel؟',
      a: 'بكل تأكيد. يحتوي ميزان على معالج استيراد ذكي وفوري لملفات Excel و CSV. يمكنك نسخ ولصق أعمدة الأسماء، الهواتف، المبالغ المستحقة والتواريخ ليقوم النظام بتوليد كشوفات الحساب فوراً.'
    },
    {
      q: 'كيف تساعد أدوات الذكاء الاصطناعي في التحصيل دون إحراج الزبون؟',
      a: 'يقوم الذكاء الاصطناعي المدمج بتحليل تاريخ الزبون وسلوكه المالي وصياغة رسائل واتساب ورسائل نصية مخصصة باللغة العربية أو الدارجة الجزائرية المهنية، مع توفير نبرات متعددة (ودية، تذكيرية، حازمة، رسمية) تتضمن تفاصيل الدفع بـ BaridiMob أو CCP.'
    },
    {
      q: 'ما مدى أمان وعزلة بيانات مؤسستي المالية؟',
      a: 'نولي أمان البيانات الأولوية القصوى. كل مؤسسة تحصل على قاعدة بيانات معزولة ومحمية عبر تشفير سحابي متعدد الطبقات وقواعد أمان Firestore، ولا يمكن لأي طرف ثالث أو شركة أخرى الاطلاع على زبائنك أو مبيعاتك.'
    },
    {
      q: 'ما هي طرق الدفع المتاحة لتفعيل الاشتراك؟',
      a: 'نوفر الدفع بالدينار الجزائري (DZD) عبر الوسائل الأكثر شيوعاً في الجزائر: تحويل بريدي موب (BaridiMob)، حساب بريدي جاري (CCP)، أو صك/تحويل بنكي رسمي مع فاتورة معتمدة لمؤسستكم.'
    }
  ];

  const handleStartRegister = () => {
    if (onRegister) {
      onRegister();
    } else {
      onEnterApp();
    }
  };

  const handleStartLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      onEnterApp();
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Algerian Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white text-xs py-2.5 px-4 text-center font-bold shadow-xs flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        <span>🇩🇿 مصمم خصيصاً للموزعين، تجار الجملة والشركات في الجزائر • يدعم 58 ولاية • الدينار الجزائري (DZD) • بريدي موب و CCP</span>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
              م
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-white tracking-tight">MIZAN</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/50">
                  تحصيل
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">منظومة استرجاع الديون وإدارة المقبوضات التجارية</p>
            </div>
          </div>

          {/* Quick Nav Anchor Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">المميزات</a>
            <a href="#preview" className="hover:text-emerald-400 transition-colors">معاينة النظام</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">حاسبة الاسترجاع</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">آلية العمل</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">الأسعار</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">الأسئلة الشائعة</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                id="landing-btn-dashboard"
                onClick={onEnterApp}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>العودة إلى لوحة التحكم</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  id="landing-btn-login"
                  onClick={handleStartLogin}
                  className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors cursor-pointer"
                >
                  تسجيل الدخول
                </button>
                
                <button
                  id="landing-btn-register"
                  onClick={handleStartRegister}
                  className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ابدأ مجاناً</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام التحصيل المالي الذكي الأول للشركات الجزائرية</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight">
            أموالك ليست عند زبائنك.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              أموالك يجب أن تعود لخزينتك.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            منظومة متكاملة للتجار وموزعي الجملة في الجزائر لمتابعة فواتير الكريدي، كشف الحساب الفوري، وفرز أولويات التحصيل اليومية مع أدوات ذكاء اصطناعي تفاوضية تساعدك على استرجاع مستحقاتك بكل احترافية ودون خسارة الزبائن.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              id="hero-btn-start-free"
              onClick={handleStartRegister}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base rounded-xl transition-all shadow-xl shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5 fill-current" />
              <span>تسجيل منشأة جديدة وبدء الاستخدام</span>
            </button>

            <button
              id="hero-btn-login-direct"
              onClick={handleStartLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-sm sm:text-base rounded-xl transition-all border border-slate-700 hover:border-slate-600 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>دخول لوحة التحكم (Login)</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>عزل بيانات آمن 100%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>حسابات دقيقة بالدينار الجزائري</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>استيراد فوري من Excel / CSV</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>دعم بريدي موب والـ CCP</span>
            </span>
          </div>

          {/* Algerian Market Metrics Summary */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-right">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">72%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">نسبة الديون المسترجعة</div>
              <div className="text-[11px] text-slate-400">خلال أول 30 يوماً من المتابعة</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">-34 يوم</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">تقليص فترة التحصيل (DSO)</div>
              <div className="text-[11px] text-slate-400">تسريع دورة السيولة النقدية</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">58</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">ولاية جزائرية مغطاة</div>
              <div className="text-[11px] text-slate-400">شبكات التوزيع وتجار الجملة</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">0 دج</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">رسائل ضائعة أو محرجة</div>
              <div className="text-[11px] text-slate-400">صياغة ذكية بالذكاء الاصطناعي</div>
            </div>
          </div>
        </div>
      </header>

      {/* INTERACTIVE SHOWCASE PREVIEW */}
      <section id="preview" className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>معاينة حية ومباشرة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            شاهد كيف يحول ميزان فوضى الديون إلى تدفقات نقدية منتظمة
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            استكشف الأدوات اليومية المصممة بعناية لمساعدة مسؤول التحصيل والموزع الجزائري على تحصيل أمواله بأعلى سرعة ولباقة.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-2 max-w-md w-full">
            <button
              onClick={() => setPreviewTab('whatsapp')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === 'whatsapp'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>رسائل الذكاء الاصطناعي</span>
            </button>
            <button
              onClick={() => setPreviewTab('priority')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === 'priority'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>أولويات التحصيل اليومية</span>
            </button>
            <button
              onClick={() => setPreviewTab('statement')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === 'statement'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>كشف الحساب 360°</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Box */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-8 shadow-2xl">
          {previewTab === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4 text-right">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">توليد رسائل تفاوضية فورية</h3>
                    <p className="text-xs text-slate-400">اختر نبرة المتابعة المناسبة لوضعية الزبون</p>
                  </div>
                </div>

                {/* Tone Selectors */}
                <div className="space-y-2 pt-2">
                  {(['friendly', 'firm', 'urgent'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMessageTone(t)}
                      className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        messageTone === t
                          ? 'bg-slate-800/90 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{tonesContent[t].label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{tonesContent[t].tag}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tonesContent[t].badgeClass}`}>
                        {messageTone === t ? 'معاينة نشطة' : 'اختر'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توليد رابط واتساب مباشر بنقرة واحدة (One-Click WhatsApp)</span>
                </div>
              </div>

              {/* Simulated Phone Message Mockup */}
              <div className="lg:col-span-7">
                <div className="max-w-md mx-auto bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                  {/* Mock WhatsApp Header */}
                  <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs">
                        ك
                      </div>
                      <div>
                        <div className="text-xs font-bold">كريم بلمختار (محل تجزئة وهران)</div>
                        <div className="text-[10px] text-emerald-200">متصل الآن عبر واتساب</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100 font-mono">
                      +213 550 12 34 56
                    </span>
                  </div>

                  {/* Message Body */}
                  <div className="p-4 bg-slate-950/90 min-h-[220px] flex flex-col justify-between">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                      {tonesContent[messageTone].message}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Send className="w-3.5 h-3.5" /> جاهزة للإرسال
                      </span>
                      <span>تضمين حساب BaridiMob تلقائياً</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === 'priority' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">ويدجت "يحتاج متابعة اليوم" (Daily Priorities)</h3>
                  <p className="text-xs text-slate-400">ترتيب آلي حسب خطورة التأخير، المبالغ الكبيرة، ووعود السداد المنقوضة</p>
                </div>
                <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg font-bold">
                  3 إجراءات عاجلة اليوم
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                      !
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>مؤسسة النور لمواد التغليف (سطيف)</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                          وعد سداد منقوض
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        وعد بالسداد بتاريخ أمس بمبلغ 620,000 دج • هاتف: 0661 22 33 44
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono font-bold text-sm text-rose-400">{formatDZD(620000)}</span>
                    <button 
                      onClick={handleStartRegister}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      متابعة الآن
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      ⏱
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>سوبرماركت البركة (الجزائر العاصمة)</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          تأخر 35 يوماً
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        الفاتورة FA-2024-89 • تجاوز حد الائتمان المتفق عليه
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono font-bold text-sm text-amber-400">{formatDZD(430000)}</span>
                    <button 
                      onClick={handleStartRegister}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      إرسال تذكير
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === 'statement' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">كشف الحساب المحاسبي للعميل (Customer 360)</h3>
                  <p className="text-xs text-slate-400">سجل متزامن للفواتير، سندات التسليم، المقبوضات، والرصيد الصافي المتبقي</p>
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
                  رصيد صافي مؤكد
                </span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النوع / المرجع</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">مدين (فاتورة)</th>
                      <th className="p-3">دائن (دفعة)</th>
                      <th className="p-3">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="text-slate-300">
                      <td className="p-3">2026-08-01</td>
                      <td className="p-3 font-bold text-white">FA-2024-001</td>
                      <td className="p-3 font-sans">توريد بضاعة غذائية بالجملة</td>
                      <td className="p-3 text-rose-400">{formatDZD(950000)}</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 font-bold text-rose-400">{formatDZD(950000)}</td>
                    </tr>
                    <tr className="text-slate-300">
                      <td className="p-3">2026-08-15</td>
                      <td className="p-3 text-emerald-400">PAY-BaridiMob</td>
                      <td className="p-3 font-sans">دفعة جزئية عبر بريدي موب</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 text-emerald-400">{formatDZD(500000)}</td>
                      <td className="p-3 font-bold text-amber-400">{formatDZD(450000)}</td>
                    </tr>
                    <tr className="text-slate-300 bg-emerald-950/20">
                      <td className="p-3">2026-09-01</td>
                      <td className="p-3 text-cyan-400">CHQ-009182</td>
                      <td className="p-3 font-sans">تسوية صك بنكي BNA</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 text-emerald-400">{formatDZD(450000)}</td>
                      <td className="p-3 font-bold text-emerald-400">0 دج (تمت التسوية)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROI CALCULATOR SECTION */}
      <section id="calculator" className="py-16 sm:py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>حاسبة العائد الاستثماري (ROI Calculator)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              احسب كم من الأموال العالقة ستسترجعها مؤسستك
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              حرك المؤشر لتحديد حجم ديون الكريدي المتأخرة الحالية وشاهد الأثر المالي الفوري
            </p>
          </div>

          <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl max-w-3xl mx-auto space-y-6">
            {/* Slider Control */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-2">
                <span className="text-slate-300">إجمالي ديون الكريدي العالقة لدى الزبائن:</span>
                <span className="font-mono text-base sm:text-xl text-emerald-400 font-black">
                  {formatDZD(outstandingCredit)}
                </span>
              </div>
              <input
                type="range"
                min="500000"
                max="25000000"
                step="250000"
                value={outstandingCredit}
                onChange={(e) => setOutstandingCredit(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>500,000 دج (50 مليون سنتيم)</span>
                <span>25,000,000 دج (2.5 مليار سنتيم)</span>
              </div>
            </div>

            {/* Calculated Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-right">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">سيولة متوقع استرجاعها (30 يوم):</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                  {formatDZD(estimatedRecovery)}
                </div>
                <div className="text-[10px] text-emerald-500/90 font-semibold mt-1">
                  معدل استرجاع 72%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">تسريع دورة تحصيل الكريدي:</div>
                <div className="text-xl sm:text-2xl font-black text-teal-400 font-mono mt-1">
                  {averageDaysSaved} يوماً
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  حماية من نزيف السيولة
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">تكلفة ميزان من المبلغ المسترجع:</div>
                <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono mt-1">
                  أقل من 0.3%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  عائد استثماري يتجاوز 50 ضعفاً
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleStartRegister}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                استرجع هذه المبالغ الآن وابدأ فوراً
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS SECTION (واقع التاجر والموزع الجزائري) */}
      <section id="features" className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 text-xs font-bold mb-3">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>المشاكل الشائعة في السوق</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            لماذا تضيع أموال الموزعين وتجار الجملة في الجزائر؟
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            البيع بالكريدي هو شريان التجارة في السوق الجزائري، لكن إدارته التقليدية تتسبب في نزيف السيولة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">دفاتر الكريدي الضائعة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              التسجيل في كناش أو دفاتر ورقية يتلف مع الوقت، ويسهل إنكار الديون أو نسيان الحسابات بين الموزع والزبون.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">نسيان من تأخر عن الأجل</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              مع وجود مئات الزبائن، يمر شهر وشهران دون أن تنتبه للمبالغ الضخمة التي تجاوزت أجل السداد المتفق عليه.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">الحرج في المطالبة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتحرج التاجر من الاتصال بزبائنه خوفاً من توتر العلاقة الشخصية. ميزان يوفر نبرة ذكية ومحترفة تحافظ على العلاقة.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">وعود السداد المنقوضة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              "سأدفع الخميس"، "الأسبوع القادم سأرسل الحوالة"... ثم يمر الموعد دون متابعة. ميزان ينبهك فور نقض أي وعد.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">آلية عمل ميزان</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">كيف تسترجع أموالك في 3 خطوات بسيطة؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center mb-4 shadow-md">
                1
              </div>
              <h3 className="font-black text-white text-base sm:text-lg mb-2">استورد زبائنك وفواتيرك</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ارفع ملف الإكسل أو الصق بيانات زبائنك. يقوم ميزان بتدقيق أرقام الهواتف وإنشاء كشف حساب محاسبي لكل زبون تلقائياً.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center mb-4 shadow-md">
                2
              </div>
              <h3 className="font-black text-white text-base sm:text-lg mb-2">شاهد ويدجت "يحتاج متابعة اليوم"</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                كل صباح، يعرض لك ميزان قائمة بالزبائن الأكثر خطورة وتأخراً، مع ترتيب ذكي للأولويات وتنبيه لوعود السداد المنقوضة.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center mb-4 shadow-md">
                3
              </div>
              <h3 className="font-black text-white text-base sm:text-lg mb-2">أرسل رسائل ذكية وسجّل المقبوضات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                بنقرة واحدة، ولد رسائل واتساب مهنية محترمة بالذكاء الاصطناعي مع وسائل الدفع الجزائرية (بريدي موب، CCP، شيك)، وسجل المقبوضات فوراً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION (DZD) */}
      <section id="pricing" className="bg-slate-950 py-16 sm:py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white">خطط اشتراك واضحة بالدينار الجزائري</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">استثمر جزءاً بسيطاً من ديونك المسترجعة لضمان سيولة دائمة لمؤسستك</p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            {/* Starter */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white text-base">البداية (Starter)</span>
                <div className="mt-3 text-2xl font-black text-white">
                  4,500 <span className="text-xs text-slate-400 font-sans">دج / شهرياً</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">للتجار الصغار ومحلات التجزئة</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">✓ حتى 100 عميل تجاري</div>
                  <div className="flex items-center gap-2">✓ كشف حساب محاسبي كامل</div>
                  <div className="flex items-center gap-2">✓ رسائل تذكير واتساب</div>
                  <div className="flex items-center gap-2">✓ مستخدم واحد</div>
                </div>
              </div>
              <button
                onClick={handleStartRegister}
                className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                اختر الخطة وابدأ
              </button>
            </div>

            {/* Pro - Recommended */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-2xl border-2 border-emerald-500 relative flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                الأكثر طلباً للموزعين
              </div>
              <div>
                <span className="font-bold text-white text-base">الموزع المحترف (Pro)</span>
                <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">
                  9,800 <span className="text-xs text-slate-300 font-sans">دج / شهرياً</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">لتجار الجملة وموزعي السلع والشركات</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">✓ عملاء غير محدودين</div>
                  <div className="flex items-center gap-2">✓ ويدجت "يحتاج متابعة اليوم"</div>
                  <div className="flex items-center gap-2">✓ توليد رسائل بالذكاء الاصطناعي</div>
                  <div className="flex items-center gap-2">✓ تتبع وعود الدفع المنقوضة</div>
                  <div className="flex items-center gap-2">✓ تقارير الأعمار (Aging Schedule)</div>
                  <div className="flex items-center gap-2">✓ حتى 5 مستخدمين ومحصلين</div>
                </div>
              </div>
              <button
                onClick={handleStartRegister}
                className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                ابدأ الاستخدام الآن
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white text-base">الشركات الكبرى (Enterprise)</span>
                <div className="mt-3 text-2xl font-black text-white">
                  24,000 <span className="text-xs text-slate-400 font-sans">دج / شهرياً</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">لكبار الموزعين وشبكات التوزيع الوطنية</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">✓ كل مزايا Pro غير محدودة</div>
                  <div className="flex items-center gap-2">✓ ربط مخصص مع أنظمة الفوترة والـ ERP</div>
                  <div className="flex items-center gap-2">✓ تتبع محصلين ميدانيين بعدة ولايات</div>
                  <div className="flex items-center gap-2">✓ مدير حساب ودعم هاتفي مخصص</div>
                </div>
              </div>
              <button
                onClick={handleStartRegister}
                className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                تواصل معنا للتفعيل
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>إجابات واضحة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">الأسئلة الشائعة</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-right font-bold text-sm text-white flex items-center justify-between gap-3 cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-14 sm:py-16 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-t border-slate-800 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            جاهز لحماية أموالك واسترجاع مستحقاتك في الجزائر؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            انضم إلى التجار والموزعين الذين أوقفوا نزيف الديون واسترجعوا سيولتهم مع نظام ميزان.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStartRegister}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              إنشاء حساب منشأة جديد مجاناً
            </button>
            <button
              onClick={handleStartLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-700 cursor-pointer"
            >
              تسجيل الدخول للمنصة
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">MIZAN COLLECTION</span>
            <span>•</span>
            <span>منظومة تحصيل الديون التجارية في الجزائر</span>
          </div>
          <p>© 2026 ميزان. جميع الحقوق محفوظة للجمهورية الجزائرية الديمقراطية الشعبية.</p>
        </div>
      </footer>
    </div>
  );
};
