import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { PreferredTimePicker } from '@/components/preferred-time-picker';
import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';
import { isActiveJob } from '@/lib/job-routes';

export default function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getJob, updateJob } = useJobs();
  const job = getJob(id ?? '');
  const [preferredAt, setPreferredAt] = useState<Date | null>(job?.preferredAt ? new Date(job.preferredAt) : null);
  const [saving, setSaving] = useState(false);

  if (!job || !isActiveJob(job)) {
    return (
      <Screen>
        <ThemedText>This booking can no longer be rescheduled.</ThemedText>
      </Screen>
    );
  }

  async function save() {
    if (!job || !preferredAt) {
      Alert.alert('Choose a time', 'Pick a day and a start time.');
      return;
    }
    setSaving(true);
    try {
      await updateJob(job.id, { preferred_at: preferredAt.toISOString() });
      router.back();
    } catch (error) {
      Alert.alert('Could not reschedule', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Pick a new time</ThemedText>
          <PreferredTimePicker value={preferredAt} onChange={setPreferredAt} />
          <AppButton label={saving ? 'Saving…' : 'Save new time'} disabled={saving} onPress={save} />
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
