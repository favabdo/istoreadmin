import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, LogOut, Package, LayoutGrid, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapProductRow, mapCategoryRow } from '../lib/mappers';
import { Product, Category } from '../types';
import { useAuth } from '../lib/AuthContext';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';
import tecstoreLogo from '../tecstore-logo.png';
import whatsappLogo from '../whatsapp-logo.png';
import gmailLogo from '../gmail-logo.png';

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL as string | undefined;

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined);

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

  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('حذف القسم لن يحذف المنتجات المرتبطة به. هل تريد المتابعة؟')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9]" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={tecstoreLogo} alt="TecStore Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-black text-lg text-slate-900">لوحة تحكم TecStore</h1>
              <p className="text-xs text-slate-400 font-bold">{session?.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STOREFRONT_URL && (
              <a href={STOREFRONT_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#c09d53] border border-slate-200 rounded-full px-3 py-2">
                <ExternalLink className="w-3.5 h-3.5" /> عرض المتجر
              </a>
            )}
            <button onClick={signOut} className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-full px-3 py-2">
              <LogOut className="w-3.5 h-3.5" /> خروج
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 pb-3">
          <button onClick={() => setTab('products')}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'products' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Package className="w-4 h-4" /> المنتجات ({products.length})
          </button>
          <button onClick={() => setTab('categories')}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'categories' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
            <LayoutGrid className="w-4 h-4" /> الأقسام ({categories.length})
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
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
                  <div className="w-full h-36 rounded-xl mb-3 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={p.image} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-black text-slate-900 text-sm">{p.arabicName}</p>
                  <p className="text-xs text-slate-400 font-bold mb-2">{p.name}</p>
                  <p className="text-[#c09d53] font-black mb-3">{p.price.toLocaleString()} ج.م</p>
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setEditingProduct(p)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
                      <Pencil className="w-3.5 h-3.5" /> تعديل
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
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
                    <button onClick={() => deleteCategory(c.id)}
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
      </main>

      {/* =========================================================================================
          DEVELOPER CREDIT + CONTACT (always at the very bottom of the page)
          ========================================================================================= */}
      <div className="w-full mt-4 mb-8 flex flex-col items-center gap-3 text-center" dir="rtl">
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          Website by <span className="font-black text-slate-700">Abdullah Elsawy</span>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://wa.me/201061163091"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 group"
          >
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 p-1.5 border border-slate-100">
              <img src={whatsappLogo} alt="WhatsApp" className="w-full h-full object-contain" />
            </span>
          </a>
          <a
            href="mailto:abdallah666mo@gmail.com"
            className="flex flex-col items-center gap-1.5 group"
          >
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 p-1.5 border border-slate-100">
              <img src={gmailLogo} alt="Gmail" className="w-full h-full object-contain" />
            </span>
          </a>
        </div>
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
    </div>
  );
}
