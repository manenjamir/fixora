import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LiveMap } from '@/components/live-map';
import { Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { STATUS_LABEL, useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';
import { distanceMeters, etaMinutes, type MapPin } from '@/lib/geo';

export default function TechRouteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobs, deviceLocation } = useJobs();
  const stops = jobs
    .filter((job) => ['requested', 'dispatched', 'inspecting', 'accepted', 'warehouse', 'out_for_delivery'].includes(job.status))
    .sort((a, b) => {
      if (!deviceLocation) return a.createdAt - b.createdAt;
      const distance = (job: (typeof jobs)[number]) =>
        job.customerLocation ? distanceMeters(deviceLocation, job.customerLocation) : Number.POSITIVE_INFINITY;
      return distance(a) - distance(b);
    });
  const pins: MapPin[] = [];
  if (deviceLocation) {
    pins.push({
      id: 'you',
      latitude: deviceLocation.lat,
      longitude: deviceLocation.lng,
      title: 'You',
      kind: 'technician',
    });
  }
  for (const job of stops) {
    if (!job.customerLocation) continue;
    pins.push({
      id: job.id,
      latitude: job.customerLocation.lat,
      longitude: job.customerLocation.lng,
      title: job.placeTag,
      kind: 'stop',
    });
  }

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <ThemedText type="subtitle">Optimized route</ThemedText>
          <ThemedText themeColor="textSecondary">
            {deviceLocation
              ? 'Stops are ordered by distance from your current location.'
              : 'Turn on location to order stops by distance.'}
          </ThemedText>
          <LiveMap pins={pins} caption={deviceLocation ? 'Your route' : 'Waiting for a live location'} />
          {stops.length === 0 ? (
            <ThemedText themeColor="textSecondary">No stops on the route yet.</ThemedText>
          ) : (
            stops.map((job, index) => {
              const device = getDevice(job.category);
              return (
                <Pressable
                  key={job.id}
                  onPress={() => router.push(`/(tech)/job/${job.id}`)}
                  style={[styles.stop, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <ThemedText style={styles.badgeText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.copy}>
                    <ThemedText type="smallBold">
                      {device.label} · {job.placeTag}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {job.address}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {STATUS_LABEL[job.status]}
                      {deviceLocation && job.customerLocation
                        ? ` · ${etaMinutes(distanceMeters(deviceLocation, job.customerLocation))} min`
                        : ''}
                    </ThemedText>
                  </View>
                  <Ionicons name="navigate-outline" size={20} color={theme.accent} />
                </Pressable>
              );
            })
          )}
        </Content>
      </TabScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
