import { LinearGradient } from 'expo-linear-gradient';
import {
  AirVent,
  Cable,
  ChevronRight,
  Cpu,
  House,
  Laptop,
  MapPin,
  Microwave,
  Refrigerator,
  Smartphone,
  Tablet,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { STATUS_LABEL, type Job, type JobStatus } from '@/context/job-store';
import { getDevice } from '@/constants/devices';

cssInterop(LinearGradient, { className: 'style' });

const STATUS_TONE: Record<JobStatus, { wrap: string; dot: string; text: string }> = {
  requested: {
    wrap: 'bg-slate-100 dark:bg-slate-800',
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
  },
  dispatched: {
    wrap: 'bg-sky-50 dark:bg-sky-950',
    dot: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
  },
  inspecting: {
    wrap: 'bg-amber-50 dark:bg-amber-950',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  quoted: {
    wrap: 'bg-violet-50 dark:bg-violet-950',
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
  },
  accepted: {
    wrap: 'bg-emerald-50 dark:bg-emerald-950',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  declined_by_customer: {
    wrap: 'bg-rose-50 dark:bg-rose-950',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
  },
  declined_by_technician: {
    wrap: 'bg-rose-50 dark:bg-rose-950',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
  },
  on_site_repaired: {
    wrap: 'bg-emerald-50 dark:bg-emerald-950',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  warehouse: {
    wrap: 'bg-orange-50 dark:bg-orange-950',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
  },
  out_for_delivery: {
    wrap: 'bg-sky-50 dark:bg-sky-950',
    dot: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
  },
  delivered: {
    wrap: 'bg-emerald-50 dark:bg-emerald-950',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
};

function categoryIcon(id: string): LucideIcon {
  switch (id) {
    case 'phones':
      return Smartphone;
    case 'laptops':
      return Laptop;
    case 'tablets':
      return Tablet;
    case 'refrigerators':
      return Refrigerator;
    case 'washing-machines':
      return WashingMachine;
    case 'acs':
      return AirVent;
    case 'microwaves':
      return Microwave;
    case 'other-appliances':
      return House;
    case 'electrical-equipment':
      return Zap;
    case 'electrical-wiring':
      return Cable;
    case 'other-electrical':
      return Wrench;
    default:
      return Cpu;
  }
}

export function Screen({ children, style, padded = true, ...rest }: ViewProps & { padded?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView
      style={[
        styles.screen,
        padded && {
          paddingTop: insets.top + Spacing.three,
          paddingHorizontal: Spacing.three,
          paddingBottom: insets.bottom + Spacing.three,
        },
        style,
      ]}
      {...rest}>
      {children}
    </ThemedView>
  );
}

export function TabScreen({ children, style, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Spacing.six + Spacing.five : insets.top + Spacing.three;
  const bottomPad = Platform.OS === 'web' ? BottomTabInset + Spacing.two : Spacing.two;

  return (
    <ThemedView
      style={[
        styles.screen,
        {
          paddingTop: topPad,
          paddingHorizontal: Spacing.three,
          paddingBottom: bottomPad,
        },
        style,
      ]}
      {...rest}>
      {children}
    </ThemedView>
  );
}

export function TabScrollView({ children, contentContainerStyle, ...rest }: ScrollViewProps) {
  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={[styles.tabScrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function Content({ children, style }: ViewProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  busy?: boolean;
};

export function AppButton({ label, variant = 'primary', disabled, style, busy, ...rest }: ButtonProps) {
  const inactive = disabled || busy;
  const text = busy ? 'Please wait…' : label;

  if (variant === 'secondary' || variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={inactive}
        className={`min-h-12 items-center justify-center rounded-xl px-6 active:scale-95 ${
          variant === 'secondary' ? 'border border-slate-200/60 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-800' : 'bg-transparent'
        } ${inactive ? 'opacity-50' : ''}`}
        style={style}
        {...rest}>
        <Text className="text-sm font-bold text-slate-900 dark:text-white">{text}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      className={`overflow-hidden rounded-xl active:scale-95 ${inactive ? 'opacity-50' : ''}`}
      style={style}
      {...rest}>
      <LinearGradient
        colors={variant === 'danger' ? ['#DC2626', '#F87171'] : ['#1D4ED8', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="min-h-12 items-center justify-center px-6">
        <Text className="text-sm font-bold text-white">{text}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function StatusChip({ status }: { status: JobStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <View className={`mt-1 flex-row items-center gap-1.5 self-start rounded-full px-3 py-1 ${tone.wrap}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      <Text className={`text-xs font-medium ${tone.text}`}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  const device = getDevice(job.category);
  const Icon = categoryIcon(job.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${device.label} job`}
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 active:scale-95 dark:border-slate-800/80 dark:bg-slate-900">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Icon size={20} color="#2563EB" strokeWidth={2} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-slate-900 dark:text-white">{device.label}</Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color="#64748B" strokeWidth={2} />
          <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
            {job.placeTag} · {job.address}
          </Text>
        </View>
        <StatusChip status={job.status} />
      </View>
      <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    paddingBottom: Spacing.three,
  },
});
