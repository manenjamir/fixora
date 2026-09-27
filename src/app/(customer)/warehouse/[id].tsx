import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';

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

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
