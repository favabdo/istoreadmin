import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { uploadImage } from '../lib/uploadImage';
import { supabase } from '../lib/supabase';

// Profile page (accessed from the sidebar): lets the admin set a profile
// picture and change their email / password. Kept as a plain Supabase Auth
// update (avatar stored in user_metadata) so no extra DB table is needed.
export default function Profile() {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [email, setEmail] = useState(session?.user.email || '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const avatarUrl = session?.user.user_metadata?.avatar_url as string | undefined;

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('حجم الصورة كبير جدًا، الرجاء اختيار صورة أقل من 2 ميجابايت.');
      return;
    }

    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (error) throw error;
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEmailSave = async () => {
    setEmailError('');
    setEmailMessage('');
    if (!email || email === session?.user.email) return;

    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email });
    setEmailSaving(false);

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailMessage('تم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد، افتحه لإتمام التغيير.');
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMessage('تم تحديث كلمة المرور بنجاح.');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  return (
    <div className="max-w-lg" dir="rtl">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="الصورة الشخصية" />
            ) : (
              <span className="text-2xl font-black text-slate-400">
                {session?.user.email?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-[#c09d53] text-white flex items-center justify-center shadow-md hover:bg-[#a9863f] disabled:opacity-50"
          >
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="text-xs text-slate-400 font-bold mt-3">اضغط على أيقونة الكاميرا لتغيير الصورة</p>
        {avatarError && <p className="text-red-500 text-xs font-bold mt-2">{avatarError}</p>}
      </div>

      {/* Email */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="font-black text-slate-900 text-sm mb-3">البريد الإلكتروني</h3>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold mb-3"
        />
        {emailError && <p className="text-red-500 text-xs font-bold mb-2">{emailError}</p>}
        {emailMessage && <p className="text-emerald-600 text-xs font-bold mb-2">{emailMessage}</p>}
        <button
          onClick={handleEmailSave}
          disabled={emailSaving || !email || email === session?.user.email}
          className="bg-[#c09d53] hover:bg-[#a9863f] disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl"
        >
          {emailSaving ? 'جاري الحفظ...' : 'تحديث البريد الإلكتروني'}
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-black text-slate-900 text-sm mb-3">كلمة المرور</h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="كلمة المرور الجديدة"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold mb-2"
        />
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="تأكيد كلمة المرور الجديدة"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold mb-3"
        />
        {passwordError && <p className="text-red-500 text-xs font-bold mb-2">{passwordError}</p>}
        {passwordMessage && <p className="text-emerald-600 text-xs font-bold mb-2">{passwordMessage}</p>}
        <button
          onClick={handlePasswordSave}
          disabled={passwordSaving || !newPassword || !confirmNewPassword}
          className="bg-[#c09d53] hover:bg-[#a9863f] disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl"
        >
          {passwordSaving ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
        </button>
      </div>
    </div>
  );
}
