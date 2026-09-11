import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { Content, JobRow, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useJobs } from '@/context/job-store';
import { isActiveJob } from '@/lib/job-routes';

export default function TechJobsScreen() {
  const router = useRouter();
  const { jobs } = useJobs();
  const openJobs = jobs.filter(isActiveJob);

  return (
    <TabScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Content>
          <ThemedText type="subtitle">Incoming jobs</ThemedText>
          <ThemedText themeColor="textSecondary">
            Open a job for photos, stock check, quoting, and resolution.
          </ThemedText>
          {openJobs.length === 0 ? (
            <ThemedText themeColor="textSecondary">No open requests right now.</ThemedText>
          ) : (
            openJobs.map((job) => (
              <JobRow key={job.id} job={job} onPress={() => router.push(`/(tech)/job/${job.id}`)} />
            ))
          )}
        </Content>
      </ScrollView>
    </TabScreen>
  );
}
