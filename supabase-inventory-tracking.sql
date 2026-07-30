-- شغّل السكريبت ده مرة واحدة في Supabase SQL Editor.
-- ملاحظة: بما إن جدولي purchases و sales اتعملوا حديثًا ومفيش بيانات فيهم غالبًا،
-- السكريبت بيمسحهم ويعمل بيهم من جديد بالشكل الجديد (بيانات الجهاز الكاملة).
-- لو عندك بيانات فيهم حابب تحتفظ بيها، سيبلي أعرف الأول قبل ما تشغّله.

drop table if exists purchases;
drop table if exists sales;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  product_id text,                 -- بيربط بمنتج جدول products (نفس الـ id بتاعه)
  name text not null,
  arabic_name text not null,
  price numeric not null,
  category text,
  condition text not null default 'new',
  battery_health numeric,
  serial_number text,
  image text,
  images jsonb,
  specs jsonb,
  colors jsonb,
  supplier_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  product_id text,
  name text not null,
  arabic_name text not null,
  price numeric not null,
  category text,
  condition text not null default 'new',
  battery_health numeric,
  serial_number text,
  specs jsonb,
  colors jsonb,
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;

-- نفس سياسة الأمان المفترضة لجدول products: أي مستخدم مسجّل دخول (أدمن اللوحة)
-- له صلاحية كاملة قراءة/إضافة/تعديل/حذف.
drop policy if exists "Authenticated full access" on expenses;
create policy "Authenticated full access" on expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated full access" on purchases;
create policy "Authenticated full access" on purchases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated full access" on sales;
create policy "Authenticated full access" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
