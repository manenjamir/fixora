import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { LiveMap } from '@/components/live-map';
import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs, type Job } from '@/context/job-store';
import type { MapPin } from '@/lib/geo';

export default function WarehouseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJob, markDelivered } = useJobs();
  const job = getJob(id ?? '');

  if (!job) {
    return (
      <Screen>
        <ThemedText>Job not found in this session.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Warehouse</ThemedText>
          <StatusChip status={job.status} />
          {job.status === 'delivered' ? (
            <ThemedText>
              Your device has been delivered. Thanks for using Fixora — we hope everything works great!
            </ThemedText>
          ) : job.status === 'out_for_delivery' ? (
            <>
              <ThemedText>
                Your device is on its way back to your home. Pickup and return delivery are free.
              </ThemedText>
              <LiveMap
                pins={deliveryPins(job)}
                caption={
                  job.technician.lat != null && job.technician.etaMinutes
                    ? `On the way · about ${job.technician.etaMinutes} min`
                    : 'Waiting for a live location'
                }
              />
              <AppButton
                label="I received my device"
                onPress={() => markDelivered(job.id)}
              />
            </>
          ) : (
            <>
              <ThemedText>
                Your device is currently in our warehouse. Our technicians are working on it and will ship it back
                when the repair is complete.
              </ThemedText>
              <ThemedText type="smallBold">Estimated completion: {job.estimatedCompletion}</ThemedText>
            </>
          )}
        </Content>
      </ScrollView>
    </Screen>
  );
}

function deliveryPins(job: Job): MapPin[] {
  const pins: MapPin[] = [];
  if (job.customerLocation) {
    pins.push({
      id: 'customer',
      latitude: job.customerLocation.lat,
      longitude: job.customerLocation.lng,
      title: 'You',
      kind: 'customer',
    });
  }
  if (job.technician.lat != null && job.technician.lng != null) {
    pins.push({
      id: 'technician',
      latitude: job.technician.lat,
      longitude: job.technician.lng,
      title: 'Technician',
      kind: 'technician',
    });
  }
  return pins;
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
