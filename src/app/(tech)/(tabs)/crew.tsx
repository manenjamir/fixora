import { useRouter } from 'expo-router';

import { AppButton, Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';

export default function TechAccountScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <TabScreen>
      <Content>
        <ThemedText type="subtitle">Technician</ThemedText>
        <ThemedText type="smallBold">{profile?.full_name || 'Technician'}</ThemedText>
        <ThemedText themeColor="textSecondary">+{profile?.phone ?? 'Signed in'}</ThemedText>
        <ThemedText themeColor="textSecondary">Portable repair bag + van stock.</ThemedText>
        <AppButton
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </Content>
    </TabScreen>
  );
}
