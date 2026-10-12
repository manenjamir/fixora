import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, MapPin } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LiveMap } from '@/components/live-map';
import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { STATUS_LABEL, useJobs, type JobStatus } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import type { MapPin as GeoPin } from '@/lib/geo';

const STEPS = [
  { title: 'Booking placed', detail: 'We are matching a technician for your free check-up.' },
  { title: 'On the way', detail: 'The technician is traveling to you. Their location updates on the map.' },
  { title: 'Free check-up', detail: 'They inspect the device at your door before any repair.' },
  { title: 'Your decision', detail: 'Review the estimate. You only pay if you choose a repair.' },
];

function stepIndex(status: JobStatus) {
  if (status === 'requested') return 0;
  if (status === 'dispatched') return 1;
  if (status === 'inspecting') return 2;
  return 3;
}

function headline(status: JobStatus, eta?: number) {
  if (status === 'requested') return 'Looking for a technician';
  if (status === 'dispatched') return eta ? `About ${eta} min away` : 'Technician is on the way';
  if (status === 'inspecting') return 'Check-up in progress';
  if (status === 'quoted') return 'Your estimate is ready';
  if (status === 'accepted') return 'Repair approved';
  if (status === 'on_site_repaired') return 'Repaired at your door';
  return STATUS_LABEL[status];
}

function visitWhen(value?: number) {
  if (!value) return { day: 'Flexible visit', time: 'No set time' };
  const date = new Date(value);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return {
    day: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
    time: `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`,
  };
}

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getJob } = useJobs();
  const job = getJob(id ?? '');

  if (!job) {
    return (
      <Screen>
        <ThemedText>This booking is no longer available.</ThemedText>
      </Screen>
    );
  }

  const device = getDevice(job.category);
  const current = stepIndex(job.status);
  const hasTechnician = job.technician.lat != null && job.technician.lng != null;
  const pins: GeoPin[] = [];
  if (job.customerLocation) {
    pins.push({
      id: 'customer',
      latitude: job.customerLocation.lat,
      longitude: job.customerLocation.lng,
      title: 'You',
      kind: 'customer',
    });
  }
  if (hasTechnician) {
    pins.push({
      id: 'technician',
      latitude: job.technician.lat!,
      longitude: job.technician.lng!,
      title: 'Technician',
      kind: 'technician',
    });
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <View style={[styles.hero, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.kicker, { color: theme.textSecondary }]}>{device.label}</Text>
            <Text style={[styles.headline, { color: theme.text }]}>{headline(job.status, job.technician.etaMinutes)}</Text>
            <StatusChip status={job.status} />
            {job.status === 'quoted' ? (
              <AppButton label="See repair estimate" onPress={() => router.push(`/(customer)/estimate/${job.id}`)} />
            ) : null}
            {job.status === 'warehouse' || job.status === 'out_for_delivery' || job.status === 'delivered' ? (
              <AppButton label="Warehouse status" onPress={() => router.push(`/(customer)/warehouse/${job.id}`)} />
            ) : null}
          </View>

          {pins.length > 0 ? (
            <LiveMap pins={pins} caption={job.status === 'dispatched' && hasTechnician ? 'Live location' : 'Your location'} />
          ) : (
            <View style={[styles.waiting, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                The map opens when a technician is on the way.
              </Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Visit</Text>
            <View style={styles.fact}>
              <Clock size={18} color="#64748B" strokeWidth={2} />
              <View style={styles.factCopy}>
                <Text style={[styles.factText, { color: theme.text }]}>{visitWhen(job.preferredAt).day}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>{visitWhen(job.preferredAt).time}</Text>
              </View>
            </View>
            <View style={styles.fact}>
              <MapPin size={18} color="#64748B" strokeWidth={2} />
              <View style={styles.factCopy}>
                <Text style={[styles.factText, { color: theme.text }]}>{job.placeTag}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>{job.address}</Text>
              </View>
            </View>
            {job.deviceBrand ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{job.deviceBrand}</Text> : null}
            {job.customerIssue ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{job.customerIssue}</Text> : null}
          </View>

          <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Progress</Text>
            {STEPS.map((step, index) => {
              const state = index < current ? 'done' : index === current ? 'now' : 'later';
              return (
                <View key={step.title} style={styles.step}>
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.dot,
                        state === 'done' && styles.dotDone,
                        state === 'now' && styles.dotNow,
                        state === 'later' && { backgroundColor: theme.backgroundElement },
                      ]}
                    />
                    {index < STEPS.length - 1 ? <View style={[styles.line, { backgroundColor: theme.backgroundElement }]} /> : null}
                  </View>
                  <View style={[styles.stepCopy, state === 'now' && { backgroundColor: theme.backgroundElement }]}>
                    <Text style={[styles.stepTitle, { color: state === 'later' ? theme.textSecondary : theme.text }]}>
                      {index + 1}. {step.title}
                    </Text>
                    {state === 'now' ? <Text style={[styles.stepDetail, { color: theme.textSecondary }]}>{step.detail}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Content>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  hero: {
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '600',
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  waiting: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  waitingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  factText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  factCopy: {
    flex: 1,
    gap: 2,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  dotDone: {
    backgroundColor: '#15803D',
  },
  dotNow: {
    backgroundColor: '#2563EB',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: 4,
  },
  stepCopy: {
    flex: 1,
    gap: 4,
    marginBottom: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
});
