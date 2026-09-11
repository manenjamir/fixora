import { useRouter } from 'expo-router';

import { AppButton, Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useJobs } from '@/context/job-store';

export default function CustomerAccountScreen() {
  const router = useRouter();
  const { setRole } = useJobs();

  return (
    <TabScreen>
      <Content>
        <ThemedText type="subtitle">Account</ThemedText>
        <ThemedText type="smallBold">Alex Kumar</ThemedText>
        <ThemedText themeColor="textSecondary">+91 90000 11111 · Demo customer</ThemedText>
        <ThemedText themeColor="textSecondary">
          Personal bookings only. Commercial AMC plans are not in this version.
        </ThemedText>
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
