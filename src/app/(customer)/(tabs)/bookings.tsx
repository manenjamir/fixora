import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Content, JobRow, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';
import { customerJobHref, isActiveJob } from '@/lib/job-routes';

export default function CustomerJobsScreen() {
  const router = useRouter();
  const { jobs } = useJobs();
  const active = jobs.filter(isActiveJob);
  const past = jobs.filter((job) => !isActiveJob(job));

  return (
    <TabScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Content>
          <ThemedText type="subtitle">Bookings</ThemedText>
          {active.length === 0 ? (
            <ThemedText themeColor="textSecondary">No active visits. Book a free check-up from Home.</ThemedText>
          ) : (
            active.map((job) => (
              <JobRow key={job.id} job={job} onPress={() => router.push(customerJobHref(job))} />
            ))
          )}
          {past.length > 0 ? (
            <>
              <ThemedText type="smallBold" style={styles.section}>
                Past
              </ThemedText>
              {past.map((job) => (
                <JobRow key={job.id} job={job} onPress={() => router.push(customerJobHref(job))} />
              ))}
            </>
          ) : null}
        </Content>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.two,
  },
});
