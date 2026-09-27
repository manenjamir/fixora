import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { SimulatedMap } from '@/components/simulated-map';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { STATUS_LABEL, useJobs } from '@/context/job-store';

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getJob } = useJobs();
  const job = getJob(id ?? '');

  if (!job) {
    return (
      <Screen>
        <ThemedText>This job is no longer in this demo session.</ThemedText>
      </Screen>
    );
  }

  const device = getDevice(job.category);
  const moving = job.status === 'dispatched';
  const mapCaption =
    job.status === 'dispatched'
      ? `${job.technician.etaMinutes} min away`
      : job.status === 'accepted'
        ? 'Repair approved — technician is working'
        : job.status === 'inspecting'
          ? 'Free check-up in progress'
          : job.status === 'requested'
            ? 'Waiting for dispatch'
            : STATUS_LABEL[job.status];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">{device.label}</ThemedText>
          <StatusChip status={job.status} />
          <SimulatedMap etaMinutes={job.technician.etaMinutes} moving={moving} caption={mapCaption} />
          <ThemedText themeColor="textSecondary">
            {job.placeTag} · {job.address}
          </ThemedText>
          {job.status === 'quoted' ? (
            <AppButton label="See repair estimate" onPress={() => router.push(`/(customer)/estimate/${job.id}`)} />
          ) : null}
          {job.status === 'warehouse' || job.status === 'out_for_delivery' || job.status === 'delivered' ? (
            <AppButton label="Warehouse status" onPress={() => router.push(`/(customer)/warehouse/${job.id}`)} />
          ) : null}
          {job.status === 'requested' ? (
            <ThemedText themeColor="textSecondary">
              We are looking for a technician to perform your free check-up. 
            </ThemedText>
          ) : null}
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
});
