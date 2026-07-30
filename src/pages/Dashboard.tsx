import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, LogOut, Package, LayoutGrid, ExternalLink, Menu, X, Warehouse, ClipboardList, FileSearch, UserRound, QrCode, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapProductRow, mapCategoryRow } from '../lib/mappers';
import { Product, Category } from '../types';
import { useAuth } from '../lib/AuthContext';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';
import Profile from './Profile';
import InventoryTracking from './InventoryTracking';
import InvoiceReview from './InvoiceReview';
import Footer from '../components/Footer';
import QrCodePreview from '../components/QrCodePreview';
import { generateQrDataUrl } from '../lib/generateQr';
import tecstoreLogo from '../tecstore-logo.png';

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL as string | undefined;

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined);

  // Sidebar (side nav) state — the hamburger button opens/closes it. It only
  // holds top-level module links (currently "إدارة المخزون" + الملف الشخصي); the
  // actual الأقسام/المنتجات switcher lives in the page body itself. Future modules
  // (invoices, sales, reports) get added as sibling nav items later.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<'inventory' | 'tracking' | 'invoices' | 'profile'>('inventory');

  // Delete requires typing the account password first, for both products and categories.
  const [pendingDelete, setPendingDelete] = useState<{ type: 'product' | 'category'; id: string } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // QR enlarge/print — admin-only view of a product's serial-number QR code.
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  const printSerialQr = async (product: Product) => {
    if (!product.serialNumber) return;
    const dataUrl = await generateQrDataUrl(product.serialNumber);
    const win = window.open('', '_blank', 'width=420,height=520');
    if (!win) return;
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>QR - ${product.serialNumber}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; gap: 12px; }
            img { width: 260px; height: 260px; }
            p { font-weight: 800; font-size: 14px; direction: ltr; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.onafterprint = () => window.close();" />
          <p>${product.serialNumber}</p>
        </body>
      </html>
    `);
    win.document.close();
  };

  const selectTab = (t: 'products' | 'categories') => {
    setTab(t);
    setSidebarOpen(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setCategories((catRes.data || []).map(mapCategoryRow));
    setProducts((prodRes.data || []).map(mapProductRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const requestDeleteProduct = (id: string) => {
    setPendingDelete({ type: 'product', id });
    setConfirmPassword('');
    setConfirmError('');
  };

  const requestDeleteCategory = (id: string) => {
    setPendingDelete({ type: 'category', id });
    setConfirmPassword('');
    setConfirmError('');
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    setConfirmPassword('');
    setConfirmError('');
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !session?.user.email || !confirmPassword) return;
    setConfirmLoading(true);
    setConfirmError('');

    // Re-authenticate with the typed password to verify it's really the account owner.
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: confirmPassword,
    });

    if (authError) {
      setConfirmError('كلمة المرور غير صحيحة.');
      setConfirmLoading(false);
      return;
    }

    if (pendingDelete.type === 'product') {
      await supabase.from('products').delete().eq('id', pendingDelete.id);
    } else {
      await supabase.from('categories').delete().eq('id', pendingDelete.id);
    }

    setConfirmLoading(false);
    setPendingDelete(null);
    setConfirmPassword('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] lg:flex" dir="rtl">

      {/* =========================================================================================
          SIDEBAR (side nav) - opened via the hamburger button. On mobile it slides in as an
          overlay drawer; on large screens it's always visible as a static column on the side.
          It only holds top-level module links - "إدارة المخزون" for now. The actual
          الأقسام/المنتجات switcher lives inside the page body (under the header), not here.
          Future modules (فواتير / مبيعات / تقارير) get added here as sibling nav items later.
          ========================================================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:static lg:translate-x-0 lg:z-0 lg:flex-shrink-0`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <img src={tecstoreLogo} alt="TecStore Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-slate-900 text-sm">لوحة تحكم TecStore</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {/* Group: إدارة المخزون - the actual الأقسام/المنتجات switcher now lives inside
              the page body itself (as tabs under the header), not here. This nav item just
              represents/selects the module. */}
          <button
            onClick={() => { setView('inventory'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black ${view === 'inventory' ? 'bg-[#c09d53]/10 text-[#c09d53]' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <Warehouse className="w-4 h-4" />
            إدارة المخزون
          </button>

          {/* Group: متابعة المخزون - مشتريات / مصروفات / مبيعات. Lives in its own page
              component (InventoryTracking) which handles its own sub-tabs internally. */}
          <button
            onClick={() => { setView('tracking'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black ${view === 'tracking' ? 'bg-[#c09d53]/10 text-[#c09d53]' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-4 h-4" />
            متابعة المخزون
          </button>

          {/* Group: مراجعة الفواتير - سجل كل فواتير البيع، بحث/فلترة وإعادة طباعة.
              Lives in its own page component (InvoiceReview). */}
          <button
            onClick={() => { setView('invoices'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black ${view === 'invoices' ? 'bg-[#c09d53]/10 text-[#c09d53]' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <FileSearch className="w-4 h-4" />
            مراجعة الفواتير
          </button>

          {/* Future groups (التقارير) get added here as new sibling
              buttons once that part of the system is built. */}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 space-y-2">
          {/* Profile entry (avatar + email) - opens the account/profile page */}
          <button
            onClick={() => { setView('profile'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right ${view === 'profile' ? 'bg-[#c09d53]/10' : 'hover:bg-slate-50'}`}
          >
            <span className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200">
              {session?.user.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserRound className="w-4 h-4 text-slate-400" />
              )}
            </span>
            <span className="flex-1 min-w-0 text-right">
              <span className="block text-xs font-black text-slate-800">الملف الشخصي</span>
              <span className="block text-[11px] text-slate-400 font-bold truncate">{session?.user.email}</span>
            </span>
          </button>

          {STOREFRONT_URL && (
            <a href={STOREFRONT_URL} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#c09d53] px-3 py-2 rounded-xl hover:bg-slate-50">
              <ExternalLink className="w-3.5 h-3.5" /> عرض المتجر
            </a>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl">
            <LogOut className="w-3.5 h-3.5" /> خروج
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-[#c09d53] p-1.5 -mr-1.5"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg text-slate-900">
              {view === 'profile' ? 'الملف الشخصي' : view === 'tracking' ? 'متابعة المخزون' : view === 'invoices' ? 'مراجعة الفواتير' : (tab === 'products' ? 'المنتجات' : 'الأقسام')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {view === 'profile' ? (
          <Profile />
        ) : view === 'tracking' ? (
          <InventoryTracking />
        ) : view === 'invoices' ? (
          <InvoiceReview />
        ) : (
        <>
        <div className="flex gap-2 mb-6">
          <button onClick={() => selectTab('products')}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'products' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Package className="w-4 h-4" /> المنتجات ({products.length})
          </button>
          <button onClick={() => selectTab('categories')}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'categories' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
            <LayoutGrid className="w-4 h-4" /> الأقسام ({categories.length})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 font-bold py-20">جاري التحميل...</p>
        ) : tab === 'products' ? (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setEditingProduct(null)}
                className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
                <Plus className="w-4 h-4" /> إضافة منتج
              </button>
            </div>
            {categories.length === 0 && (
              <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold mb-4">
                لا يوجد أقسام بعد. أضف قسمًا أولًا من تبويب "الأقسام" قبل إضافة المنتجات.
              </p>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
                  <div className="w-full h-36 rounded-xl mb-3 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    <img src={p.image} className="w-full h-full object-contain" />
                    <span className={`absolute top-2 right-2 text-white text-[10px] font-black px-2 py-0.5 rounded-full ${p.condition === 'used' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {p.condition === 'used' ? 'مستعمل' : 'جديد'}
                    </span>
                  </div>
                  <p className="font-black text-slate-900 text-sm">{p.arabicName}</p>
                  <p className="text-xs text-slate-400 font-bold mb-2">{p.name}</p>
                  <p className="text-[#c09d53] font-black mb-3">{p.price.toLocaleString()} ج.م</p>

                  {p.serialNumber && (
                    <button
                      type="button"
                      onClick={() => setQrProduct(p)}
                      className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-3 hover:bg-slate-50 w-fit"
                      title="تكبير / طباعة QR الرقم التسلسلي"
                    >
                      <QrCodePreview value={p.serialNumber} size={28} />
                      <span className="text-[10px] font-bold text-slate-500 font-mono" dir="ltr">{p.serialNumber}</span>
                    </button>
                  )}

                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setEditingProduct(p)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
                      <Pencil className="w-3.5 h-3.5" /> تعديل
                    </button>
                    <button onClick={() => requestDeleteProduct(p.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-red-200 text-red-500 rounded-lg py-2 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-slate-400 font-bold col-span-full text-center py-10">لا توجد منتجات بعد.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setEditingCategory(null)}
                className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
                <Plus className="w-4 h-4" /> إضافة قسم
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
                  <img src={c.image} className="w-full h-32 object-cover rounded-xl mb-3 bg-slate-100" />
                  <p className="font-black text-slate-900 text-sm">{c.arabicName}</p>
                  <p className="text-xs text-slate-400 font-bold mb-3">{c.subTitle}</p>
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setEditingCategory(c)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
                      <Pencil className="w-3.5 h-3.5" /> تعديل
                    </button>
                    <button onClick={() => requestDeleteCategory(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-red-200 text-red-500 rounded-lg py-2 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-slate-400 font-bold col-span-full text-center py-10">لا توجد أقسام بعد.</p>}
            </div>
          </>
        )}
        </>
        )}
      </main>

      {/* DEVELOPER CREDIT + CONTACT — pinned to the true end of the page body via the
          min-h-screen flex-col wrapper above (not just glued under the content). */}
      <Footer />
      </div>

      {editingProduct !== undefined && (
        <ProductForm
          categories={categories}
          existing={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={() => { setEditingProduct(undefined); load(); }}
        />
      )}
      {editingCategory !== undefined && (
        <CategoryForm
          existing={editingCategory}
          sortOrder={categories.length}
          onClose={() => setEditingCategory(undefined)}
          onSaved={() => { setEditingCategory(undefined); load(); }}
        />
      )}

      {qrProduct && qrProduct.serialNumber && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl" onClick={() => setQrProduct(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrProduct(null)} className="self-end -mt-2 -ml-2 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-black text-slate-900 mb-1 text-sm">{qrProduct.arabicName}</h3>
            <QrCodePreview value={qrProduct.serialNumber} size={220} />
            <p className="text-sm font-mono font-bold text-slate-600 mt-3" dir="ltr">{qrProduct.serialNumber}</p>
            <p className="text-[11px] text-slate-400 font-bold mt-1 text-center">اسكن الكود ده وقت عمل فاتورة البيع بدل كتابة الرقم يدويًا.</p>
            <button
              onClick={() => printSerialQr(qrProduct)}
              className="mt-4 flex items-center justify-center gap-2 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl w-full"
            >
              <Printer className="w-4 h-4" /> طباعة الملصق
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-black text-slate-900 mb-1">تأكيد الحذف</h3>
            <p className="text-sm text-slate-500 font-semibold mb-4">
              {pendingDelete.type === 'product'
                ? 'لن يمكن التراجع عن حذف هذا المنتج.'
                : 'حذف القسم لن يحذف المنتجات المرتبطة به.'} من فضلك أدخل كلمة مرور حسابك للتأكيد.
            </p>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmDelete(); }}
              placeholder="كلمة المرور"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold mb-2"
            />
            {confirmError && <p className="text-red-500 text-xs font-bold mb-2">{confirmError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={cancelDelete}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                إلغاء
              </button>
              <button onClick={confirmDelete} disabled={confirmLoading || !confirmPassword}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-bold">
                {confirmLoading ? 'جاري التحقق...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
