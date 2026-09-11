import { useRouter } from 'expo-router';

import { AppButton, Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useJobs } from '@/context/job-store';

export default function TechAccountScreen() {
  const router = useRouter();
  const { setRole } = useJobs();

  return (
    <TabScreen>
      <Content>
        <ThemedText type="subtitle">Technician</ThemedText>
        <ThemedText type="smallBold">Ravi Singh · Tech #12</ThemedText>
        <ThemedText themeColor="textSecondary">Demo kit: portable repair bag + van stock.</ThemedText>
        <AppButton
          label="Switch role"
          variant="secondary"
          onPress={() => {
            setRole(null);
            router.replace('/');
          }}
        />
      </Content>
    </TabScreen>
  );
}
