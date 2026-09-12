import React from 'react';
import { 
  LayoutDashboard, Users, FileText, Banknote, 
  PhoneCall, CheckSquare, BarChart3, UploadCloud, 
  Settings, ExternalLink, ShieldCheck, Zap, LogOut, X, Package
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'priority'
  | 'customers'
  | 'products'
  | 'invoices'
  | 'payments'
  | 'tasks'
  | 'reports'
  | 'import'
  | 'settings'
  | 'super_admin'
  | 'landing';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayActionsCount: number;
  brokenPromisesCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  currentUser?: { email?: string; role?: string; isSuperAdmin?: boolean };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayActionsCount,
  brokenPromisesCount,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
  currentUser,
}) => {
  const isSuperAdminUser = 
    Boolean(currentUser?.isSuperAdmin) || 
    currentUser?.role === 'super_admin' || 
    currentUser?.email?.toLowerCase().includes('nova.bakhti') ||
    currentUser?.email?.toLowerCase() === 'nova.bakhti@gmail.com';
  const menuItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'priority',
      label: 'أولويات التحصيل',
      icon: Zap,
      badge: todayActionsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'customers',
      label: 'العملاء وكشف الحساب',
      icon: Users,
    },
    {
      id: 'products',
      label: 'المنتجات والمخزون',
      icon: Package,
    },
    {
      id: 'invoices',
      label: 'فواتير البيع بالدين',
      icon: FileText,
    },
    {
      id: 'payments',
      label: 'سجل المدفوعات',
      icon: Banknote,
    },
    {
      id: 'tasks',
      label: 'مهام التحصيل اليومية',
      icon: CheckSquare,
      badge: brokenPromisesCount > 0 ? brokenPromisesCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'reports',
      label: 'تقارير الأعمار (Aging)',
      icon: BarChart3,
    },
    {
      id: 'import',
      label: 'استيراد CSV / Excel',
      icon: UploadCloud,
    },
    {
      id: 'settings',
      label: 'الإعدادات وسجل التدقيق',
      icon: Settings,
    },
    ...(isSuperAdminUser ? [
      {
        id: 'super_admin' as ActiveTab,
        label: 'الإدارة المركزية (Super Admin)',
        icon: ShieldCheck,
        badgeColor: 'bg-amber-400 text-slate-950 font-black',
      }
    ] : []),
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          w-72 sm:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-l border-slate-800 select-none z-50
          transition-transform duration-200 ease-in-out
          fixed inset-y-0 right-0 lg:static lg:translate-x-0
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-900/40">
              م
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight flex items-center gap-1.5">
                MIZAN
                <span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                  تحصيل
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">استرجع أموالك بذكاء</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            نظام التحصيل المالي
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Public Landing Switcher & Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <button
            id="btn-switch-landing"
            onClick={() => handleSelectTab('landing')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              الصفحة التعريفية (Landing)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">الجزائر</span>
          </button>

          {/* Logout Button in Sidebar */}
          {onLogout && (
            <button
              id="sidebar-btn-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/20 hover:bg-rose-900/40 rounded-lg transition-colors border border-rose-900/40 cursor-pointer font-medium"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                تسجيل الخروج
              </span>
              <span className="text-[10px] text-rose-400/80">إنهاء الجلسة</span>
            </button>
          )}

          <div className="pt-1 px-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              عزل بيانات المؤسسة نشط
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">DZD</span>
          </div>
        </div>
      </aside>
    </>
  );
};
