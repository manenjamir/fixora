import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { JobMediaPreview } from '@/components/job-media-preview';
import { Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { formatRupees, REPAIR_LOCATION_COPY, TIER_COPY, useJobs } from '@/context/job-store';

function formatWhen(value?: number) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PastRepairScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJob } = useJobs();
  const job = getJob(id ?? '');

  if (!job) {
    return (
      <Screen>
        <ThemedText>This booking is not available in this session.</ThemedText>
      </Screen>
    );
  }

  const device = getDevice(job.category);
  const tier = job.chosenTier ? TIER_COPY[job.chosenTier] : undefined;
  const charged = job.chosenTier && job.tiers ? job.tiers[job.chosenTier] : undefined;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">{device.label}</ThemedText>
          <StatusChip status={job.status} />

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Repair date and time
            </ThemedText>
            <ThemedText type="smallBold">{formatWhen(job.completedAt ?? job.updatedAt)}</ThemedText>
          </View>

          {job.deviceBrand ? (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                Device brand
              </ThemedText>
              <ThemedText type="smallBold">{job.deviceBrand}</ThemedText>
            </View>
          ) : null}
          {job.customerIssue ? (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                Reported issue
              </ThemedText>
              <ThemedText type="smallBold">{job.customerIssue}</ThemedText>
            </View>
          ) : null}

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Repair location
            </ThemedText>
            <ThemedText type="smallBold">
              {job.repairLocation ? REPAIR_LOCATION_COPY[job.repairLocation] : 'Not recorded'}
            </ThemedText>
          </View>

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Parts / service tier
            </ThemedText>
            <ThemedText type="smallBold">{tier ? `${tier.title} · ${tier.warranty}` : 'No tier selected'}</ThemedText>
          </View>

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Final repair cost
            </ThemedText>
            <ThemedText type="smallBold">{charged != null ? formatRupees(charged) : '₹0'}</ThemedText>
          </View>

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Service address
            </ThemedText>
            <ThemedText type="smallBold">
              {job.placeTag} · {job.address}
            </ThemedText>
          </View>

          <ThemedText type="smallBold">Job media</ThemedText>
          {job.mediaUri ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Customer photo
              </ThemedText>
              <JobMediaPreview uri={job.mediaUri} mediaType={job.mediaType} />
            </>
          ) : (
            <ThemedText themeColor="textSecondary">No customer photo was attached.</ThemedText>
          )}
          {job.completionMediaUri ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Completion photo
              </ThemedText>
              <JobMediaPreview uri={job.completionMediaUri} mediaType={job.completionMediaType} />
            </>
          ) : (
            <ThemedText themeColor="textSecondary">No completion photo was attached.</ThemedText>
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
  block: {
    gap: Spacing.one,
  },
});
