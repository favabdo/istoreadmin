import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Printer, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapSaleRow, mapCategoryRow } from '../lib/mappers';
import { Sale, Category } from '../types';
import { printSaleInvoice } from '../lib/invoice';

const money = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
const conditionLabel = (c: 'new' | 'used') => (c === 'new' ? 'جديد' : 'مستعمل');
const invoiceNumber = (s: Sale) => s.id.replace(/-/g, '').slice(0, 8).toUpperCase();

export default function InvoiceReview() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [viewing, setViewing] = useState<Sale | null>(null);

  const categoryLabel = (id: string) => categories.find(c => c.id === id)?.arabicName ?? id;

  const load = useCallback(async () => {
    setLoading(true);
    const [saleRes, catRes] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    ]);
    setSales((saleRes.data || []).map(mapSaleRow));
    setCategories((catRes.data || []).map(mapCategoryRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter(s => {
      if (fromDate && s.date < fromDate) return false;
      if (toDate && s.date > toDate) return false;
      if (!q) return true;
      const haystack = [
        s.arabicName, s.name, s.customerName, s.customerPhone, s.serialNumber, invoiceNumber(s),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [sales, query, fromDate, toDate]);

  const totalAmount = filtered.reduce((sum, s) => sum + s.price, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم العميل، رقم التليفون، السريال، أو اسم الجهاز"
            className="input pr-9"
          />
        </div>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input sm:w-40" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input sm:w-40" />
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm font-bold text-slate-500">
          عدد الفواتير: <span className="text-slate-900 font-black">{filtered.length}</span>
          {' '}· الإجمالي: <span className="text-slate-900 font-black">{money(totalAmount)} ج.م</span>
        </p>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 font-bold py-20">جاري التحميل...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-right min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                <th className="px-4 py-3">رقم الفاتورة</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">الجهاز</th>
                <th className="px-4 py-3">القسم</th>
                <th className="px-4 py-3">العميل</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500" dir="ltr">#{invoiceNumber(s)}</td>
                  <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{s.date}</td>
                  <td className="px-4 py-3 font-black text-slate-900">{s.arabicName}</td>
                  <td className="px-4 py-3 text-slate-500 font-bold whitespace-nowrap">{categoryLabel(s.category)}</td>
                  <td className="px-4 py-3 text-slate-500 font-bold">
                    {s.customerName || '—'}
                    {s.customerPhone && <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{s.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3 font-black text-[#c09d53] whitespace-nowrap">{money(s.price)} ج.م</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setViewing(s)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" title="عرض التفاصيل">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => printSaleInvoice(s, categoryLabel(s.category))} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" title="طباعة الفاتورة">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 font-bold py-10">لا توجد فواتير مطابقة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">فاتورة #{invoiceNumber(viewing)}</h2>
              <button onClick={() => setViewing(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <table className="w-full text-sm text-right">
                <tbody>
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold w-2/5">التاريخ</td><td className="py-2 font-black text-slate-900">{viewing.date}</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">الجهاز</td><td className="py-2 font-black text-slate-900">{viewing.arabicName} ({viewing.name})</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">القسم</td><td className="py-2 font-black text-slate-900">{categoryLabel(viewing.category)}</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">الحالة</td><td className="py-2 font-black text-slate-900">{conditionLabel(viewing.condition)}{viewing.batteryHealth != null ? ` · ${viewing.batteryHealth}%` : ''}</td></tr>
                  {viewing.serialNumber && <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">السيريال</td><td className="py-2 font-black text-slate-900 font-mono" dir="ltr">{viewing.serialNumber}</td></tr>}
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">العميل</td><td className="py-2 font-black text-slate-900">{viewing.customerName || '—'}</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">تليفون العميل</td><td className="py-2 font-black text-slate-900 font-mono" dir="ltr">{viewing.customerPhone || '—'}</td></tr>
                  {viewing.notes && <tr className="border-b border-slate-50"><td className="py-2 text-slate-400 font-bold">ملاحظات</td><td className="py-2 font-bold text-slate-700">{viewing.notes}</td></tr>}
                </tbody>
              </table>
              <div className="bg-[#c09d53]/10 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">الإجمالي المدفوع</span>
                <span className="text-xl font-black text-[#c09d53]">{money(viewing.price)} ج.م</span>
              </div>
              <button
                onClick={() => printSaleInvoice(viewing, categoryLabel(viewing.category))}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black"
              >
                <Printer className="w-4 h-4" /> طباعة / تحميل PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
