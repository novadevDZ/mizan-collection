import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LoginView } from './components/auth/LoginView';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { GoldenFollowUpWidget } from './components/dashboard/GoldenFollowUpWidget';
import { AgingChart } from './components/dashboard/AgingChart';
import { CollectionPriorityView } from './components/collections/CollectionPriorityView';
import { CustomerList } from './components/customers/CustomerList';
import { Customer360Modal } from './components/customers/Customer360Modal';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { InvoiceList } from './components/invoices/InvoiceList';
import { CreateInvoiceModal } from './components/invoices/CreateInvoiceModal';
import { PaymentList } from './components/payments/PaymentList';
import { RegisterPaymentModal } from './components/payments/RegisterPaymentModal';
import { CollectionTaskView } from './components/tasks/CollectionTaskView';
import { AgingReportView } from './components/reports/AgingReportView';
import { CsvImportWizard } from './components/import/CsvImportWizard';
import { SettingsView } from './components/settings/SettingsView';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { SuperAdminGuard } from './components/auth/SuperAdminGuard';
import { AlgerianLandingPage } from './components/landing/AlgerianLandingPage';
import { LogAttemptModal } from './components/collections/LogAttemptModal';
import { PromiseToPayModal } from './components/collections/PromiseToPayModal';
import { AiMessageModal } from './components/collections/AiMessageModal';
import { ProductManagementView } from './components/products/ProductManagementView';
import { 
  DashboardStats, TodayActionItem, Customer, Invoice, 
  Payment, CollectionTask, Organization, User, Product 
} from './types';
import { fetchJson, setApiOrganizationId } from './lib/apiClient';
import { formatDZD } from './lib/algeriaData';
import { 
  subscribeToAuthState, 
  logoutFromFirestore, 
  getUserProfileFromFirestore,
  fetchCustomersFromFirestore,
  fetchInvoicesFromFirestore,
  fetchPaymentsFromFirestore,
  fetchTasksFromFirestore,
  fetchProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToCustomers,
  subscribeToInvoices,
  subscribeToPayments,
  subscribeToProducts
} from './lib/firestoreService';
import { RouteGuard } from './components/auth/RouteGuard';
import { AlertTriangle, Clock, RefreshCw, Zap, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mizan_auth_session') === 'true';
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    return localStorage.getItem('mizan_auth_session') === 'true';
  });
  const [routeGuardMessage, setRouteGuardMessage] = useState<string | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return localStorage.getItem('mizan_auth_session') === 'true' ? 'dashboard' : 'landing';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Domain State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayActions, setTodayActions] = useState<TodayActionItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organization, setOrganization] = useState<Organization>(() => {
    try {
      const saved = localStorage.getItem('mizan_current_org');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: '',
      name: '',
      legalName: '',
      businessType: '',
      currency: 'DZD',
      plan: 'starter',
      createdAt: new Date().toISOString().split('T')[0],
    };
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('mizan_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: '',
      organizationId: '',
      name: '',
      email: '',
      role: 'owner',
    };
  });

  // Firebase Auth Route Guard: Listen to real auth state changes once on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let profile = await getUserProfileFromFirestore(firebaseUser.uid, firebaseUser.email);
          if (!profile) {
            // Give a short delay in case Firestore write is completing
            await new Promise(r => setTimeout(r, 400));
            profile = await getUserProfileFromFirestore(firebaseUser.uid, firebaseUser.email);
          }

          if (profile) {
            setCurrentUser(profile.user);
            setOrganization(profile.organization);
            setApiOrganizationId(profile.organization.id);
            localStorage.setItem('mizan_current_user', JSON.stringify(profile.user));
            localStorage.setItem('mizan_current_org', JSON.stringify(profile.organization));
          } else {
            // Check if localStorage has matching user
            const savedUser = localStorage.getItem('mizan_current_user');
            const savedOrg = localStorage.getItem('mizan_current_org');
            if (savedUser && savedOrg) {
              const parsedU = JSON.parse(savedUser);
              const parsedO = JSON.parse(savedOrg);
              if (parsedU.id === firebaseUser.uid || parsedU.email?.toLowerCase() === firebaseUser.email?.toLowerCase()) {
                setCurrentUser(parsedU);
                setOrganization(parsedO);
                setApiOrganizationId(parsedO.id);
              } else {
                const newOrgId = `org-${firebaseUser.uid.substring(0, 8)}`;
                const isolatedOrg: Organization = {
                  id: newOrgId,
                  name: firebaseUser.displayName || 'المؤسسة التجارية الخاصة',
                  legalName: firebaseUser.displayName || 'المؤسسة التجارية الخاصة',
                  businessType: 'تجارة وتوزيع',
                  wilaya: 'الجزائر العاصمة',
                  phone: '0550 00 00 00',
                  currency: 'DZD',
                  plan: 'starter',
                  createdAt: new Date().toISOString().split('T')[0],
                };
                const isolatedUser: User = {
                  id: firebaseUser.uid,
                  organizationId: newOrgId,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'المسؤول',
                  email: firebaseUser.email || '',
                  role: 'owner',
                };
                setCurrentUser(isolatedUser);
                setOrganization(isolatedOrg);
                setApiOrganizationId(newOrgId);
                localStorage.setItem('mizan_current_user', JSON.stringify(isolatedUser));
                localStorage.setItem('mizan_current_org', JSON.stringify(isolatedOrg));
              }
            } else {
              // Completely new session without local storage cache
              const newOrgId = `org-${firebaseUser.uid.substring(0, 8)}`;
              const isolatedOrg: Organization = {
                id: newOrgId,
                name: firebaseUser.displayName || 'المؤسسة التجارية الخاصة',
                legalName: firebaseUser.displayName || 'المؤسسة التجارية الخاصة',
                businessType: 'تجارة وتوزيع',
                wilaya: 'الجزائر العاصمة',
                phone: '0550 00 00 00',
                currency: 'DZD',
                plan: 'starter',
                createdAt: new Date().toISOString().split('T')[0],
              };
              const isolatedUser: User = {
                id: firebaseUser.uid,
                organizationId: newOrgId,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'المسؤول',
                email: firebaseUser.email || '',
                role: 'owner',
              };
              setCurrentUser(isolatedUser);
              setOrganization(isolatedOrg);
              setApiOrganizationId(newOrgId);
              localStorage.setItem('mizan_current_user', JSON.stringify(isolatedUser));
              localStorage.setItem('mizan_current_org', JSON.stringify(isolatedOrg));
            }
          }
        } catch (e) {
          console.warn('Error loading auth profile:', e);
        }
        setIsAuthenticated(true);
        localStorage.setItem('mizan_auth_session', 'true');
        setRouteGuardMessage(null);
      } else {
        const sessionActive = localStorage.getItem('mizan_auth_session');
        if (sessionActive === 'false') {
          setIsAuthenticated(false);
          setApiOrganizationId(null);
          setRouteGuardMessage('تم تفعيل حماية المسارات (Route Guard): يجب تسجيل الدخول للوصول إلى لوحة التحكم والبيانات المالية.');
        }
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (organization?.id) {
      setApiOrganizationId(organization.id);
    }
  }, [organization?.id]);

  // Modals
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [modalTargetCustomerId, setModalTargetCustomerId] = useState<string | undefined>(undefined);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [aiMessageData, setAiMessageData] = useState<any | null>(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = useCallback(async (forcedOrgId?: string) => {
    // Strict Route Guard: never load internal data if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const targetOrgId = forcedOrgId || organization?.id;
    if (targetOrgId) {
      setApiOrganizationId(targetOrgId);
    }

    try {
      setLoading(true);

      // Hydrate from Firestore if user has stored records for their organization
      if (targetOrgId) {
        try {
          const [fsCustomers, fsInvoices, fsPayments, fsTasks, fsProducts] = await Promise.all([
            fetchCustomersFromFirestore(targetOrgId),
            fetchInvoicesFromFirestore(targetOrgId),
            fetchPaymentsFromFirestore(targetOrgId),
            fetchTasksFromFirestore(targetOrgId),
            fetchProductsFromFirestore(targetOrgId),
          ]);

          if (fsCustomers.length > 0 || fsInvoices.length > 0 || fsPayments.length > 0 || fsTasks.length > 0 || fsProducts.length > 0) {
            // Push Firestore records into server's tenant store so analytical endpoints and stats align
            await fetchJson('/api/sync/hydrate', {
              method: 'POST',
              body: JSON.stringify({
                customers: fsCustomers,
                invoices: fsInvoices,
                payments: fsPayments,
                tasks: fsTasks,
                products: fsProducts,
              }),
            });
          }
        } catch (syncErr) {
          console.warn('Notice hydrating store from Firestore:', syncErr);
        }
      }

      const [statsRes, actionsRes, custRes, invRes, payRes, taskRes, prodRes] = await Promise.all([
        fetchJson<DashboardStats>('/api/dashboard/stats'),
        fetchJson<TodayActionItem[]>('/api/dashboard/today-actions'),
        fetchJson<{ customers: Customer[] }>('/api/customers'),
        fetchJson<{ invoices: Invoice[] }>('/api/invoices'),
        fetchJson<{ payments: Payment[] }>('/api/payments'),
        fetchJson<{ tasks: CollectionTask[] }>('/api/collections/tasks'),
        fetchJson<{ products: Product[] }>('/api/products'),
      ]);

      setStats(statsRes);
      setTodayActions(actionsRes);
      setCustomers(custRes.customers);
      setInvoices(invRes.invoices);
      setPayments(payRes.payments);
      setTasks(taskRes.tasks);
      setProducts(prodRes.products || []);
    } catch (err) {
      console.error('Error loading MIZAN app data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organization?.id]);

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadAllData(organization.id);
    }
  }, [isAuthenticated, organization?.id, loadAllData]);

  // Real-time Firestore Live Subscriptions (listeners for customers, invoices, payments, products)
  useEffect(() => {
    if (!isAuthenticated || !organization?.id) return;
    const orgId = organization.id;

    const unsubCust = subscribeToCustomers(orgId, (liveCustomers) => {
      if (liveCustomers.length > 0) {
        setCustomers((prev) => {
          const map = new Map(prev.map(c => [c.id, c]));
          liveCustomers.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    });

    const unsubInv = subscribeToInvoices(orgId, (liveInvoices) => {
      if (liveInvoices.length > 0) {
        setInvoices((prev) => {
          const map = new Map(prev.map(i => [i.id, i]));
          liveInvoices.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
        });
      }
    });

    const unsubPay = subscribeToPayments(orgId, (livePayments) => {
      if (livePayments.length > 0) {
        setPayments((prev) => {
          const map = new Map(prev.map(p => [p.id, p]));
          livePayments.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    });

    const unsubProd = subscribeToProducts(orgId, (liveProducts) => {
      if (liveProducts.length > 0) {
        setProducts((prev) => {
          const map = new Map(prev.map(p => [p.id, p]));
          liveProducts.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubCust();
      unsubInv();
      unsubPay();
      unsubProd();
    };
  }, [isAuthenticated, organization?.id]);

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await fetchJson('/api/system/reset-demo', { method: 'POST' });
      await loadAllData();
      showToast('تمت إعادة ضبط البيانات الجزائرية النموذجية بنجاح.');
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFromFirestore();
    } catch (err) {
      console.warn('Logout warning:', err);
    }
    setIsAuthenticated(false);
    setActiveTab('landing');
    setAuthInitialMode('login');
    setRouteGuardMessage(null);
    localStorage.setItem('mizan_auth_session', 'false');
    localStorage.removeItem('mizan_current_user');
    localStorage.removeItem('mizan_current_org');
    setApiOrganizationId(null);
    setCustomers([]);
    setInvoices([]);
    setPayments([]);
    setTasks([]);
    setTodayActions([]);
    setStats({
      totalOutstanding: 0,
      totalOverdue: 0,
      totalCollectedThisMonth: 0,
      dsoDays: 0,
      collectionEfficiency: 0,
      atRiskAmount: 0,
      totalCustomers: 0,
      totalInvoices: 0,
      unpaidInvoicesCount: 0,
      promiseToPayCount: 0,
      activeDisputesCount: 0,
    });
    setIsMobileDrawerOpen(false);
    showToast('تم تسجيل الخروج من الجلسة بنجاح.');
  };

  const handleLogin = (user: User, org?: Organization) => {
    // Instantly wipe prior data so previous organization records never display
    setCustomers([]);
    setInvoices([]);
    setPayments([]);
    setTasks([]);
    setTodayActions([]);
    setStats({
      totalOutstanding: 0,
      totalOverdue: 0,
      totalCollectedThisMonth: 0,
      dsoDays: 0,
      collectionEfficiency: 0,
      atRiskAmount: 0,
      totalCustomers: 0,
      totalInvoices: 0,
      unpaidInvoicesCount: 0,
      promiseToPayCount: 0,
      activeDisputesCount: 0,
    });

    setCurrentUser(user);
    localStorage.setItem('mizan_current_user', JSON.stringify(user));
    if (org) {
      setOrganization(org);
      localStorage.setItem('mizan_current_org', JSON.stringify(org));
      setApiOrganizationId(org.id);
    }
    setIsAuthenticated(true);
    setRouteGuardMessage(null);
    localStorage.setItem('mizan_auth_session', 'true');
    showToast(`مرحباً بك، ${user.name}`);
    setTimeout(() => {
      loadAllData(org?.id || user.organizationId);
    }, 50);
  };

  const openPaymentFor = (custId?: string) => {
    setModalTargetCustomerId(custId);
    setShowPaymentModal(true);
  };

  const openInvoiceFor = (custId?: string) => {
    setModalTargetCustomerId(custId);
    setShowInvoiceModal(true);
  };

  const openAttemptFor = (custId?: string) => {
    setModalTargetCustomerId(custId);
    setShowAttemptModal(true);
  };

  const openPromiseFor = (custId?: string) => {
    setModalTargetCustomerId(custId);
    setShowPromiseModal(true);
  };

  const openAiMessageFor = (item: any) => {
    setAiMessageData({
      customerName: item.customer?.name || item.customerName,
      companyName: item.customer?.companyName || item.companyName,
      outstandingAmount: item.totalOverdueAmount || item.outstandingAmount || 100000,
      oldestOverdueDays: item.oldestOverdueDays || 20,
      phone: item.customer?.phone || item.phone,
    });
  };

  // Products Handlers
  const handleAddProducts = async (newProducts: Array<Partial<Product>>) => {
    try {
      const res = await fetchJson<{ success: boolean; products: Product[] }>('/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ items: newProducts }),
      });

      if (res.products && organization?.id) {
        for (const prod of res.products) {
          try {
            await saveProductToFirestore(prod);
          } catch (e) {
            console.warn('Notice saving product to Firestore:', e);
          }
        }
      }

      await loadAllData();
      showToast(`تمت إضافة ${newProducts.length} منتج بنجاح للمخزون.`);
    } catch (err: any) {
      console.error('Failed to add products:', err);
      showToast(err.message || 'فشل في حفظ المنتجات');
      throw err;
    }
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    try {
      const updated = await fetchJson<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (updated) {
        try {
          await saveProductToFirestore(updated);
        } catch (e) {
          console.warn('Notice updating product in Firestore:', e);
        }
      }

      await loadAllData();
      showToast('تم تحديث بيانات المنتج بنجاح.');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      showToast(err.message || 'فشل في تعديل المنتج');
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetchJson(`/api/products/${id}`, { method: 'DELETE' });
      try {
        await deleteProductFromFirestore(id);
      } catch (e) {
        console.warn('Notice deleting product from Firestore:', e);
      }

      await loadAllData();
      showToast('تم حذف المنتج بنجاح.');
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      showToast(err.message || 'فشل في حذف المنتج');
      throw err;
    }
  };

  const handleAdjustStock = async (id: string, delta: number, reason: string) => {
    try {
      const res = await fetchJson<{ success: boolean; product: Product }>('/api/products/adjust-stock', {
        method: 'POST',
        body: JSON.stringify({ productId: id, delta, reason }),
      });

      if (res.product) {
        try {
          await saveProductToFirestore(res.product);
        } catch (e) {
          console.warn('Notice syncing stock adjustment to Firestore:', e);
        }
      }

      await loadAllData();
      showToast('تم تعديل المخزون بنجاح.');
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      showToast(err.message || 'فشل في تعديل المخزون');
      throw err;
    }
  };

  // If user requested public Landing page
  if (activeTab === 'landing') {
    return (
      <AlgerianLandingPage 
        isAuthenticated={isAuthenticated}
        onEnterApp={() => {
          if (!isAuthenticated) {
            setRouteGuardMessage(null);
            setAuthInitialMode('login');
            setActiveTab('dashboard');
          } else {
            setActiveTab('dashboard');
          }
        }}
        onLogin={() => {
          setRouteGuardMessage(null);
          setAuthInitialMode('login');
          setActiveTab('dashboard');
        }}
        onRegister={() => {
          setRouteGuardMessage(null);
          setAuthInitialMode('register');
          setActiveTab('dashboard');
        }}
      />
    );
  }

  const loginFallback = (
    <LoginView 
      initialMode={authInitialMode}
      routeGuardMessage={routeGuardMessage}
      onLogin={handleLogin} 
      onGoToLanding={() => {
        setRouteGuardMessage(null);
        setActiveTab('landing');
      }} 
    />
  );

  return (
    <RouteGuard
      isAuthenticated={isAuthenticated}
      isAuthChecking={isAuthChecking}
      fallback={loginFallback}
    >
      <div dir="rtl" className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Responsive Sidebar Navigation (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayActionsCount={todayActions.length}
        brokenPromisesCount={stats?.brokenPromisesCount || 0}
        isOpenMobile={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        onLogout={handleLogout}
        currentUser={currentUser || undefined}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Responsive Header */}
        <Header
          organization={organization}
          currentUser={currentUser}
          onOpenPaymentModal={() => openPaymentFor()}
          onOpenInvoiceModal={() => openInvoiceFor()}
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onStartCollection={() => setActiveTab('priority')}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => {
            if (searchQuery.trim()) setActiveTab('customers');
          }}
          onToggleMobileMenu={() => setIsMobileDrawerOpen(prev => !prev)}
          onLogout={handleLogout}
        />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in duration-200">
            {toastMessage}
          </div>
        )}

        {/* Scrollable View Content with mobile padding bottom */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-5 pb-20 lg:pb-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-600">جاري تحميل بيانات منظومة ميزان التحصيل...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Financial KPIs */}
                  <MetricsGrid stats={stats} />

                  {/* Golden Priority Follow-up Widget */}
                  <GoldenFollowUpWidget
                    items={todayActions}
                    onViewCustomer={(id) => setSelectedCustomerId(id)}
                    onLogAttempt={(id) => openAttemptFor(id)}
                    onGenerateAiMessage={(item) => openAiMessageFor(item)}
                    onQuickPayment={(id) => openPaymentFor(id)}
                    onViewAllPriority={() => setActiveTab('priority')}
                  />

                  {/* Aging Schedule Breakdown Chart */}
                  <AgingChart
                    buckets={stats.agingBreakdown}
                    onSelectBucket={() => setActiveTab('reports')}
                  />

                  {/* Broken Promises Alert Banner if any */}
                  {stats.brokenPromisesCount > 0 && (
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-rose-900 text-sm">
                            يوجد {stats.brokenPromisesCount} وعود دفع منقوضة (Broken Promises)
                          </h4>
                          <p className="text-xs text-rose-700">
                            عملاء تعهدوا بالسداد وتجاوزوا التاريخ المتفق عليه دون إيداع الأموال.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('priority')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
                      >
                        معالجة فورية
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COLLECTION PRIORITY */}
              {activeTab === 'priority' && (
                <CollectionPriorityView
                  items={todayActions}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                  onLogAttempt={(id) => openAttemptFor(id)}
                  onRecordPromise={(id) => openPromiseFor(id)}
                  onGenerateAiMessage={(item) => openAiMessageFor(item)}
                  onQuickPayment={(id) => openPaymentFor(id)}
                />
              )}

              {/* TAB 3: CUSTOMERS */}
              {activeTab === 'customers' && (
                <CustomerList
                  customers={customers}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                  onNewCustomer={() => setShowCustomerModal(true)}
                  onQuickPayment={(id) => openPaymentFor(id)}
                  plan={organization.plan}
                  onUpgrade={() => setActiveTab('settings')}
                />
              )}

              {/* TAB: PRODUCTS & INVENTORY */}
              {activeTab === 'products' && (
                <ProductManagementView
                  products={products}
                  organizationId={organization.id}
                  onRefresh={loadAllData}
                  onAddProducts={handleAddProducts}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAdjustStock={handleAdjustStock}
                />
              )}

              {/* TAB 4: INVOICES */}
              {activeTab === 'invoices' && (
                <InvoiceList
                  invoices={invoices}
                  onNewInvoice={() => openInvoiceFor()}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                />
              )}

              {/* TAB 5: PAYMENTS */}
              {activeTab === 'payments' && (
                <PaymentList
                  payments={payments}
                  onNewPayment={() => openPaymentFor()}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                />
              )}

              {/* TAB 6: TASKS */}
              {activeTab === 'tasks' && (
                <CollectionTaskView
                  tasks={tasks}
                  customers={customers}
                  onRefresh={loadAllData}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                />
              )}

              {/* TAB 7: AGING REPORTS */}
              {activeTab === 'reports' && stats && (
                <AgingReportView
                  buckets={stats.agingBreakdown}
                  customers={customers}
                  onViewCustomer={(id) => setSelectedCustomerId(id)}
                />
              )}

              {/* TAB 8: CSV IMPORTER */}
              {activeTab === 'import' && (
                <CsvImportWizard onSuccess={loadAllData} />
              )}

              {/* TAB 9: SETTINGS & AUDIT LOGS */}
              {activeTab === 'settings' && (
                <SettingsView
                  organization={organization}
                  users={currentUser?.id ? [currentUser] : []}
                  currentUser={currentUser || undefined}
                  onOrganizationUpdate={(updated) => setOrganization(updated)}
                />
              )}

              {/* TAB 10: SUPER ADMIN & PLATFORM MANAGEMENT (SECURE & PROTECTED) */}
              {activeTab === 'super_admin' && (
                <SuperAdminGuard
                  currentUser={currentUser}
                  onNavigateHome={() => setActiveTab('dashboard')}
                  onAuthenticated={(updatedUser) => setCurrentUser(updatedUser)}
                >
                  <SuperAdminDashboard
                    currentUser={currentUser!}
                    onExit={() => setActiveTab('dashboard')}
                  />
                </SuperAdminGuard>
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation (Visible on mobile/tablet screens) */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(prev => !prev)}
          todayActionsCount={todayActions.length}
        />
      </div>

      {/* MODALS */}
      {/* 1. Customer 360 */}
      {selectedCustomerId && (
        <Customer360Modal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onOpenPaymentModal={(id) => openPaymentFor(id)}
          onOpenAttemptModal={(id) => openAttemptFor(id)}
          onOpenPromiseModal={(id) => openPromiseFor(id)}
          onOpenAiMessageModal={(data) => openAiMessageFor(data)}
        />
      )}

      {/* 2. New Customer Form */}
      {showCustomerModal && (
        <CustomerFormModal
          onClose={() => setShowCustomerModal(false)}
          onSuccess={() => {
            loadAllData();
            showToast('تمت إضافة العميل التجاري بنجاح.');
          }}
        />
      )}

      {/* 3. New Invoice */}
      {showInvoiceModal && (
        <CreateInvoiceModal
          customers={customers}
          products={products}
          initialCustomerId={modalTargetCustomerId}
          onClose={() => setShowInvoiceModal(false)}
          onSuccess={() => {
            loadAllData();
            showToast('تم إصدار الفاتورة وتحديث كشف الحساب والمخزون.');
          }}
        />
      )}

      {/* 4. Register Payment */}
      {showPaymentModal && (
        <RegisterPaymentModal
          customers={customers}
          initialCustomerId={modalTargetCustomerId}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            loadAllData();
            showToast('تم تسجيل الدفعة وتخفيض الدين وإصدار الوصل.');
          }}
        />
      )}

      {/* 5. Log Attempt */}
      {showAttemptModal && (
        <LogAttemptModal
          customers={customers}
          initialCustomerId={modalTargetCustomerId}
          onClose={() => setShowAttemptModal(false)}
          onSuccess={() => {
            loadAllData();
            showToast('تم تسجيل متابعة التحصيل بنجاح.');
          }}
        />
      )}

      {/* 6. Promise To Pay */}
      {showPromiseModal && (
        <PromiseToPayModal
          customers={customers}
          initialCustomerId={modalTargetCustomerId}
          onClose={() => setShowPromiseModal(false)}
          onSuccess={() => {
            loadAllData();
            showToast('تم تثبيت وعد الدفع وجدولة التذكير الآلي.');
          }}
        />
      )}

      {/* 7. AI Collection Message */}
      {aiMessageData && (
        <AiMessageModal
          initialData={aiMessageData}
          onClose={() => setAiMessageData(null)}
        />
      )}
    </div>
    </RouteGuard>
  );
}
