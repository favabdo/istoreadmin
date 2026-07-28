-- شغّل السكريبت ده مرة واحدة في Supabase SQL Editor قبل استخدام قسم "متابعة المخزون"

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  item_name text not null,
  supplier_name text,
  quantity numeric not null,
  unit_cost numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  item_name text not null,
  customer_name text,
  quantity numeric not null,
  unit_price numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table purchases enable row level security;
alter table expenses enable row level security;
alter table sales enable row level security;

-- نفس سياسة الأمان المفترضة لجداول products/categories: أي مستخدم مسجّل دخول
-- (يعني أدمن اللوحة) له صلاحية كاملة قراءة/إضافة/تعديل/حذف.
create policy "Authenticated full access" on purchases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated full access" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
