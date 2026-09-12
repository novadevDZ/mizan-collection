import React, { useState, useMemo } from 'react';
import { 
  Package, Sparkles, Plus, Search, Filter, AlertTriangle, 
  CheckCircle2, ArrowUpDown, Barcode, TrendingUp, DollarSign,
  Edit2, Trash2, SlidersHorizontal, RefreshCw, XCircle, ChevronLeft
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { SmartProductInputModal } from './SmartProductInputModal';
import { StockAdjustModal } from './StockAdjustModal';

interface ProductManagementViewProps {
  products: Product[];
  organizationId: string;
  onRefresh: () => void;
  onAddProducts: (newProducts: Array<Partial<Product>>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAdjustStock: (id: string, delta: number, reason: string) => Promise<void>;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  products,
  organizationId,
  onRefresh,
  onAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price_desc' | 'margin_desc'>('name');

  // Modals state
  const [isSmartInputOpen, setIsSmartInputOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    let totalCostVal = 0;
    let totalSaleVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const cost = (p.purchasePrice || 0) * (p.stockQuantity || 0);
      const sale = (p.salePrice || 0) * (p.stockQuantity || 0);
      totalCostVal += cost;
      totalSaleVal += sale;

      if (p.stockQuantity === 0) {
        outOfStockCount++;
      } else if (p.stockQuantity <= (p.minStockAlert || 5)) {
        lowStockCount++;
      }
    }

    const totalPotentialProfit = totalSaleVal - totalCostVal;
    const overallMarginPct = totalCostVal > 0 ? ((totalPotentialProfit / totalCostVal) * 100).toFixed(1) : '0.0';

    return {
      totalCount,
      totalCostVal,
      totalSaleVal,
      totalPotentialProfit,
      overallMarginPct,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBarcode = p.barcode && p.barcode.includes(q);
          const matchSku = p.sku && p.sku.toLowerCase().includes(q);
          const matchCat = p.category && p.category.toLowerCase().includes(q);
          if (!matchName && !matchBarcode && !matchSku && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'in_stock' && (p.stockQuantity <= (p.minStockAlert || 5) || p.stockQuantity === 0)) return false;
          if (selectedStatus === 'low_stock' && (p.stockQuantity > (p.minStockAlert || 5) || p.stockQuantity === 0)) return false;
          if (selectedStatus === 'out_of_stock' && p.stockQuantity !== 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        if (sortBy === 'stock_asc') return a.stockQuantity - b.stockQuantity;
        if (sortBy === 'stock_desc') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'price_desc') return b.salePrice - a.salePrice;
        if (sortBy === 'margin_desc') {
          const marginA = a.salePrice - a.purchasePrice;
          const marginB = b.salePrice - b.purchasePrice;
          return marginB - marginA;
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const formatDzd = (num: number) => {
    return new Intl.NumberFormat('ar-DZ').format(Math.round(num)) + ' دج';
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER WITH ACTIONS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">إدارة المنتجات والمخزون</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {products.length} صنف مسجل
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            متابعة أسعار الشراء والبيع، مستويات المخزون، وهوامش الربح، والربط التلقائي مع فواتير المبيعات
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsSmartInputOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            الإدخال الذكي للمنتجات
          </button>

          <button
            onClick={() => {
              setEditingProduct({
                id: '',
                organizationId,
                name: '',
                category: 'مواد غذائية عامة',
                unit: 'كرتونة',
                purchasePrice: 0,
                salePrice: 0,
                stockQuantity: 10,
                minStockAlert: 5,
                status: 'in_stock',
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            منتج جديد
          </button>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cost Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">قيمة المخزون (سعر التكلفة)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-800 font-mono">
              {formatDzd(metrics.totalCostVal)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              رأس المال المودع في المخزن
            </div>
          </div>
        </div>

        {/* Total Sale Value & Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">القيمة البيعية المتوقعة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-700 font-mono">
              {formatDzd(metrics.totalSaleVal)}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span>هامش الربح الإجمالي:</span>
              <span className="font-bold font-mono">+{metrics.overallMarginPct}%</span>
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">منتجات أوشكت على النفاد</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-amber-700 font-mono">
              {metrics.lowStockCount} <span className="text-xs font-normal text-slate-500">منتج</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              دون الحد الأدنى المحدد للتنبيه
            </div>
          </div>
        </div>

        {/* Out of stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">منتجات نفدت من المخزن</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-rose-700 font-mono">
              {metrics.outOfStockCount} <span className="text-xs font-normal text-slate-500">منتج</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              الكمية صفر (تحتاج توريد عاجل)
            </div>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الباركود، الكود المرجعي (SKU)، أو الفئة..."
              className="w-full pr-10 pl-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({products.length})
            </button>
            <button
              onClick={() => setSelectedStatus('in_stock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === 'in_stock'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              متوفر
            </button>
            <button
              onClick={() => setSelectedStatus('low_stock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === 'low_stock'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              منخفض ({metrics.lowStockCount})
            </button>
            <button
              onClick={() => setSelectedStatus('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === 'out_of_stock'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              نفد ({metrics.outOfStockCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">الاسم أبجدياً</option>
              <option value="stock_desc">المخزون (الأعلى أولاً)</option>
              <option value="stock_asc">المخزون (الأقل أولاً)</option>
              <option value="price_desc">سعر البيع (الأعلى)</option>
              <option value="margin_desc">أعلى هامش ربح</option>
            </select>
          </div>

        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 shrink-0">التصنيف:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'لا توجد منتجات تطابق شروط البحث'
                : 'لم تقم بإضافة أي منتجات بعد'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery
                ? 'جرب البحث بكلمات أخرى أو إعادة ضبط الفلاتر'
                : 'استخدم ميزة الإدخال الذكي لإضافة منتجاتك دفعة واحدة من قوائم الموردين أو النصوص'}
            </p>
            <button
              onClick={() => setIsSmartInputOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              جرب الإدخال الذكي الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">المنتج والتفاصيل</th>
                  <th className="p-4">الفئة والوحدة</th>
                  <th className="p-4">سعر التكلفة (شراء)</th>
                  <th className="p-4">سعر البيع الافتراضي</th>
                  <th className="p-4">هامش الربح</th>
                  <th className="p-4">المخزون والحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const marginVal = product.salePrice - product.purchasePrice;
                  const marginPct = product.purchasePrice > 0 
                    ? Math.round((marginVal / product.purchasePrice) * 100) 
                    : 0;

                  const isOutOfStock = product.stockQuantity === 0;
                  const isLowStock = !isOutOfStock && product.stockQuantity <= (product.minStockAlert || 5);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Product Name, SKU, Barcode */}
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          {product.barcode && (
                            <span className="flex items-center gap-1 font-mono">
                              <Barcode className="w-3 h-3" />
                              {product.barcode}
                            </span>
                          )}
                          {product.sku && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                              {product.sku}
                            </span>
                          )}
                          {product.packaging && (
                            <span className="text-slate-500">
                              • {product.packaging}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Unit */}
                      <td className="p-4">
                        <div className="inline-block bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px] mb-1">
                          {product.category || 'مواد غذائية'}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          وحدة: <span className="font-semibold text-slate-700">{product.unit}</span>
                        </div>
                      </td>

                      {/* Purchase Price */}
                      <td className="p-4 font-mono text-slate-600 font-semibold">
                        {formatDzd(product.purchasePrice)}
                      </td>

                      {/* Sale Price */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {formatDzd(product.salePrice)}
                      </td>

                      {/* Profit Margin */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
                          <span>+{formatDzd(marginVal)}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          +{marginPct}%
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-mono font-bold text-sm ${
                            isOutOfStock 
                              ? 'text-rose-600' 
                              : isLowStock 
                              ? 'text-amber-600' 
                              : 'text-slate-800'
                          }`}>
                            {product.stockQuantity} {product.unit}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                              نفد
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              منخفض
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              متوفر
                            </span>
                          )}
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isOutOfStock 
                                ? 'bg-rose-500 w-0' 
                                : isLowStock 
                                ? 'bg-amber-500 w-1/4' 
                                : 'bg-emerald-500 w-3/4'
                            }`} 
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setAdjustingProduct(product)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                            title="تعديل المخزون"
                          >
                            تعديل المخزون
                          </button>
                          
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="تعديل بيانات المنتج"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
                                await onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SMART PRODUCT INPUT MODAL */}
      <SmartProductInputModal
        isOpen={isSmartInputOpen}
        onClose={() => {
          setIsSmartInputOpen(false);
          onRefresh();
        }}
        onAddProducts={onAddProducts}
        organizationId={organizationId}
      />

      {/* STOCK ADJUST MODAL */}
      <StockAdjustModal
        product={adjustingProduct}
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onConfirm={async (id, delta, reason) => {
          await onAdjustStock(id, delta, reason);
          setAdjustingProduct(null);
          onRefresh();
        }}
      />

      {/* EDIT / CREATE PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">
                {editingProduct.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingProduct.id) {
                  await onUpdateProduct(editingProduct.id, editingProduct);
                } else {
                  await onAddProducts([editingProduct]);
                }
                setEditingProduct(null);
                onRefresh();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الباركود</label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرمز المرجعي (SKU)</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفئة</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الشراء (دج)</label>
                  <input
                    type="number"
                    value={editingProduct.purchasePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع (دج)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.salePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-bold text-emerald-700 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد التنبيه</label>
                  <input
                    type="number"
                    value={editingProduct.minStockAlert}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التعبئة</label>
                <input
                  type="text"
                  value={editingProduct.packaging || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, packaging: e.target.value })}
                  placeholder="مثال: 12 علبة / كرتونة"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
