import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { JobMediaPreview } from '@/components/job-media-preview';
import { LiveMap } from '@/components/live-map';
import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { formatRupees, REPAIR_LOCATION_COPY, TIER_COPY, useJobs, type Job, type JobMediaInput, type RepairLocation } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinates, MapPin } from '@/lib/geo';
import { isActiveJob } from '@/lib/job-routes';

export default function TechJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const {
    getJob,
    deviceLocation,
    startDispatch,
    startInspection,
    sendQuote,
    resolveJob,
    completeOnSite,
    markReadyToShip,
    markDelivered,
  } = useJobs();
  const job = getJob(id ?? '');

  const [diagnosis, setDiagnosis] = useState(job?.diagnosis ?? '');
  const [a1, setA1] = useState(job?.tiers?.a1?.toString() ?? '2499');
  const [a2, setA2] = useState(job?.tiers?.a2?.toString() ?? '1499');
  const [a3, setA3] = useState(job?.tiers?.a3?.toString() ?? '799');
  const [repairLocation, setRepairLocation] = useState<RepairLocation | null>(job?.repairLocation ?? null);
  const [completionMedia, setCompletionMedia] = useState<JobMediaInput>();
  const [sendingQuote, setSendingQuote] = useState(false);
  const [finishing, setFinishing] = useState(false);

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
  const selectedLocation = repairLocation ?? selectedJob.repairLocation ?? null;

  async function submitQuote() {
    if (sendingQuote) return;
    if (!selectedLocation) {
      Alert.alert('Choose a repair location', 'Select on-site or warehouse before sending the estimate.');
      return;
    }
    setSendingQuote(true);
    try {
      await sendQuote(
        selectedJob.id,
        diagnosis.trim() || `${device.label} issue confirmed on-site`,
        {
          a1: Number(a1) || 0,
          a2: Number(a2) || 0,
          a3: Number(a3) || 0,
        },
        selectedLocation,
      );
      Alert.alert('Estimate Sent Successfully!');
    } catch (error) {
      Alert.alert('Could not send estimate', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSendingQuote(false);
    }
  }

  async function pickCompletionPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Allow photo access to attach a completion photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setCompletionMedia({
      uri: asset.uri,
      mediaType: 'image',
      mediaBase64: asset.base64 ?? undefined,
    });
  }

  async function finish(kind: 'on_site' | 'delivered') {
    if (finishing) return;
    setFinishing(true);
    try {
      if (kind === 'on_site') {
        await completeOnSite(selectedJob.id, completionMedia);
      } else {
        await markDelivered(selectedJob.id, completionMedia);
      }
      router.replace('/(tech)/(tabs)/inbox');
    } catch (error) {
      Alert.alert('Could not finish this job', error instanceof Error ? error.message : 'Try again');
    } finally {
      setFinishing(false);
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
          {isActiveJob(selectedJob) ? <LiveMap pins={jobPins(selectedJob, deviceLocation)} /> : null}
          {selectedJob.deviceBrand ? (
            <ThemedText type="smallBold">Brand · {selectedJob.deviceBrand}</ThemedText>
          ) : null}
          {selectedJob.customerIssue ? (
            <>
              <ThemedText type="smallBold">Customer reported issue</ThemedText>
              <ThemedText themeColor="textSecondary">{selectedJob.customerIssue}</ThemedText>
            </>
          ) : null}

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

          {selectedJob.status === 'requested' ? (
            <AppButton label="Confirm booking & start route" onPress={() => startDispatch(selectedJob.id)} />
          ) : null}

          {selectedJob.status === 'dispatched' ? (
            <AppButton label="Arrived · start inspection" onPress={() => startInspection(selectedJob.id)} />
          ) : null}

          {canQuote ? (
            <>
              <ThemedText type="smallBold">Repair location</ThemedText>
              <View style={styles.row}>
                {(['on_site', 'warehouse'] as const).map((option) => {
                  const selected = selectedLocation === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => setRepairLocation(option)}
                      style={[
                        styles.toggle,
                        { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                      ]}>
                      <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                        {REPAIR_LOCATION_COPY[option]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <ThemedText type="smallBold">Diagnosis & quote</ThemedText>
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
                disabled={!selectedLocation}
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
              {selectedJob.repairLocation ? (
                <ThemedText themeColor="textSecondary">
                  Customer approved {REPAIR_LOCATION_COPY[selectedJob.repairLocation]}.
                </ThemedText>
              ) : (
                <ThemedText themeColor="textSecondary">
                  This estimate has no repair location. Choose where the repair will happen.
                </ThemedText>
              )}
              {selectedJob.repairLocation === 'on_site' || !selectedJob.repairLocation ? (
                <>
                  <AppButton
                    label={completionMedia ? 'Completion photo attached' : 'Add completion photo'}
                    variant="secondary"
                    onPress={pickCompletionPhoto}
                  />
                  {completionMedia ? <JobMediaPreview uri={completionMedia.uri} mediaType={completionMedia.mediaType} /> : null}
                  <AppButton
                    busy={finishing}
                    label="Repaired on-site"
                    onPress={() => finish('on_site')}
                  />
                </>
              ) : null}
              {selectedJob.repairLocation === 'warehouse' || !selectedJob.repairLocation ? (
                <AppButton
                  label="Taking to warehouse"
                  variant="secondary"
                  onPress={async () => {
                    await resolveJob(selectedJob.id, 'warehouse');
                    router.replace('/(tech)/(tabs)/inbox');
                  }}
                />
              ) : null}
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
                label={completionMedia ? 'Completion photo attached' : 'Add completion photo'}
                variant="secondary"
                onPress={pickCompletionPhoto}
              />
              {completionMedia ? <JobMediaPreview uri={completionMedia.uri} mediaType={completionMedia.mediaType} /> : null}
              <AppButton
                busy={finishing}
                label="Confirm delivered to customer"
                onPress={() => finish('delivered')}
              />
            </View>
          ) : null}
        </Content>
      </ScrollView>
    </Screen>
  );
}

function jobPins(job: Job, deviceLocation: Coordinates | null): MapPin[] {
  const pins: MapPin[] = [];
  if (job.customerLocation) {
    pins.push({
      id: 'customer',
      latitude: job.customerLocation.lat,
      longitude: job.customerLocation.lng,
      title: 'Customer',
      kind: 'customer',
    });
  }
  const technician =
    job.technician.lat != null && job.technician.lng != null
      ? { lat: job.technician.lat, lng: job.technician.lng }
      : deviceLocation;
  if (technician) {
    pins.push({
      id: 'technician',
      latitude: technician.lat,
      longitude: technician.lng,
      title: 'You',
      kind: 'technician',
    });
  }
  return pins;
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
