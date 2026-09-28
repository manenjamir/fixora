import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { Content, JobRow, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { groupForCategory } from '@/constants/devices';
import { useAuth } from '@/context/auth';
import { useJobs } from '@/context/job-store';
import { isActiveJob } from '@/lib/job-routes';

export default function TechJobsScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { jobs } = useJobs();
  const specializations = profile?.specializations ?? [];
  const openJobs = jobs.filter((job) => {
    if (!isActiveJob(job)) return false;
    if (job.technicianId && job.technicianId === session?.user.id) return true;
    if (job.technicianId) return false;
    return specializations.includes(groupForCategory(job.category));
  });

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
