import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { fetchJson, setApiAdminToken } from '../../lib/apiClient';

interface SuperAdminGuardProps {
  currentUser: User | null;
  children: React.ReactNode;
  onNavigateHome: () => void;
  onAuthenticated?: (user: User) => void;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({
  currentUser,
  children,
  onNavigateHome,
  onAuthenticated,
}) => {
  const [showAuthBox, setShowAuthBox] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@mizan.dz');
  const [secretKey, setSecretKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const cleanUserEmail = (currentUser?.email || '').toLowerCase().trim();
  const isRecognizedAdminEmail = 
    cleanUserEmail === 'nova.bakhti@gmail.com' ||
    cleanUserEmail === 'admin@mizan.dz' ||
    cleanUserEmail === 'admin@mizancollection.dz';

  const isSuperAdmin = 
    Boolean(currentUser?.isSuperAdmin) ||
    currentUser?.role === 'super_admin' ||
    isRecognizedAdminEmail;

  const handleVerifyMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !secretKey.trim()) return;

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetchJson<{
        success: boolean;
        token: string;
        user: User;
      }>('/api/auth/super-admin-login', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail, secretKey }),
      });

      if (res.token) {
        setApiAdminToken(res.token);
        localStorage.setItem('mizan_current_user', JSON.stringify(res.user));
        if (onAuthenticated) {
          onAuthenticated(res.user);
        } else {
          window.location.reload();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'فشل التحقق الأمني من مفتاح المشرف العام');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!currentUser || !isSuperAdmin) {
    return (
      <div 
        dir="rtl" 
        className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>مسار مشفر ومحمي بروتوكولياً (Master Gateway)</span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            بوابة الإدارة المركزية الفائقة للمنصة
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            هذه الشاشة مخصصة حصرياً للمشرف العام على منظومة ميزان (Platform Super Administrator)، وتتطلب التحقق الأمني عبر مفتاح الأمان السري المشفر.
          </p>

          {showAuthBox ? (
            <form onSubmit={handleVerifyMaster} className="mt-4 p-5 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-3">
              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold">
                  {authError}
                </div>
              )}

              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">البريد الإلكتروني المعتمد للمشرف:</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mizan.dz"
                  dir="ltr"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">مفتاح الأمان السري (Master Passkey / PIN):</label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="••••••••••••"
                  dir="ltr"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono tracking-widest focus:outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التحقق الأمني...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>تأكيد الهوية وفتح اللوحة</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthBox(false)}
                  className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowAuthBox(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
              >
                <KeyRound className="w-4 h-4" />
                <span>إدخال مفتاح الأمان السري</span>
              </button>
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span>العودة إلى لوحة تحكم المؤسسة</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
