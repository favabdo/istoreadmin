import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import tecstoreLogo from '../tecstore-logo.png';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] px-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-[#c09d53]/10 rounded-full flex items-center justify-center mb-4 p-2.5">
            <img src={tecstoreLogo} alt="TecStore Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">لوحة تحكم TecStore</h1>
          <p className="text-slate-500 font-bold text-xs mt-1">سجّل الدخول لإدارة المنتجات والأقسام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c09d53]/40"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c09d53]/40"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#c09d53] hover:bg-[#a9863f] text-white font-black py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 font-bold text-center mt-6">
          يمكن إنشاء حسابات المسؤولين من Supabase Dashboard &gt; Authentication &gt; Users.
        </p>
      </div>
    </div>
  );
}
