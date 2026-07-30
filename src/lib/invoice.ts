import { Sale } from '../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function invoiceNumber(sale: Sale): string {
  if (sale.id) return sale.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `TMP${Date.now().toString(36).toUpperCase()}`;
}

export function printSaleInvoice(sale: Sale, categoryLabel: string) {
  const win = window.open('', '_blank', 'width=850,height=1100');
  if (!win) return;

  const conditionLabel = sale.condition === 'used' ? 'مستعمل' : 'جديد';
  const batteryRow = sale.batteryHealth != null
    ? `<tr><td>حالة البطارية</td><td>${sale.batteryHealth}%</td></tr>`
    : '';
  const serialRow = sale.serialNumber
    ? `<tr><td>الرقم التسلسلي</td><td dir="ltr" style="font-family: monospace;">${escapeHtml(sale.serialNumber)}</td></tr>`
    : '';
  const specsRows = [
    sale.specs?.screen ? `<tr><td>الشاشة</td><td>${escapeHtml(sale.specs.screen)}</td></tr>` : '',
    sale.specs?.processor ? `<tr><td>المعالج</td><td>${escapeHtml(sale.specs.processor)}</td></tr>` : '',
    sale.specs?.camera ? `<tr><td>الكاميرا</td><td>${escapeHtml(sale.specs.camera)}</td></tr>` : '',
    sale.specs?.battery ? `<tr><td>البطارية</td><td>${escapeHtml(sale.specs.battery)}</td></tr>` : '',
  ].join('');
  const colorsRow = sale.colors?.length
    ? `<tr><td>اللون</td><td>${escapeHtml(sale.colors.map(c => c.name).join('، '))}</td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>فاتورة بيع #${invoiceNumber(sale)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #c09d53; padding-bottom: 20px; margin-bottom: 28px; }
  .brand { font-size: 26px; font-weight: 800; color: #c09d53; }
  .brand-sub { font-size: 12px; font-weight: 700; color: #94a3b8; margin-top: 2px; }
  .invoice-meta { text-align: left; font-size: 12px; font-weight: 700; color: #64748b; line-height: 1.9; }
  .invoice-meta b { color: #1e293b; }
  .section-title { font-size: 13px; font-weight: 800; color: #475569; margin: 22px 0 8px; }
  .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
  table.info { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.info td { padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
  table.info td:first-child { color: #94a3b8; font-weight: 700; width: 40%; }
  table.info td:last-child { font-weight: 800; color: #1e293b; }
  table.info tr:last-child td { border-bottom: none; }
  .total-box { margin-top: 26px; display: flex; justify-content: flex-end; }
  .total-inner { background: #c09d53; color: #fff; border-radius: 14px; padding: 16px 28px; text-align: center; min-width: 220px; }
  .total-inner .label { font-size: 12px; font-weight: 700; opacity: 0.85; }
  .total-inner .amount { font-size: 26px; font-weight: 800; margin-top: 4px; }
  .footer { margin-top: 50px; text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">TecStore</div>
      <div class="brand-sub">فاتورة بيع رسمية</div>
    </div>
    <div class="invoice-meta">
      <div>رقم الفاتورة: <b>#${invoiceNumber(sale)}</b></div>
      <div>التاريخ: <b>${escapeHtml(sale.date)}</b></div>
    </div>
  </div>

  <div class="section-title">بيانات العميل</div>
  <div class="box">
    <table class="info">
      <tr><td>الاسم</td><td>${sale.customerName ? escapeHtml(sale.customerName) : '—'}</td></tr>
      <tr><td>رقم التليفون</td><td dir="ltr">${sale.customerPhone ? escapeHtml(sale.customerPhone) : '—'}</td></tr>
    </table>
  </div>

  <div class="section-title">بيانات الجهاز</div>
  <div class="box">
    <table class="info">
      <tr><td>الصنف</td><td>${escapeHtml(sale.arabicName)} (${escapeHtml(sale.name)})</td></tr>
      <tr><td>القسم</td><td>${escapeHtml(categoryLabel)}</td></tr>
      <tr><td>الحالة</td><td>${conditionLabel}</td></tr>
      ${batteryRow}
      ${serialRow}
      ${colorsRow}
      ${specsRows}
    </table>
  </div>

  ${sale.notes ? `<div class="section-title">ملاحظات</div><div class="box">${escapeHtml(sale.notes)}</div>` : ''}

  <div class="total-box">
    <div class="total-inner">
      <div class="label">الإجمالي المدفوع</div>
      <div class="amount">${sale.price.toLocaleString('ar-EG')} ج.م</div>
    </div>
  </div>

  <div class="footer">شكرًا لثقتك في TecStore — هذه الفاتورة صادرة إلكترونيًا ولا تحتاج توقيع.</div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => { win.focus(); win.print(); }, 450);
  };
}
