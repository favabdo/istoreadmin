import { useState, FormEvent, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { Product, Category } from '../types';
import { supabase } from '../lib/supabase';
import { productToRow, slugify } from '../lib/mappers';
import { uploadImage } from '../lib/uploadImage';
import { IPHONE_MODELS } from '../lib/iphoneModels';
import QrCodePreview from '../components/QrCodePreview';

interface Props {
  categories: Category[];
  existing: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

interface ColorRow {
  name: string;
  hex: string;
}

export default function ProductForm({ categories, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [arabicName, setArabicName] = useState(existing?.arabicName ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [originalPrice, setOriginalPrice] = useState(existing?.originalPrice?.toString() ?? '');
  const [category, setCategory] = useState(existing?.category ?? categories[0]?.id ?? '');
  const [isNew, setIsNew] = useState(existing?.isNew ?? false);
  const [isSold, setIsSold] = useState(existing?.isSold ?? false);
  const [condition, setCondition] = useState<'new' | 'used'>(existing?.condition === 'used' ? 'used' : 'new');
  const [batteryHealth, setBatteryHealth] = useState<string>(
    existing?.batteryHealth != null ? String(existing.batteryHealth) : (existing?.condition === 'used' ? '' : '100')
  );
  const [selectedModelName, setSelectedModelName] = useState<string>(
    existing && IPHONE_MODELS.some(m => m.name === existing.name) ? existing.name : ''
  );
  const [screen, setScreen] = useState(existing?.specs?.screen ?? '');
  const [processor, setProcessor] = useState(existing?.specs?.processor ?? '');
  const [camera, setCamera] = useState(existing?.specs?.camera ?? '');
  const [battery, setBattery] = useState(existing?.specs?.battery ?? '');
  const [colors, setColors] = useState<ColorRow[]>(
    existing?.colors?.map(c => ({ name: c.name, hex: c.hex })) ?? [{ name: 'أسود', hex: '#1c1c1e' }]
  );
  const [mainImage, setMainImage] = useState(existing?.image ?? '');
  const [extraImages, setExtraImages] = useState<string[]>(existing?.images?.filter(i => i !== existing?.image) ?? []);
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber ?? '');
  // Purely a visual aid: a temporary local preview of the serial-number label photo so the
  // admin can zoom in and read it while typing. It is never uploaded or saved anywhere.
  const [serialPhotoPreview, setSerialPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  // New devices are always assumed 100% battery health; used devices need the admin to type it in.
  useEffect(() => {
    if (condition === 'new') setBatteryHealth('100');
  }, [condition]);

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

  const uploadFiles = async (files: FileList): Promise<string[]> => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file));
      }
      return urls;
    } catch (e: any) {
      setError(e.message || 'فشل رفع الصور');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleMainImageUpload = async (files: FileList) => {
    const urls = await uploadFiles(files);
    if (urls.length === 0) return;
    const [first, ...rest] = urls;
    setMainImage(first);
    if (rest.length) setExtraImages(prev => [...prev, ...rest]);
  };

  const handleExtraImageUpload = async (files: FileList) => {
    const urls = await uploadFiles(files);
    if (urls.length) setExtraImages(prev => [...prev, ...urls]);
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

    if (!name.trim() || !arabicName.trim() || !price || !mainImage) {
      setError('برجاء ملء الاسم والاسم بالعربي والسعر واختيار صورة رئيسية.');
      return;
    }

    if (condition === 'used' && batteryHealth.trim() === '') {
      setError('برجاء إدخال نسبة حالة البطارية للجهاز المستعمل.');
      return;
    }

    const product: Product = {
      id: existing?.id ?? slugify(name),
      name: name.trim(),
      arabicName: arabicName.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      image: mainImage,
      images: [mainImage, ...extraImages],
      colors: colors
        .filter(c => c.name.trim())
        .map(c => ({ name: c.name.trim(), hex: c.hex, bgClass: `bg-[${c.hex}]` })),
      category,
      rating: existing?.rating ?? 5,
      reviewsCount: existing?.reviewsCount ?? 0,
      isNew,
      isSold,
      condition,
      batteryHealth: batteryHealth.trim() !== '' ? Math.max(0, Math.min(100, parseFloat(batteryHealth))) : undefined,
      serialNumber: serialNumber.trim() || undefined,
      specs: { screen, processor, camera, battery },
    };

    setSaving(true);
    const row = productToRow(product);
    const { error } = isEdit
      ? await supabase.from('products').update(row).eq('id', product.id)
      : await supabase.from('products').insert(row);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">{isEdit ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">السعر</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">السعر قبل الخصم (اختياري)</label>
              <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">القسم</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.arabicName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">حالة المنتج</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCondition('new')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border ${condition === 'new' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('used')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border ${condition === 'used' ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  مستعمل
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">حالة البطارية (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={batteryHealth}
              disabled={condition === 'new'}
              onChange={e => setBatteryHealth(e.target.value)}
              placeholder={condition === 'used' ? 'مثال: 87' : ''}
              className="input disabled:bg-slate-100 disabled:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 font-bold mt-1">
              {condition === 'new'
                ? 'المنتجات الجديدة بتتحط تلقائيًا 100%.'
                : 'الجهاز مستعمل — اكتب نسبة حالة البطارية الحقيقية بالظبط زي ما هتظهر للعميل.'}
            </p>
          </div>

          <label className="flex items-center gap-2 font-bold text-sm text-slate-700">
            <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} />
            منتج وصل حديثًا (يظهر عليه شارة "جديد" في صفحة تفاصيل المنتج)
          </label>

          <label className="flex items-center gap-2 font-bold text-sm text-slate-700">
            <input type="checkbox" checked={isSold} onChange={e => setIsSold(e.target.checked)} />
            الجهاز مباع (بيفضل ظاهر في المتجر بس بلون رمادي ومكتوب عليه "مباع"، ومبيتباعش تاني)
          </label>

          {/* Serial number + QR — admin-only, never shown to customers or on the storefront */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-600 mb-1">الرقم التسلسلي (Serial Number) و QR الخاص بالجهاز</p>
            <p className="text-[11px] text-slate-400 font-bold mb-3">
              ده بيظهر عندك بس في لوحة التحكم (مش في المتجر ولا عند العميل)، وهتستخدمه بعدين تسكنه وقت عمل فاتورة البيع بدل ما تدور على الجهاز أو تكتب رقمه يدويًا.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-white w-fit bg-white/60">
                  <Upload className="w-4 h-4" /> رفع صورة ملصق السريال (اختياري، للمساعدة في القراءة بس)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleSerialPhotoPick(e.target.files[0])}
                  />
                </label>

                {serialPhotoPreview && (
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <img src={serialPhotoPreview} className="w-full max-h-56 object-contain rounded-lg" />
                    <p className="text-[10px] text-slate-400 font-bold mt-1">اقرأ الرقم من الصورة واكتبه في الخانة تحت — الصورة دي مش بتتحفظ، بتستخدم للمساعدة بس.</p>
                  </div>
                )}

                <input
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="مثال: JN9M120G2F"
                  className="input font-mono tracking-wide"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <QrCodePreview value={serialNumber} size={110} />
                <span className="text-[10px] text-slate-400 font-bold">معاينة الـ QR</span>
              </div>
            </div>
          </div>

          {/* Main image */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الصورة الرئيسية</label>
            <p className="text-[11px] text-slate-400 font-bold mb-2">هذه المعاينة تُظهر شكل الصورة بالظبط زي ما هتظهر في كارت المنتج بالمتجر (الصورة كاملة من غير قص). تقدر تختار أكتر من صورة مرة واحدة: أول صورة هتبقى الرئيسية والباقي هينضاف كصور إضافية.</p>
            {mainImage && (
              <div className="w-full max-w-[220px] h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 mb-3 flex items-center justify-center">
                <img src={mainImage} className="w-full h-full object-contain" />
              </div>
            )}
            <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 w-fit">
              <Upload className="w-4 h-4" />
              {uploading ? 'جاري الرفع...' : mainImage ? 'تغيير الصورة (يمكن اختيار أكثر من صورة)' : 'رفع صورة أو أكثر'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && e.target.files.length > 0 && handleMainImageUpload(e.target.files)} />
            </label>
          </div>

          {/* Extra images */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">صور إضافية</label>
            <div className="flex flex-wrap items-center gap-3">
              {extraImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <div className="w-14 h-14 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img src={img} className="w-full h-full object-contain" />
                  </div>
                  <button type="button" onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                <Upload className="w-4 h-4" /> إضافة (يمكن اختيار أكثر من صورة)
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && e.target.files.length > 0 && handleExtraImageUpload(e.target.files)} />
              </label>
            </div>
          </div>

          {/* Specs */}
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

          {/* Colors */}
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

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              إلغاء
            </button>
            <button type="submit" disabled={saving || uploading} className="flex-1 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
