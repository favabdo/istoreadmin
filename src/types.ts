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

interface DeviceSpecs {
  screen: string;
  processor: string;
  camera: string;
  battery: string;
}

interface DeviceColor {
  name: string;
  hex: string;
}

export interface Purchase {
  id: string;
  date: string;
  productId?: string;
  name: string;
  arabicName: string;
  price: number;
  category: string;
  condition: 'new' | 'used';
  batteryHealth?: number;
  serialNumber?: string;
  image?: string;
  images?: string[];
  specs: DeviceSpecs;
  colors: DeviceColor[];
  supplierName?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  amount: number;
  notes?: string;
}

export interface Sale {
  id: string;
  date: string;
  productId?: string;
  name: string;
  arabicName: string;
  price: number;
  category: string;
  condition: 'new' | 'used';
  batteryHealth?: number;
  serialNumber?: string;
  specs: DeviceSpecs;
  colors: DeviceColor[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}
