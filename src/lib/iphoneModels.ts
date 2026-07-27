// Full catalog of iPhone models (X and newer) with their Arabic name and default specs.
// Used by ProductForm to let the admin either pick a ready model (auto-fills the
// English/Arabic name + specs) or type a fully custom name/spec set by hand.

export interface IphoneModel {
  name: string;        // English name
  arabicName: string;  // Arabic name
  specs: {
    screen: string;
    processor: string;
    camera: string;
    battery: string;
  };
}

export const IPHONE_MODELS: IphoneModel[] = [
  {
    name: 'iPhone X',
    arabicName: 'ايفون X',
    specs: { screen: '5.8" Super Retina OLED 60Hz', processor: 'A11 Bionic', battery: '2716mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone XR',
    arabicName: 'ايفون XR',
    specs: { screen: '6.1" Liquid Retina LCD 60Hz', processor: 'A12 Bionic', battery: '2942mAh', camera: '12MP' },
  },
  {
    name: 'iPhone XS',
    arabicName: 'ايفون XS',
    specs: { screen: '5.8" Super Retina OLED 60Hz', processor: 'A12 Bionic', battery: '2658mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone XS Max',
    arabicName: 'ايفون XS ماكس',
    specs: { screen: '6.5" Super Retina OLED 60Hz', processor: 'A12 Bionic', battery: '3174mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 11',
    arabicName: 'ايفون 11',
    specs: { screen: '6.1" Liquid Retina LCD 60Hz', processor: 'A13 Bionic', battery: '3110mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 11 Pro',
    arabicName: 'ايفون 11 برو',
    specs: { screen: '5.8" Super Retina XDR OLED 60Hz', processor: 'A13 Bionic', battery: '3046mAh', camera: '12MP + 12MP + 12MP' },
  },
  {
    name: 'iPhone 11 Pro Max',
    arabicName: 'ايفون 11 برو ماكس',
    specs: { screen: '6.5" Super Retina XDR OLED 60Hz', processor: 'A13 Bionic', battery: '3969mAh', camera: '12MP + 12MP + 12MP' },
  },
  {
    name: 'iPhone SE (2nd generation)',
    arabicName: 'ايفون SE (الجيل الثاني)',
    specs: { screen: '4.7" Retina IPS LCD 60Hz', processor: 'A13 Bionic', battery: '1821mAh', camera: '12MP' },
  },
  {
    name: 'iPhone 12 mini',
    arabicName: 'ايفون 12 ميني',
    specs: { screen: '5.4" Super Retina XDR OLED 60Hz', processor: 'A14 Bionic', battery: '2227mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 12',
    arabicName: 'ايفون 12',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A14 Bionic', battery: '2815mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 12 Pro',
    arabicName: 'ايفون 12 برو',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A14 Bionic', battery: '2815mAh', camera: '12MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 12 Pro Max',
    arabicName: 'ايفون 12 برو ماكس',
    specs: { screen: '6.7" Super Retina XDR OLED 60Hz', processor: 'A14 Bionic', battery: '3687mAh', camera: '12MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 13 mini',
    arabicName: 'ايفون 13 ميني',
    specs: { screen: '5.4" Super Retina XDR OLED 60Hz', processor: 'A15 Bionic', battery: '2438mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 13',
    arabicName: 'ايفون 13',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A15 Bionic', battery: '3240mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 13 Pro',
    arabicName: 'ايفون 13 برو',
    specs: { screen: '6.1" Super Retina XDR OLED 120Hz', processor: 'A15 Bionic', battery: '3095mAh', camera: '12MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 13 Pro Max',
    arabicName: 'ايفون 13 برو ماكس',
    specs: { screen: '6.7" Super Retina XDR OLED 120Hz', processor: 'A15 Bionic', battery: '4352mAh', camera: '12MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone SE (3rd generation)',
    arabicName: 'ايفون SE (الجيل الثالث)',
    specs: { screen: '4.7" Retina IPS LCD 60Hz', processor: 'A15 Bionic', battery: '2018mAh', camera: '12MP' },
  },
  {
    name: 'iPhone 14',
    arabicName: 'ايفون 14',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A15 Bionic', battery: '3279mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 14 Plus',
    arabicName: 'ايفون 14 بلس',
    specs: { screen: '6.7" Super Retina XDR OLED 60Hz', processor: 'A15 Bionic', battery: '4325mAh', camera: '12MP + 12MP' },
  },
  {
    name: 'iPhone 14 Pro',
    arabicName: 'ايفون 14 برو',
    specs: { screen: '6.1" LTPO Super Retina XDR OLED 120Hz', processor: 'A16 Bionic', battery: '3200mAh', camera: '48MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 14 Pro Max',
    arabicName: 'ايفون 14 برو ماكس',
    specs: { screen: '6.7" LTPO Super Retina XDR OLED 120Hz', processor: 'A16 Bionic', battery: '4323mAh', camera: '48MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 15',
    arabicName: 'ايفون 15',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A16 Bionic', battery: '3349mAh', camera: '48MP + 12MP' },
  },
  {
    name: 'iPhone 15 Plus',
    arabicName: 'ايفون 15 بلس',
    specs: { screen: '6.7" Super Retina XDR OLED 60Hz', processor: 'A16 Bionic', battery: '4383mAh', camera: '48MP + 12MP' },
  },
  {
    name: 'iPhone 15 Pro',
    arabicName: 'ايفون 15 برو',
    specs: { screen: '6.1" LTPO Super Retina XDR OLED 120Hz', processor: 'A17 Pro', battery: '3274mAh', camera: '48MP + 12MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 15 Pro Max',
    arabicName: 'ايفون 15 برو ماكس',
    specs: { screen: '6.7" LTPO Super Retina XDR OLED 120Hz', processor: 'A17 Pro', battery: '4441mAh', camera: '48MP + 12MP (5x) + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 16e',
    arabicName: 'ايفون 16e',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A18', battery: '4005mAh', camera: '48MP' },
  },
  {
    name: 'iPhone 16',
    arabicName: 'ايفون 16',
    specs: { screen: '6.1" Super Retina XDR OLED 60Hz', processor: 'A18', battery: '3561mAh', camera: '48MP + 12MP' },
  },
  {
    name: 'iPhone 16 Plus',
    arabicName: 'ايفون 16 بلس',
    specs: { screen: '6.7" Super Retina XDR OLED 60Hz', processor: 'A18', battery: '4674mAh', camera: '48MP + 12MP' },
  },
  {
    name: 'iPhone 16 Pro',
    arabicName: 'ايفون 16 برو',
    specs: { screen: '6.3" LTPO Super Retina XDR OLED 120Hz', processor: 'A18 Pro', battery: '3582mAh', camera: '48MP + 48MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 16 Pro Max',
    arabicName: 'ايفون 16 برو ماكس',
    specs: { screen: '6.9" LTPO Super Retina XDR OLED 120Hz', processor: 'A18 Pro', battery: '4685mAh', camera: '48MP + 48MP + 12MP + LiDAR' },
  },
  {
    name: 'iPhone 17',
    arabicName: 'ايفون 17',
    specs: { screen: '6.3" Super Retina XDR OLED 120Hz', processor: 'A19', battery: '3600mAh (تقريبًا)', camera: '48MP + 12MP' },
  },
  {
    name: 'iPhone 17 Air',
    arabicName: 'ايفون 17 اير',
    specs: { screen: '6.7" Super Retina XDR OLED 120Hz', processor: 'A19', battery: '3800mAh (تقريبًا)', camera: '48MP' },
  },
  {
    name: 'iPhone 17 Pro',
    arabicName: 'ايفون 17 برو',
    specs: { screen: '6.3" LTPO Super Retina XDR OLED 120Hz', processor: 'A19 Pro', battery: '3900mAh (تقريبًا)', camera: '48MP + 48MP + 48MP + LiDAR' },
  },
  {
    name: 'iPhone 17 Pro Max',
    arabicName: 'ايفون 17 برو ماكس',
    specs: { screen: '6.9" LTPO Super Retina XDR OLED 120Hz', processor: 'A19 Pro', battery: '5000mAh (تقريبًا)', camera: '48MP + 48MP + 48MP + LiDAR' },
  },
];
