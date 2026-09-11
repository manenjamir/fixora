import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { STATUS_LABEL, useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function TechRouteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobs } = useJobs();
  const stops = jobs
    .filter((job) => ['requested', 'dispatched', 'inspecting', 'accepted'].includes(job.status))
    .sort((a, b) => a.technician.etaMinutes - b.technician.etaMinutes);

  return (
    <TabScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Content>
          <ThemedText type="subtitle">Optimized route</ThemedText>
          <ThemedText themeColor="textSecondary">
            Stops are ordered by ETA so you spend less fuel between hostels, colleges, and hospitals.
          </ThemedText>
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
                      {STATUS_LABEL[job.status]} · {job.technician.etaMinutes} min
                    </ThemedText>
                  </View>
                  <Ionicons name="navigate-outline" size={20} color={theme.accent} />
                </Pressable>
              );
            })
          )}
        </Content>
      </ScrollView>
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
