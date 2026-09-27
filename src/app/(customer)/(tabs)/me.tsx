import { useRouter } from 'expo-router';

import { AppButton, Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';

export default function CustomerAccountScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <TabScreen>
      <Content>
        <ThemedText type="subtitle">Account</ThemedText>
        <ThemedText type="smallBold">{profile?.full_name || 'Customer'}</ThemedText>
        <ThemedText themeColor="textSecondary">+{profile?.phone ?? 'Signed in'}</ThemedText>
        <ThemedText themeColor="textSecondary">
          Book,manage, and track your service in one place.
        </ThemedText>
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
