import type { DeviceCategoryId } from '@/constants/devices';

export const OTHER_BRAND = 'Other';

const BRANDS_BY_CATEGORY: Record<DeviceCategoryId, string[]> = {
  phones: ['Samsung', 'Apple', 'OnePlus', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Motorola', OTHER_BRAND],
  laptops: ['HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI', OTHER_BRAND],
  tablets: ['Samsung', 'Apple', 'Lenovo', 'Xiaomi', 'Realme', 'OnePlus', OTHER_BRAND],
  'other-electronics': ['Sony', 'JBL', 'Boat', 'Canon', 'Generic', OTHER_BRAND],
  refrigerators: ['LG', 'Samsung', 'Whirlpool', 'Godrej', 'Haier', 'Voltas', OTHER_BRAND],
  'washing-machines': ['LG', 'Samsung', 'Whirlpool', 'IFB', 'Bosch', 'Godrej', OTHER_BRAND],
  acs: ['Voltas', 'LG', 'Samsung', 'Daikin', 'Blue Star', 'Hitachi', 'Carrier', OTHER_BRAND],
  microwaves: ['LG', 'Samsung', 'IFB', 'Panasonic', 'Bajaj', 'Morphy Richards', OTHER_BRAND],
  'other-appliances': ['Philips', 'Prestige', 'Bajaj', 'Usha', 'Generic', OTHER_BRAND],
  'electrical-equipment': ['Havells', 'Legrand', 'Schneider', 'Anchor', 'Generic', OTHER_BRAND],
  'electrical-wiring': ['Polycab', 'Finolex', 'Havells', 'Anchor', 'Generic', OTHER_BRAND],
  'other-electrical': ['Havells', 'Legrand', 'Generic', OTHER_BRAND],
  tvs: ['Samsung', 'LG', 'Sony', 'Mi', 'OnePlus', 'Vu', OTHER_BRAND],
  fans: ['Crompton', 'Havells', 'Usha', 'Orient', 'Bajaj', OTHER_BRAND],
  other: ['Generic', OTHER_BRAND],
};

export function getBrandsForCategory(categoryId: DeviceCategoryId): string[] {
  return BRANDS_BY_CATEGORY[categoryId] ?? BRANDS_BY_CATEGORY.other;
}
