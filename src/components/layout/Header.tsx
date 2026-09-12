import React from 'react';
import { 
  Search, Plus, Banknote, RefreshCw, Zap, Building2, 
  Menu, LogOut, ShieldCheck 
} from 'lucide-react';
import { Organization, User } from '../../types';

interface HeaderProps {
  organization: Organization;
  currentUser: User;
  onOpenPaymentModal: () => void;
  onOpenInvoiceModal: () => void;
  onOpenCustomerModal: () => void;
  onStartCollection: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit?: () => void;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  organization,
  currentUser,
  onOpenPaymentModal,
  onOpenInvoiceModal,
  onOpenCustomerModal,
  onStartCollection,
  onResetDemo,
  isResetting,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onToggleMobileMenu,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Menu Button & Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          {/* Mobile hamburger menu toggle */}
          {onToggleMobileMenu && (
            <button
              id="btn-mobile-menu-toggle"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
              title="فتح القائمة الرئيسية"
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              placeholder="بحث بالاسم، الهاتف، الفاتورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSubmit) onSearchSubmit();
              }}
              className="w-full pr-9 pl-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
            />
          </div>

          {/* Org & Wilaya Tag & Firebase Auth Badge (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-lg border border-slate-200/60 text-xs text-slate-700 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">{organization.name}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{organization.wilaya}</span>
            <span className="text-slate-400">|</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-xs" title="جلسة موثقة وآمنة عبر Firebase Auth">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Auth</span>
            </span>
          </div>
        </div>

        {/* Right Side: Action Buttons & Profile & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* CTA: "ابدأ التحصيل" */}
          <button
            id="btn-start-collection"
            onClick={onStartCollection}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer shrink-0"
            title="ترتيب أولويات التحصيل العاجلة لليوم"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-emerald-200" />
            <span className="hidden xs:inline sm:inline">ابدأ التحصيل</span>
            <span className="xs:hidden">تحصيل</span>
          </button>

          {/* Register Payment */}
          <button
            id="btn-quick-payment"
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-xs sm:text-sm rounded-lg transition-colors cursor-pointer shrink-0"
            title="تسجيل دفعة نقدية، CCP، بريدي موب، أو شيك"
          >
            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">تسجيل دفعة</span>
          </button>

          {/* New Invoice */}
          <button
            id="btn-quick-invoice"
            onClick={onOpenInvoiceModal}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs sm:text-sm rounded-lg transition-colors cursor-pointer shrink-0"
            title="إصدار فاتورة بيع بالدين"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">فاتورة جديدة</span>
          </button>

          {/* Refresh Data Button */}
          <button
            id="btn-refresh-data"
            onClick={onResetDemo}
            disabled={isResetting}
            title="تحديث البيانات واسترجاع آخر الحركات"
            className="hidden sm:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isResetting ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* User Badge & Info */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2 border-r border-slate-200 shrink-0">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-600 font-semibold">
                {currentUser.role === 'owner' ? 'المالك' : currentUser.role === 'manager' ? 'مدير' : 'محصل'}
              </div>
            </div>
          </div>

          {/* Dedicated Logout Button (زر تسجيل الخروج) */}
          {onLogout && (
            <button
              id="header-btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="تسجيل الخروج من الجلسة"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
