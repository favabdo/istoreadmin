-- شغّل السكريبت ده مرة واحدة في Supabase SQL Editor.
-- بيضيف عمود is_sold لجدول products الموجود بالفعل، عشان نقدر نعلّم الجهاز
-- إنه "مباع" من غير ما نمسحه من المتجر (بيفضل ظاهر للعميل بس بلون رمادي).

alter table products add column if not exists is_sold boolean not null default false;
