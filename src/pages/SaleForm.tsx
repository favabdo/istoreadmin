import { useState, FormEvent, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Sale, Category } from '../types';
import { supabase } from '../lib/supabase';
import { saleToRow } from '../lib/mappers';
import { printSaleInvoice } from '../lib/invoice';
import { IPHONE_MODELS } from '../lib/iphoneModels';
import QrCodePreview from '../components/QrCodePreview';

interface Props {
  categories: Category[];
  existing: Sale | null;
  onClose: () => void;
  onSaved: () => void;
}

interface ColorRow { name: string; hex: string; }

export default function SaleForm({ categories, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;

  const [selectedModelName, setSelectedModelName] = useState('');
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [name, setName] = useState(existing?.name ?? '');
  const [arabicName, setArabicName] = useState(existing?.arabicName ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [category, setCategory] = useState(existing?.category ?? categories[0]?.id ?? '');
  const [condition, setCondition] = useState<'new' | 'used'>(existing?.condition === 'used' ? 'used' : 'new');
  const [batteryHealth, setBatteryHealth] = useState<string>(
    existing?.batteryHealth != null ? String(existing.batteryHealth) : (existing?.condition === 'used' ? '' : '100')
  );
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber ?? '');
  const [serialPhotoPreview, setSerialPhotoPreview] = useState<string | null>(null);
  const [screen, setScreen] = useState(existing?.specs?.screen ?? '');
  const [processor, setProcessor] = useState(existing?.specs?.processor ?? '');
  const [camera, setCamera] = useState(existing?.specs?.camera ?? '');
  const [battery, setBattery] = useState(existing?.specs?.battery ?? '');
  const [colors, setColors] = useState<ColorRow[]>(
    existing?.colors?.length ? existing.colors.map(c => ({ name: c.name, hex: c.hex })) : [{ name: 'أسود', hex: '#1c1c1e' }]
  );
  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const [matchedProductId, setMatchedProductId] = useState<string | undefined>(existing?.productId);
  const [serialLookupNote, setSerialLookupNote] = useState('');
  const [removeFromStore, setRemoveFromStore] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    if (condition === 'new') setBatteryHealth('100');
  }, [condition]);

  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const value = serialNumber.trim();
    if (!value) { setSerialLookupNote(''); setMatchedProductId(undefined); return; }
    lookupTimer.current = setTimeout(async () => {
      const { data } = await supabase.from('products').select('*').eq('serial_number', value).maybeSingle();
      if (!data) { setSerialLookupNote('مفيش جهاز مسجل بالرقم التسلسلي ده — اتأكد منه أو سجّله الأول من المشتريات.'); setMatchedProductId(undefined); return; }
      const p = data as any;
      setMatchedProductId(p.id);
      setName(p.name ?? '');
      setArabicName(p.arabic_name ?? '');
      setPrice(p.price != null ? String(p.price) : '');
      if (p.category) setCategory(p.category);
      setCondition(p.condition === 'used' ? 'used' : 'new');
      setBatteryHealth(p.battery_health != null ? String(p.battery_health) : '');
      setScreen(p.specs?.screen ?? '');
      setProcessor(p.specs?.processor ?? '');
      setCamera(p.specs?.camera ?? '');
      setBattery(p.specs?.battery ?? '');
      setColors(p.colors?.length ? p.colors.map((c: any) => ({ name: c.name, hex: c.hex })) : [{ name: 'أسود', hex: '#1c1c1e' }]);
      setSerialLookupNote('الجهاز ده موجود عندك — البيانات اتملت تلقائيًا، وتقدر تعدّل السعر لو البيع اتم بسعر مختلف.');
    }, 500);
    return () => { if (lookupTimer.current) clearTimeout(lookupTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialNumber]);

  const handleModelSelect = (modelName: string) => {
    setSelectedModelName(modelName);
    if (!modelName) return;
    const model = IPHONE_MODELS.find(m => m.name === modelName);
    if (!model) return;
    setName(model.name);
    setArabicName(model.arabicName);
    setScreen(model.specs.screen);
    setProcessor(model.specs.processor);
    setCamera(model.specs.camera);
    setBattery(model.specs.battery);
  };

  const handleSerialPhotoPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setSerialPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addColorRow = () => setColors(prev => [...prev, { name: '', hex: '#000000' }]);
  const removeColorRow = (idx: number) => setColors(prev => prev.filter((_, i) => i !== idx));
  const updateColorRow = (idx: number, field: 'name' | 'hex', value: string) => {
    setColors(prev => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !arabicName.trim() || !price) {
      setError('برجاء ملء الاسم والاسم بالعربي والسعر.');
      return;
    }
    if (condition === 'used' && batteryHealth.trim() === '') {
      setError('برجاء إدخال نسبة حالة البطارية للجهاز المستعمل.');
      return;
    }

    const specs = { screen, processor, camera, battery };
    const colorRows = colors.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), hex: c.hex }));

    const sale: Sale = {
      id: existing?.id ?? '',
      date,
      productId: matchedProductId,
      name: name.trim(),
      arabicName: arabicName.trim(),
      price: parseFloat(price),
      category,
      condition,
      batteryHealth: batteryHealth.trim() !== '' ? Math.max(0, Math.min(100, parseFloat(batteryHealth))) : undefined,
      serialNumber: serialNumber.trim() || undefined,
      specs,
      colors: colorRows,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setSaving(true);

    const row = saleToRow(sale);
    let savedId = existing?.id;
    let saleError: any = null;

    if (isEdit) {
      const { error } = await supabase.from('sales').update(row).eq('id', existing!.id);
      saleError = error;
    } else {
      const { data, error } = await supabase.from('sales').insert(row).select().single();
      saleError = error;
      if (data) savedId = data.id;
    }

    if (saleError) {
      setSaving(false);
      setError(saleError.message);
      return;
    }

    if (!isEdit && removeFromStore && matchedProductId) {
      await supabase.from('products').delete().eq('id', matchedProductId);
    }

    setSaving(false);

    const categoryLabel = categories.find(c => c.id === category)?.arabicName ?? category;
    printSaleInvoice({ ...sale, id: savedId ?? '' }, categoryLabel);

    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">{isEdit ? 'تعديل عملية بيع' : 'تسجيل عملية بيع جديدة'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">العميل (اختياري)</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">رقم تليفون العميل (اختياري)</label>
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input" dir="ltr" placeholder="01xxxxxxxxx" />
            <p className="text-[11px] text-slate-400 font-bold mt-1">بيتحفظ مع بيانات البيع عشان تلاقيه وقت ما تحتاجه تاني.</p>
          </div>

          {/* Serial number lookup first — usually how a sale starts */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-600 mb-1">الرقم التسلسلي (Serial Number) و QR الخاص بالجهاز</p>
            <p className="text-[11px] text-slate-400 font-bold mb-3">
              ده بيظهر عندك بس في لوحة التحكم (مش في المتجر ولا عند العميل)، وهتستخدمه بعدين تسكنه وقت عمل فاتورة البيع بدل ما تدور على الجهاز أو تكتب رقمه يدويًا.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-white w-fit bg-white/60">
                  رفع صورة ملصق السريال (اختياري، للمساعدة في القراءة بس)
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleSerialPhotoPick(e.target.files[0])} />
                </label>

                {serialPhotoPreview && (
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <img src={serialPhotoPreview} className="w-full max-h-56 object-contain rounded-lg" />
                    <p className="text-[10px] text-slate-400 font-bold mt-1">اقرأ الرقم من الصورة واكتبه في الخانة تحت — الصورة دي مش بتتحفظ، بتستخدم للمساعدة بس.</p>
                  </div>
                )}

                <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="مثال: JN9M120G2F" className="input font-mono tracking-wide" dir="ltr" />
                {serialLookupNote && (
                  <p className={`text-[11px] font-bold ${matchedProductId ? 'text-emerald-600' : 'text-amber-600'}`}>{serialLookupNote}</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <QrCodePreview value={serialNumber} size={110} />
                <span className="text-[10px] text-slate-400 font-bold">معاينة الـ QR</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">اختيار سريع من موديلات آيفون (اختياري)</label>
            <select value={selectedModelName} onChange={e => handleModelSelect(e.target.value)} className="input">
              <option value="">-- اكتب الاسم بنفسك، أو اختر موديل جاهز من هنا --</option>
              {IPHONE_MODELS.map(m => (
                <option key={m.name} value={m.name}>{m.name} — {m.arabicName}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 font-bold mt-1">
              اختيار موديل من القائمة هيملى الاسم بالعربي والانجليزي والمواصفات تلقائيًا، وبعدين تقدر تعدّل فيها زي ما تحب. لو الجهاز مش في القائمة سيبها فاضية واكتب بياناته يدويًا تحت.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الاسم (English)</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الاسم بالعربي</label>
              <input value={arabicName} onChange={e => setArabicName(e.target.value)} className="input" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">السعر</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">القسم</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.arabicName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">حالة المنتج</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCondition('new')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black border ${condition === 'new' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                جديد
              </button>
              <button type="button" onClick={() => setCondition('used')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black border ${condition === 'used' ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                مستعمل
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">حالة البطارية (%)</label>
            <input
              type="number" min={0} max={100} value={batteryHealth} disabled={condition === 'new'}
              onChange={e => setBatteryHealth(e.target.value)}
              placeholder={condition === 'used' ? 'مثال: 87' : ''}
              className="input disabled:bg-slate-100 disabled:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 font-bold mt-1">
              {condition === 'new' ? 'المنتجات الجديدة بتتحط تلقائيًا 100%.' : 'الجهاز مستعمل — اكتب نسبة حالة البطارية الحقيقية بالظبط زي ما هتظهر للعميل.'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-1">المواصفات</p>
            <p className="text-[11px] text-slate-400 font-bold mb-2">اي حقل تسيبه فاضي مش هيظهر خالص في صفحة المنتج بالمتجر.</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="الشاشة" value={screen} onChange={e => setScreen(e.target.value)} className="input" />
              <input placeholder="المعالج" value={processor} onChange={e => setProcessor(e.target.value)} className="input" />
              <input placeholder="الكاميرا" value={camera} onChange={e => setCamera(e.target.value)} className="input" />
              <input placeholder="البطارية" value={battery} onChange={e => setBattery(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-600">الألوان المتاحة</p>
              <button type="button" onClick={addColorRow} className="text-[#c09d53] text-xs font-bold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> إضافة لون
              </button>
            </div>
            <div className="space-y-2">
              {colors.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={e => updateColorRow(idx, 'hex', e.target.value)} className="w-9 h-9 rounded-lg border" />
                  <input placeholder="اسم اللون" value={c.name} onChange={e => updateColorRow(idx, 'name', e.target.value)} className="input flex-1" />
                  <button type="button" onClick={() => removeColorRow(idx)} className="text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} />
          </div>

          {!isEdit && matchedProductId && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={removeFromStore} onChange={e => setRemoveFromStore(e.target.checked)} className="w-4 h-4" />
              إزالة الجهاز من المتجر بعد تسجيل البيع (متبقّي مفعّل تلقائيًا)
            </label>
          )}

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'تسجيل عملية البيع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
