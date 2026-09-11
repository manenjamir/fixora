import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type DeviceCategoryId =
  | 'phones'
  | 'laptops'
  | 'tvs'
  | 'acs'
  | 'fans'
  | 'refrigerators'
  | 'washing-machines'
  | 'electrical-wiring'
  | 'other';

export type DeviceCategory = {
  id: DeviceCategoryId;
  label: string;
  icon: IconName;
};

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  { id: 'phones', label: 'Phones', icon: 'phone-portrait-outline' },
  { id: 'laptops', label: 'Laptops/PCs', icon: 'laptop-outline' },
  { id: 'tvs', label: 'TVs', icon: 'tv-outline' },
  { id: 'acs', label: 'ACs', icon: 'snow-outline' },
  { id: 'fans', label: 'Fans', icon: 'aperture-outline' },
  { id: 'refrigerators', label: 'Refrigerators', icon: 'cube-outline' },
  { id: 'washing-machines', label: 'Washing Machines', icon: 'water-outline' },
  { id: 'electrical-wiring', label: 'Electrical Wiring', icon: 'flash-outline' },
  { id: 'other', label: 'Other', icon: 'hardware-chip-outline' },
];

export const PLACE_TAGS = [
  'Home',
  'Hostel',
  'PG',
  'Café',
  'Hospital',
  'College',
  'Restaurant',
  'Shop',
] as const;

export type PlaceTag = (typeof PLACE_TAGS)[number];

export function getDevice(id: string): DeviceCategory {
  return DEVICE_CATEGORIES.find((item) => item.id === id) ?? DEVICE_CATEGORIES[8];
}
