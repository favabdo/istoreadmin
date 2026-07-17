import { useState, FormEvent, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Category } from '../types';
import { supabase } from '../lib/supabase';
import { categoryToRow, slugify } from '../lib/mappers';
import { uploadImage } from '../lib/uploadImage';

interface Props {
  existing: Category | null;
  sortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoryForm({ existing, sortOrder, onClose, onSaved }: Props) {
  const isEdit = !!existing;
  const [name, setName] = useState(existing?.name ?? '');
  const [arabicName, setArabicName] = useState(existing?.arabicName ?? '');
  const [subTitle, setSubTitle] = useState(existing?.subTitle ?? '');
  const [image, setImage] = useState(existing?.image ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setImage(await uploadImage(file));
    } catch (e: any) {
      setError(e.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !arabicName.trim() || !image) {
      setError('برجاء ملء كل الحقول واختيار صورة.');
      return;
    }

    const category: Category = {
      id: existing?.id ?? slugify(name),
      name: name.trim(),
      arabicName: arabicName.trim(),
      subTitle: subTitle.trim(),
      image,
    };

    setSaving(true);
    const row = categoryToRow(category, sortOrder);
    const { error } = isEdit
      ? await supabase.from('categories').update(row).eq('id', category.id)
      : await supabase.from('categories').insert(row);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">{isEdit ? 'تعديل قسم' : 'إضافة قسم جديد'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الاسم (English)</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الاسم بالعربي</label>
            <input value={arabicName} onChange={e => setArabicName(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">وصف قصير</label>
            <input value={subTitle} onChange={e => setSubTitle(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">صورة القسم</label>
            <div className="flex items-center gap-3">
              {image && <img src={image} className="w-16 h-16 rounded-xl object-cover border" />}
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                <Upload className="w-4 h-4" />
                {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              إلغاء
            </button>
            <button type="submit" disabled={saving || uploading} className="flex-1 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة القسم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
