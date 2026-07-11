export interface Product {
  id: string;
  name: string;
  arabicName: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  imagesByColor?: Record<string, string>;
  colors: { name: string; hex: string; bgClass: string }[];
  category: string;
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  specs: {
    screen: string;
    processor: string;
    camera: string;
    battery: string;
  };
}

export interface Category {
  id: string;
  name: string;
  arabicName: string;
  subTitle: string;
  image: string;
  useSlice?: boolean;
  sliceIndex?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
}

export interface Guarantee {
  title: string;
  description: string;
  iconName: string;
  color: string;
}
