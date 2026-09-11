import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { formatRupees, TIER_COPY, useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function TechJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const {
    getJob,
    setPartsCheck,
    startDispatch,
    startInspection,
    sendQuote,
    resolveJob,
  } = useJobs();
  const job = getJob(id ?? '');

  const [diagnosis, setDiagnosis] = useState(job?.diagnosis ?? '');
  const [a1, setA1] = useState(job?.tiers?.a1?.toString() ?? '2499');
  const [a2, setA2] = useState(job?.tiers?.a2?.toString() ?? '1499');
  const [a3, setA3] = useState(job?.tiers?.a3?.toString() ?? '799');

  if (!job) {
    return (
      <Screen>
        <ThemedText>Job not found in this demo session.</ThemedText>
      </Screen>
    );
  }

  const selectedJob = job;
  const device = getDevice(selectedJob.category);
  const canQuote = selectedJob.status === 'inspecting' || selectedJob.status === 'quoted';
  const canResolve = selectedJob.status === 'accepted' || selectedJob.status === 'declined';

  function submitQuote() {
    sendQuote(selectedJob.id, diagnosis.trim() || `${device.label} issue confirmed on-site`, {
      a1: Number(a1) || 0,
      a2: Number(a2) || 0,
      a3: Number(a3) || 0,
    });
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">{device.label}</ThemedText>
          <StatusChip status={selectedJob.status} />
          <ThemedText themeColor="textSecondary">
            {selectedJob.placeTag} · {selectedJob.address}
          </ThemedText>

          <ThemedText type="smallBold">Visual pre-diagnostics</ThemedText>
          {selectedJob.mediaUri && selectedJob.mediaType !== 'video' ? (
            <Image source={{ uri: selectedJob.mediaUri }} style={styles.media} />
          ) : (
            <ThemedText themeColor="textSecondary">
              {selectedJob.mediaUri
                ? 'Customer attached a video of the fault.'
                : 'No media attached. Ask on arrival if needed.'}
            </ThemedText>
          )}

          <ThemedText type="smallBold">Smart inventory</ThemedText>
          <ThemedText themeColor="textSecondary">
            {selectedJob.partsChecked
              ? selectedJob.partsInStock
                ? 'Parts for this brand are in stock. Safe to confirm the visit.'
                : 'Parts are not in van stock. Confirm only if you will pick up from warehouse first.'
              : 'Check warehouse stock before you confirm this booking.'}
          </ThemedText>
          <View style={styles.row}>
            <AppButton
              label="Mark in stock"
              variant="secondary"
              style={styles.flex}
              onPress={() => setPartsCheck(selectedJob.id, true)}
            />
            <AppButton
              label="Not in stock"
              variant="secondary"
              style={styles.flex}
              onPress={() => setPartsCheck(selectedJob.id, false)}
            />
          </View>

          {selectedJob.status === 'requested' ? (
            <AppButton
              label="Confirm booking & start route"
              disabled={!selectedJob.partsChecked}
              onPress={() => startDispatch(selectedJob.id)}
            />
          ) : null}

          {selectedJob.status === 'dispatched' ? (
            <AppButton label="Arrived · start inspection" onPress={() => startInspection(selectedJob.id)} />
          ) : null}

          {canQuote ? (
            <>
              <ThemedText type="smallBold">On-site diagnosis & quote</ThemedText>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="What is broken?"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              {(['a1', 'a2', 'a3'] as const).map((tier, index) => {
                const value = [a1, a2, a3][index];
                const setter = [setA1, setA2, setA3][index];
                return (
                  <View key={tier} style={styles.priceRow}>
                    <ThemedText type="small">
                      {TIER_COPY[tier].title} · {TIER_COPY[tier].warranty}
                    </ThemedText>
                    <TextInput
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={setter}
                      style={[styles.priceInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                    />
                  </View>
                );
              })}
              <AppButton label={`Send estimate (${formatRupees(Number(a1) || 0)} / ${formatRupees(Number(a2) || 0)} / ${formatRupees(Number(a3) || 0)})`} onPress={submitQuote} />
            </>
          ) : null}

          {selectedJob.chosenTier ? (
            <ThemedText type="smallBold">Customer chose {TIER_COPY[selectedJob.chosenTier].title}</ThemedText>
          ) : null}

          {canResolve ? (
            <>
              <ThemedText type="smallBold">Job resolution</ThemedText>
              <AppButton
                label="Repaired on-site"
                onPress={() => {
                  resolveJob(selectedJob.id, 'on_site_repaired');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
              <AppButton
                label="Taking to warehouse"
                variant="secondary"
                onPress={() => {
                  resolveJob(selectedJob.id, 'warehouse');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
              <AppButton
                label="Declined · close ticket"
                variant="danger"
                onPress={() => {
                  resolveJob(selectedJob.id, 'declined');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
            </>
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
    gap: Spacing.three,
  },
  media: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  priceRow: {
    gap: Spacing.one,
  },
  priceInput: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
