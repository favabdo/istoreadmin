import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY غير موجودين. ' +
    'تأكد من ضبط متغيرات البيئة في ملف .env أو في إعدادات Render.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
