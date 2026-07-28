import { Product, Category, Purchase, Expense, Sale } from '../types';

export function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    arabicName: row.arabic_name,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    image: row.image,
    images: row.images ?? undefined,
    imagesByColor: row.images_by_color ?? undefined,
    colors: row.colors ?? [],
    category: row.category,
    rating: row.rating != null ? Number(row.rating) : 5,
    reviewsCount: row.reviews_count ?? 0,
    isNew: row.is_new ?? false,
    condition: row.condition === 'used' ? 'used' : 'new',
    batteryHealth: row.battery_health != null ? Number(row.battery_health) : undefined,
    serialNumber: row.serial_number ?? undefined,
    specs: row.specs ?? { screen: '', processor: '', camera: '', battery: '' },
  };
}

export function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    arabic_name: p.arabicName,
    price: p.price,
    original_price: p.originalPrice ?? null,
    image: p.image,
    images: p.images ?? null,
    images_by_color: p.imagesByColor ?? null,
    colors: p.colors,
    category: p.category,
    rating: p.rating,
    reviews_count: p.reviewsCount,
    is_new: p.isNew ?? false,
    condition: p.condition === 'used' ? 'used' : 'new',
    battery_health: p.batteryHealth ?? null,
    serial_number: p.serialNumber?.trim() || null,
    specs: p.specs,
  };
}

export function mapCategoryRow(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    arabicName: row.arabic_name,
    subTitle: row.sub_title,
    image: row.image,
  };
}

export function categoryToRow(c: Category, sortOrder = 0) {
  return {
    id: c.id,
    name: c.name,
    arabic_name: c.arabicName,
    sub_title: c.subTitle,
    image: c.image,
    sort_order: sortOrder,
  };
}

// Turns an Arabic/English product name into a URL-safe slug used as the row id.
export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// متابعة المخزون: مشتريات / مصروفات / مبيعات
// ---------------------------------------------------------------------------

export function mapPurchaseRow(row: any): Purchase {
  return {
    id: row.id,
    date: row.date,
    itemName: row.item_name,
    supplierName: row.supplier_name ?? undefined,
    quantity: Number(row.quantity),
    unitCost: Number(row.unit_cost),
    notes: row.notes ?? undefined,
  };
}

export function purchaseToRow(p: Omit<Purchase, 'id'> & { id?: string }) {
  return {
    date: p.date,
    item_name: p.itemName,
    supplier_name: p.supplierName?.trim() || null,
    quantity: p.quantity,
    unit_cost: p.unitCost,
    notes: p.notes?.trim() || null,
  };
}

export function mapExpenseRow(row: any): Expense {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    amount: Number(row.amount),
    notes: row.notes ?? undefined,
  };
}

export function expenseToRow(e: Omit<Expense, 'id'> & { id?: string }) {
  return {
    date: e.date,
    title: e.title,
    amount: e.amount,
    notes: e.notes?.trim() || null,
  };
}

export function mapSaleRow(row: any): Sale {
  return {
    id: row.id,
    date: row.date,
    itemName: row.item_name,
    customerName: row.customer_name ?? undefined,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    notes: row.notes ?? undefined,
  };
}

export function saleToRow(s: Omit<Sale, 'id'> & { id?: string }) {
  return {
    date: s.date,
    item_name: s.itemName,
    customer_name: s.customerName?.trim() || null,
    quantity: s.quantity,
    unit_price: s.unitPrice,
    notes: s.notes?.trim() || null,
  };
}
