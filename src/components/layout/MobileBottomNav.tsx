import React from 'react';
import { 
  LayoutDashboard, Zap, Users, FileText, Menu 
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleMobileDrawer: () => void;
  todayActionsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileDrawer,
  todayActionsCount,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
      {/* Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors flex-1 ${
          activeTab === 'dashboard'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">الرئيسية</span>
      </button>

      {/* Priority Actions */}
      <button
        onClick={() => setActiveTab('priority')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors flex-1 relative ${
          activeTab === 'priority'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Zap className="w-5 h-5 mb-0.5" />
          {todayActionsCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {todayActionsCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">الأولويات</span>
      </button>

      {/* Customers */}
      <button
        onClick={() => setActiveTab('customers')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors flex-1 ${
          activeTab === 'customers'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">العملاء</span>
      </button>

      {/* Invoices */}
      <button
        onClick={() => setActiveTab('invoices')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors flex-1 ${
          activeTab === 'invoices'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FileText className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">الفواتير</span>
      </button>

      {/* More / Menu Drawer */}
      <button
        onClick={onToggleMobileDrawer}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex-1"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">القائمة</span>
      </button>
    </nav>
  );
};
