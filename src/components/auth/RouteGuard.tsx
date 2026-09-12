import React from 'react';
import { ShieldCheck, Lock, ShieldAlert } from 'lucide-react';

interface RouteGuardProps {
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * RouteGuard Component
 * Enforces Firebase Auth session protection on all protected routes and financial data.
 * Blocks unauthenticated users and prevents any unauthorized layout or data flash.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  isAuthenticated,
  isAuthChecking,
  children,
  fallback,
}) => {
  if (isAuthChecking && !isAuthenticated) {
    return (
      <div 
        dir="rtl" 
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-slate-950 flex items-center justify-center shadow">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="max-w-md space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Firebase Auth • فحص صلاحيات المسار</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            جاري التحقق من أمان الجلسة وهوية المستخدم...
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            نظام حماية المسارات (Route Guard) نشط لمنع أي وصول غير مصرح به إلى بيانات ديون المؤسسة ولوحة التحكم.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
