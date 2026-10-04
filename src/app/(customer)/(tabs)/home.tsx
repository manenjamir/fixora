import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AirVent,
  Cable,
  Clock,
  Cpu,
  House,
  Laptop,
  MapPin,
  Microwave,
  Refrigerator,
  ShieldCheck,
  Smartphone,
  Tablet,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useCallback, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEVICE_GROUPS, type DeviceCategoryId } from '@/constants/devices';
import { Spacing } from '@/constants/theme';

cssInterop(LinearGradient, { className: 'style' });

const DEVICE_ICONS: Record<DeviceCategoryId, LucideIcon> = {
  phones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  'other-electronics': Cpu,
  refrigerators: Refrigerator,
  'washing-machines': WashingMachine,
  acs: AirVent,
  microwaves: Microwave,
  'other-appliances': House,
  'electrical-equipment': Zap,
  'electrical-wiring': Cable,
  'other-electrical': Wrench,
  tvs: Cpu,
  fans: AirVent,
  other: Cpu,
};

export default function CustomerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['46%'], []);
  const topPad = Platform.OS === 'web' ? 96 : insets.top + 16;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: topPad }}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-3xl gap-4">
          <View className="gap-1">
            <Text className="text-xs font-medium text-slate-500">Doorstep repair</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">What needs a check-up?</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => sheetRef.current?.present()}
            className="overflow-hidden rounded-2xl active:scale-95">
            <LinearGradient
              colors={['#1D4ED8', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="gap-2 p-4">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text className="text-xl font-bold text-white">Free Doorstep Check-up</Text>
              </View>
              <Text className="text-sm font-medium text-white/90">You only pay if you repair. Decline costs ₹0.</Text>
              <Text className="text-xs font-medium text-white/80">See how a visit works</Text>
            </LinearGradient>
          </Pressable>

          {DEVICE_GROUPS.map((group) => (
            <View key={group.id} className="gap-2">
              <Text className="text-sm font-medium text-slate-900 dark:text-white">{group.label}</Text>
              <View className="flex-row flex-wrap gap-3">
                {group.devices.map((device) => {
                  const Icon = DEVICE_ICONS[device.id];
                  return (
                    <Pressable
                      key={device.id}
                      accessibilityRole="button"
                      accessibilityLabel={device.label}
                      onPress={() => router.push(`/(customer)/book/${device.id}`)}
                      className="min-h-[120px] w-[47%] min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/60 bg-white p-4 active:scale-95 dark:border-slate-800/80 dark:bg-slate-900">
                      <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                        <Icon size={22} color="#2563EB" strokeWidth={2} />
                      </View>
                      <Text className="text-center text-sm font-medium text-slate-900 dark:text-white">{device.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#ffffff' }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E1' }}>
        <BottomSheetView>
          <View className="gap-4 px-4 pb-8">
          <Text className="text-xl font-bold text-slate-900">How a visit works</Text>
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
            <Clock size={18} color="#2563EB" strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-900">A technician comes to you</Text>
              <Text className="text-xs text-slate-500">The check-up at your door is free.</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
            <MapPin size={18} color="#2563EB" strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-900">On-site or warehouse</Text>
              <Text className="text-xs text-slate-500">The quote shows where the repair happens before you accept.</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
            <ShieldCheck size={18} color="#2563EB" strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-900">Pay only if you repair</Text>
              <Text className="text-xs text-slate-500">Declining the estimate costs ₹0.</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => sheetRef.current?.dismiss()}
            className="overflow-hidden rounded-xl active:scale-95">
            <LinearGradient colors={['#1D4ED8', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="min-h-12 items-center justify-center px-6">
              <Text className="text-sm font-bold text-white">Got it</Text>
            </LinearGradient>
          </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
