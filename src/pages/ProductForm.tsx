import { useState, FormEvent } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { Product, Category } from '../types';
import { supabase } from '../lib/supabase';
import { productToRow, slugify } from '../lib/mappers';
import { uploadImage } from '../lib/uploadImage';

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
  const [screen, setScreen] = useState(existing?.specs?.screen ?? '');
  const [processor, setProcessor] = useState(existing?.specs?.processor ?? '');
  const [camera, setCamera] = useState(existing?.specs?.camera ?? '');
  const [battery, setBattery] = useState(existing?.specs?.battery ?? '');
  const [colors, setColors] = useState<ColorRow[]>(
    existing?.colors?.map(c => ({ name: c.name, hex: c.hex })) ?? [{ name: 'أسود', hex: '#1c1c1e' }]
  );
  const [mainImage, setMainImage] = useState(existing?.image ?? '');
  const [extraImages, setExtraImages] = useState<string[]>(existing?.images?.filter(i => i !== existing?.image) ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleMainImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setMainImage(url);
    } catch (e: any) {
      setError(e.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleExtraImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setExtraImages(prev => [...prev, url]);
    } catch (e: any) {
      setError(e.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
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
            <label className="flex items-center gap-2 font-bold text-sm text-slate-700 mb-2">
              <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} />
              منتج جديد (يظهر عليه شارة "جديد")
            </label>
          </div>

          {/* Main image */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الصورة الرئيسية</label>
            <div className="flex items-center gap-3">
              {mainImage && <img src={mainImage} className="w-16 h-16 rounded-xl object-cover border" />}
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                <Upload className="w-4 h-4" />
                {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleMainImageUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Extra images */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">صور إضافية</label>
            <div className="flex flex-wrap items-center gap-3">
              {extraImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} className="w-14 h-14 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                <Upload className="w-4 h-4" /> إضافة
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleExtraImageUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Specs */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">المواصفات</p>
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
