import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { STATUS_LABEL, type Job, type JobStatus } from '@/context/job-store';
import { getDevice } from '@/constants/devices';
import { useTheme } from '@/hooks/use-theme';

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
  const bottomPad =
    Platform.OS === 'web' ? Spacing.three : insets.bottom + BottomTabInset + Spacing.three;

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

export function Content({ children, style }: ViewProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? theme.accent
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.backgroundElement
          : 'transparent';
  const color = variant === 'primary' || variant === 'danger' ? '#ffffff' : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...rest}>
      <ThemedText style={{ color, fontWeight: 700 }}>{label}</ThemedText>
    </Pressable>
  );
}

export function StatusChip({ status }: { status: JobStatus }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{STATUS_LABEL[status]}</ThemedText>
    </View>
  );
}

export function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  const theme = useTheme();
  const device = getDevice(job.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${device.label} job`}
      onPress={onPress}
      style={({ pressed }) => [styles.jobRow, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.jobIcon, { backgroundColor: theme.background }]}>
        <Ionicons name={device.icon} size={22} color={theme.accent} />
      </View>
      <View style={styles.jobCopy}>
        <ThemedText type="smallBold">{device.label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {job.placeTag} · {job.address}
        </ThemedText>
        <StatusChip status={job.status} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
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
    flexGrow: 1,
    gap: Spacing.three,
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobCopy: {
    flex: 1,
    gap: 2,
  },
});
