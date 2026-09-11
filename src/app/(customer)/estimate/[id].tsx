import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatRupees, TIER_COPY, useJobs, type RepairTier } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function EstimateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getJob, chooseTier, declineRepair } = useJobs();
  const job = getJob(id ?? '');

  if (!job || !job.tiers) {
    return (
      <Screen>
        <ThemedText>Estimate is not ready yet. Wait for the technician to send prices.</ThemedText>
      </Screen>
    );
  }

  const selectedJob = job;
  const tiers: RepairTier[] = ['a1', 'a2', 'a3'];

  function accept(tier: RepairTier) {
    chooseTier(selectedJob.id, tier);
    router.replace(`/(customer)/track/${selectedJob.id}`);
  }

  function decline() {
    declineRepair(selectedJob.id);
    router.replace('/(customer)/(tabs)/bookings');
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Exact repair cost</ThemedText>
          <ThemedText themeColor="textSecondary">{selectedJob.diagnosis}</ThemedText>
          {tiers.map((tier) => (
            <Pressable
              key={tier}
              onPress={() => accept(tier)}
              style={({ pressed }) => [
                styles.tier,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
              ]}>
              <View>
                <ThemedText type="smallBold">{TIER_COPY[tier].title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {TIER_COPY[tier].warranty}
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{formatRupees(selectedJob.tiers![tier])}</ThemedText>
            </Pressable>
          ))}
          <AppButton label="Decline repair · ₹0" variant="danger" onPress={decline} />
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
  tier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
  },
});
