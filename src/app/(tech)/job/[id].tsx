import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { JobMediaPreview } from '@/components/job-media-preview';
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
    markReadyToShip,
    markDelivered,
  } = useJobs();
  const job = getJob(id ?? '');

  const [diagnosis, setDiagnosis] = useState(job?.diagnosis ?? '');
  const [a1, setA1] = useState(job?.tiers?.a1?.toString() ?? '2499');
  const [a2, setA2] = useState(job?.tiers?.a2?.toString() ?? '1499');
  const [a3, setA3] = useState(job?.tiers?.a3?.toString() ?? '799');
  const [sendingQuote, setSendingQuote] = useState(false);

  if (!job) {
    return (
      <Screen>
        <ThemedText>Job not found in this session.</ThemedText>
      </Screen>
    );
  }

  const selectedJob = job;
  const device = getDevice(selectedJob.category);
  const canQuote = selectedJob.status === 'inspecting' || selectedJob.status === 'quoted';
  const canResolve = selectedJob.status === 'accepted';
  const customerDeclined = selectedJob.status === 'declined_by_customer';
  const inStockSelected = selectedJob.partsChecked && selectedJob.partsInStock;
  const outOfStockSelected = selectedJob.partsChecked && !selectedJob.partsInStock;

  async function submitQuote() {
    if (sendingQuote) return;
    setSendingQuote(true);
    try {
      await sendQuote(selectedJob.id, diagnosis.trim() || `${device.label} issue confirmed on-site`, {
        a1: Number(a1) || 0,
        a2: Number(a2) || 0,
        a3: Number(a3) || 0,
      });
      Alert.alert('Estimate Sent Successfully!');
    } catch (error) {
      Alert.alert('Could not send estimate', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSendingQuote(false);
    }
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
          {selectedJob.mediaUri ? (
            <JobMediaPreview uri={selectedJob.mediaUri} mediaType={selectedJob.mediaType} />
          ) : selectedJob.mediaPath ? (
            <ThemedText themeColor="textSecondary">
              Media was uploaded but could not be loaded. Pull this job again after a moment.
            </ThemedText>
          ) : (
            <ThemedText themeColor="textSecondary">No media attached. Ask on arrival if needed.</ThemedText>
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
            <Pressable
              accessibilityRole="button"
              onPress={() => setPartsCheck(selectedJob.id, true)}
              style={[
                styles.toggle,
                { backgroundColor: inStockSelected ? theme.accent : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: inStockSelected ? '#ffffff' : theme.text }}>
                In stock
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPartsCheck(selectedJob.id, false)}
              style={[
                styles.toggle,
                { backgroundColor: outOfStockSelected ? theme.accent : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: outOfStockSelected ? '#ffffff' : theme.text }}>
                Not in stock
              </ThemedText>
            </Pressable>
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
              <AppButton
                busy={sendingQuote}
                label={`Send estimate (${formatRupees(Number(a1) || 0)} / ${formatRupees(Number(a2) || 0)} / ${formatRupees(Number(a3) || 0)})`}
                onPress={submitQuote}
              />
            </>
          ) : null}

          {selectedJob.chosenTier ? (
            <ThemedText type="smallBold">Customer chose {TIER_COPY[selectedJob.chosenTier].title}</ThemedText>
          ) : null}

          {customerDeclined ? (
            <View style={[styles.notice, { backgroundColor: 'rgba(220, 38, 38, 0.12)' }]}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                The customer declined this repair.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                No further job resolution is needed. This ticket is closed at no cost.
              </ThemedText>
            </View>
          ) : null}

          {canResolve ? (
            <>
              <ThemedText type="smallBold">Job resolution</ThemedText>
              <AppButton
                label="Repaired on-site"
                onPress={async () => {
                  await resolveJob(selectedJob.id, 'on_site_repaired');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
              <AppButton
                label="Taking to warehouse"
                variant="secondary"
                onPress={async () => {
                  await resolveJob(selectedJob.id, 'warehouse');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
              <AppButton
                label="Declined · close ticket"
                variant="danger"
                onPress={async () => {
                  await resolveJob(selectedJob.id, 'declined_by_technician');
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
            </>
          ) : null}

          {selectedJob.status === 'warehouse' ? (
            <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Is the device repaired and ready to ship to the customer?</ThemedText>
              <AppButton
                label="Mark Ready & Ship to Customer"
                onPress={async () => {
                  await markReadyToShip(selectedJob.id);
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
            </View>
          ) : null}

          {selectedJob.status === 'out_for_delivery' ? (
            <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Hand the device back to the customer?</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Confirm once the device has been delivered to the customer&apos;s address.
              </ThemedText>
              <AppButton
                label="Confirm delivered to customer"
                onPress={async () => {
                  await markDelivered(selectedJob.id);
                  router.replace('/(tech)/(tabs)/inbox');
                }}
              />
            </View>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toggle: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  notice: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 16,
  },
});
