import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Plus, Pencil, Trash2, ShoppingCart, Receipt, TrendingUp, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapPurchaseRow, mapExpenseRow, expenseToRow, mapSaleRow, mapCategoryRow } from '../lib/mappers';
import { Purchase, Expense, Sale, Category } from '../types';
import { useAuth } from '../lib/AuthContext';
import PurchaseForm from './PurchaseForm';
import SaleForm from './SaleForm';
import { printSaleInvoice } from '../lib/invoice';

type TrackTab = 'purchases' | 'expenses' | 'sales';

const todayStr = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
const conditionLabel = (c: 'new' | 'used') => (c === 'new' ? 'جديد' : 'مستعمل');

export default function InventoryTracking() {
  const { session } = useAuth();
  const [tab, setTab] = useState<TrackTab>('purchases');

  const [categories, setCategories] = useState<Category[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingPurchase, setEditingPurchase] = useState<Purchase | null | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<Expense | null | undefined>(undefined);
  const [editingSale, setEditingSale] = useState<Sale | null | undefined>(undefined);

  const [pendingDelete, setPendingDelete] = useState<{ type: TrackTab; id: string } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const categoryLabel = (id: string) => categories.find(c => c.id === id)?.arabicName ?? id;

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, purRes, expRes, saleRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('purchases').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
    ]);
    setCategories((catRes.data || []).map(mapCategoryRow));
    setPurchases((purRes.data || []).map(mapPurchaseRow));
    setExpenses((expRes.data || []).map(mapExpenseRow));
    setSales((saleRes.data || []).map(mapSaleRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPurchases = purchases.reduce((s, p) => s + p.price, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, sl) => s + sl.price, 0);

  const requestDelete = (type: TrackTab, id: string) => {
    setPendingDelete({ type, id });
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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: confirmPassword,
    });

    if (authError) {
      setConfirmError('كلمة المرور غير صحيحة.');
      setConfirmLoading(false);
      return;
    }

    await supabase.from(pendingDelete.type).delete().eq('id', pendingDelete.id);

    setConfirmLoading(false);
    setPendingDelete(null);
    setConfirmPassword('');
    load();
  };

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('purchases')}
          className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'purchases' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
          <ShoppingCart className="w-4 h-4" /> المشتريات ({purchases.length})
        </button>
        <button onClick={() => setTab('expenses')}
          className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'expenses' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Receipt className="w-4 h-4" /> المصروفات ({expenses.length})
        </button>
        <button onClick={() => setTab('sales')}
          className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full ${tab === 'sales' ? 'bg-[#c09d53] text-white' : 'bg-slate-100 text-slate-600'}`}>
          <TrendingUp className="w-4 h-4" /> المبيعات ({sales.length})
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 font-bold py-20">جاري التحميل...</p>
      ) : tab === 'purchases' ? (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-bold text-slate-500">
              إجمالي قيمة المشتريات: <span className="text-slate-900 font-black">{money(totalPurchases)} ج.م</span>
            </p>
            <button onClick={() => setEditingPurchase(null)}
              className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" /> تسجيل مشترى
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الجهاز</th>
                  <th className="px-4 py-3">القسم</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">السيريال</th>
                  <th className="px-4 py-3">المورد</th>
                  <th className="px-4 py-3">السعر</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image && <img src={p.image} className="w-8 h-8 rounded-lg object-contain border border-slate-100 bg-slate-50" />}
                        <span className="font-black text-slate-900">{p.arabicName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-bold whitespace-nowrap">{categoryLabel(p.category)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full ${p.condition === 'new' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {conditionLabel(p.condition)}{p.batteryHealth != null ? ` · ${p.batteryHealth}%` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs" dir="ltr">{p.serialNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold">{p.supplierName || '—'}</td>
                    <td className="px-4 py-3 font-black text-[#c09d53] whitespace-nowrap">{money(p.price)} ج.م</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingPurchase(p)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => requestDelete('purchases', p.id)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-slate-400 font-bold py-10">لا توجد مشتريات مسجلة بعد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'expenses' ? (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-bold text-slate-500">
              إجمالي المصروفات: <span className="text-slate-900 font-black">{money(totalExpenses)} ج.م</span>
            </p>
            <button onClick={() => setEditingExpense(null)}
              className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" /> تسجيل مصروف
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">البيان</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">ملاحظات</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{e.title}</td>
                    <td className="px-4 py-3 font-black text-[#c09d53]">{money(e.amount)} ج.م</td>
                    <td className="px-4 py-3 text-slate-500 font-bold">{e.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingExpense(e)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => requestDelete('expenses', e.id)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-400 font-bold py-10">لا توجد مصروفات مسجلة بعد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-bold text-slate-500">
              إجمالي المبيعات: <span className="text-slate-900 font-black">{money(totalSales)} ج.م</span>
            </p>
            <button onClick={() => setEditingSale(null)}
              className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" /> تسجيل عملية بيع
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الجهاز</th>
                  <th className="px-4 py-3">القسم</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">السيريال</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">السعر</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{s.arabicName}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold whitespace-nowrap">{categoryLabel(s.category)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full ${s.condition === 'new' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {conditionLabel(s.condition)}{s.batteryHealth != null ? ` · ${s.batteryHealth}%` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs" dir="ltr">{s.serialNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold">
                      {s.customerName || '—'}
                      {s.customerPhone && <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{s.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 font-black text-[#c09d53] whitespace-nowrap">{money(s.price)} ج.م</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => printSaleInvoice(s, categoryLabel(s.category))} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" title="طباعة الفاتورة">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingSale(s)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => requestDelete('sales', s.id)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-slate-400 font-bold py-10">لا توجد مبيعات مسجلة بعد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingPurchase !== undefined && (
        <PurchaseForm categories={categories} existing={editingPurchase} onClose={() => setEditingPurchase(undefined)} onSaved={() => { setEditingPurchase(undefined); load(); }} />
      )}
      {editingSale !== undefined && (
        <SaleForm categories={categories} existing={editingSale} onClose={() => setEditingSale(undefined)} onSaved={() => { setEditingSale(undefined); load(); }} />
      )}
      {editingExpense !== undefined && (
        <ExpenseForm existing={editingExpense} onClose={() => setEditingExpense(undefined)} onSaved={() => { setEditingExpense(undefined); load(); }} />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-black text-slate-900 mb-1">تأكيد الحذف</h3>
            <p className="text-sm text-slate-500 font-semibold mb-4">
              لن يمكن التراجع عن حذف هذا السجل. من فضلك أدخل كلمة مرور حسابك للتأكيد.
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
    </>
  );
}

function ExpenseForm({ existing, onClose, onSaved }: { existing: Expense | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!existing;
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !title.trim() || amount < 0) {
      setError('برجاء ملء التاريخ والبيان والمبلغ بشكل صحيح.');
      return;
    }
    setSaving(true);
    const row = expenseToRow({ date, title: title.trim(), amount, notes });
    const { error } = isEdit
      ? await supabase.from('expenses').update(row).eq('id', existing!.id)
      : await supabase.from('expenses').insert(row);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">{isEdit ? 'تعديل مصروف' : 'تسجيل مصروف جديد'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">البيان</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input" required placeholder="مثال: إيجار، فاتورة كهرباء، صيانة..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ (ج.م)</label>
            <input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} />
          </div>

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
