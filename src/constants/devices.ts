import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type DeviceGroupId = 'electronics' | 'appliances' | 'installation';

export type DeviceCategoryId =
  | 'phones'
  | 'laptops'
  | 'tablets'
  | 'other-electronics'
  | 'refrigerators'
  | 'washing-machines'
  | 'acs'
  | 'microwaves'
  | 'other-appliances'
  | 'electrical-equipment'
  | 'electrical-wiring'
  | 'other-electrical'
  | 'tvs'
  | 'fans'
  | 'other';

export type DeviceCategory = {
  id: DeviceCategoryId;
  label: string;
  icon: IconName;
  group: DeviceGroupId;
};

export type DeviceGroup = {
  id: DeviceGroupId;
  label: string;
  devices: DeviceCategory[];
};

export const DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'electronics',
    label: 'Electronic Devices',
    devices: [
      { id: 'phones', label: 'Smartphones', icon: 'phone-portrait-outline', group: 'electronics' },
      { id: 'laptops', label: 'PCs/Laptops', icon: 'laptop-outline', group: 'electronics' },
      { id: 'tablets', label: 'Tablets', icon: 'tablet-portrait-outline', group: 'electronics' },
      { id: 'other-electronics', label: 'Other electronic devices', icon: 'hardware-chip-outline', group: 'electronics' },
    ],
  },
  {
    id: 'appliances',
    label: 'Electrical Appliances',
    devices: [
      { id: 'refrigerators', label: 'Refrigerators', icon: 'cube-outline', group: 'appliances' },
      { id: 'washing-machines', label: 'Washing machines', icon: 'water-outline', group: 'appliances' },
      { id: 'acs', label: 'Air conditioners', icon: 'snow-outline', group: 'appliances' },
      { id: 'microwaves', label: 'Microwaves', icon: 'radio-outline', group: 'appliances' },
      { id: 'other-appliances', label: 'Other household appliances', icon: 'home-outline', group: 'appliances' },
    ],
  },
  {
    id: 'installation',
    label: 'Electrical installation services',
    devices: [
      { id: 'electrical-equipment', label: 'Electrical equipment', icon: 'flash-outline', group: 'installation' },
      { id: 'electrical-wiring', label: 'Wiring-related devices', icon: 'git-network-outline', group: 'installation' },
      { id: 'other-electrical', label: 'Other electrical systems', icon: 'construct-outline', group: 'installation' },
    ],
  },
];

const LEGACY_DEVICES: DeviceCategory[] = [
  { id: 'tvs', label: 'TVs', icon: 'tv-outline', group: 'electronics' },
  { id: 'fans', label: 'Fans', icon: 'aperture-outline', group: 'appliances' },
  { id: 'other', label: 'Other', icon: 'hardware-chip-outline', group: 'electronics' },
];

const ALL_DEVICES: DeviceCategory[] = [...DEVICE_GROUPS.flatMap((group) => group.devices), ...LEGACY_DEVICES];

export const DEVICE_CATEGORIES: DeviceCategory[] = DEVICE_GROUPS.flatMap((group) => group.devices);

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
  return ALL_DEVICES.find((item) => item.id === id) ?? LEGACY_DEVICES[2];
}

export function groupForCategory(id: string): DeviceGroupId {
  return getDevice(id).group;
}

export function groupLabel(id: DeviceGroupId) {
  return DEVICE_GROUPS.find((group) => group.id === id)?.label ?? id;
}
