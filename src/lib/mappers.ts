import { Product, Category } from '../types';

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
