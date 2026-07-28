import { useEffect, useState, useCallback, FormEvent, ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, ShoppingCart, Receipt, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapPurchaseRow, purchaseToRow, mapExpenseRow, expenseToRow, mapSaleRow, saleToRow } from '../lib/mappers';
import { Purchase, Expense, Sale } from '../types';
import { useAuth } from '../lib/AuthContext';

type TrackTab = 'purchases' | 'expenses' | 'sales';

const todayStr = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });

export default function InventoryTracking() {
  const { session } = useAuth();
  const [tab, setTab] = useState<TrackTab>('purchases');

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

  const load = useCallback(async () => {
    setLoading(true);
    const [purRes, expRes, saleRes] = await Promise.all([
      supabase.from('purchases').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
    ]);
    setPurchases((purRes.data || []).map(mapPurchaseRow));
    setExpenses((expRes.data || []).map(mapExpenseRow));
    setSales((saleRes.data || []).map(mapSaleRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPurchases = purchases.reduce((s, p) => s + p.quantity * p.unitCost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, sl) => s + sl.quantity * sl.unitPrice, 0);

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

    const table = pendingDelete.type === 'purchases' ? 'purchases' : pendingDelete.type === 'expenses' ? 'expenses' : 'sales';
    await supabase.from(table).delete().eq('id', pendingDelete.id);

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
              إجمالي المشتريات: <span className="text-slate-900 font-black">{money(totalPurchases)} ج.م</span>
            </p>
            <button onClick={() => setEditingPurchase(null)}
              className="flex items-center gap-1.5 bg-[#c09d53] hover:bg-[#a9863f] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" /> تسجيل مشترى
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الصنف</th>
                  <th className="px-4 py-3">المورد</th>
                  <th className="px-4 py-3">الكمية</th>
                  <th className="px-4 py-3">سعر الوحدة</th>
                  <th className="px-4 py-3">الإجمالي</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{p.itemName}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold">{p.supplierName || '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{p.quantity}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{money(p.unitCost)} ج.م</td>
                    <td className="px-4 py-3 font-black text-[#c09d53]">{money(p.quantity * p.unitCost)} ج.م</td>
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
                  <tr><td colSpan={7} className="text-center text-slate-400 font-bold py-10">لا توجد مشتريات مسجلة بعد.</td></tr>
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
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الصنف</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">الكمية</th>
                  <th className="px-4 py-3">سعر الوحدة</th>
                  <th className="px-4 py-3">الإجمالي</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{s.itemName}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold">{s.customerName || '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{s.quantity}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{money(s.unitPrice)} ج.م</td>
                    <td className="px-4 py-3 font-black text-[#c09d53]">{money(s.quantity * s.unitPrice)} ج.م</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
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
                  <tr><td colSpan={7} className="text-center text-slate-400 font-bold py-10">لا توجد مبيعات مسجلة بعد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingPurchase !== undefined && (
        <PurchaseForm existing={editingPurchase} onClose={() => setEditingPurchase(undefined)} onSaved={() => { setEditingPurchase(undefined); load(); }} />
      )}
      {editingExpense !== undefined && (
        <ExpenseForm existing={editingExpense} onClose={() => setEditingExpense(undefined)} onSaved={() => { setEditingExpense(undefined); load(); }} />
      )}
      {editingSale !== undefined && (
        <SaleForm existing={editingSale} onClose={() => setEditingSale(undefined)} onSaved={() => { setEditingSale(undefined); load(); }} />
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

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PurchaseForm({ existing, onClose, onSaved }: { existing: Purchase | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!existing;
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [itemName, setItemName] = useState(existing?.itemName ?? '');
  const [supplierName, setSupplierName] = useState(existing?.supplierName ?? '');
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [unitCost, setUnitCost] = useState(existing?.unitCost ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !itemName.trim() || quantity <= 0 || unitCost < 0) {
      setError('برجاء ملء التاريخ والصنف والكمية وسعر الوحدة بشكل صحيح.');
      return;
    }
    setSaving(true);
    const row = purchaseToRow({ date, itemName: itemName.trim(), supplierName, quantity, unitCost, notes });
    const { error } = isEdit
      ? await supabase.from('purchases').update(row).eq('id', existing!.id)
      : await supabase.from('purchases').insert(row);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  };

  return (
    <ModalShell title={isEdit ? 'تعديل مشترى' : 'تسجيل مشترى جديد'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">الصنف</label>
          <input value={itemName} onChange={e => setItemName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">المورد (اختياري)</label>
          <input value={supplierName} onChange={e => setSupplierName(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الكمية</label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">سعر الوحدة (ج.م)</label>
            <input type="number" min={0} step="0.01" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="input" required />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500">الإجمالي: <span className="text-[#c09d53] font-black">{money(quantity * unitCost)} ج.م</span></p>
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
    </ModalShell>
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
    <ModalShell title={isEdit ? 'تعديل مصروف' : 'تسجيل مصروف جديد'} onClose={onClose}>
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
    </ModalShell>
  );
}

function SaleForm({ existing, onClose, onSaved }: { existing: Sale | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!existing;
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [itemName, setItemName] = useState(existing?.itemName ?? '');
  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [unitPrice, setUnitPrice] = useState(existing?.unitPrice ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !itemName.trim() || quantity <= 0 || unitPrice < 0) {
      setError('برجاء ملء التاريخ والصنف والكمية وسعر الوحدة بشكل صحيح.');
      return;
    }
    setSaving(true);
    const row = saleToRow({ date, itemName: itemName.trim(), customerName, quantity, unitPrice, notes });
    const { error } = isEdit
      ? await supabase.from('sales').update(row).eq('id', existing!.id)
      : await supabase.from('sales').insert(row);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  };

  return (
    <ModalShell title={isEdit ? 'تعديل عملية بيع' : 'تسجيل عملية بيع جديدة'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">الصنف</label>
          <input value={itemName} onChange={e => setItemName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">العميل (اختياري)</label>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الكمية</label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">سعر الوحدة (ج.م)</label>
            <input type="number" min={0} step="0.01" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="input" required />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500">الإجمالي: <span className="text-[#c09d53] font-black">{money(quantity * unitPrice)} ج.م</span></p>
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
    </ModalShell>
  );
}
