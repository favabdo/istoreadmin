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
  condition?: 'new' | 'used';
  batteryHealth?: number;
  /** Admin-only: this device's physical serial number, used to generate a QR code
   *  for later invoice scanning. Never sent to / rendered by the storefront app. */
  serialNumber?: string;
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
