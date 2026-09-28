import { useRouter } from 'expo-router';

import { AppButton, Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { DEVICE_GROUPS } from '@/constants/devices';
import { useAuth } from '@/context/auth';

export default function TechAccountScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const labels = DEVICE_GROUPS.filter((group) => profile?.specializations?.includes(group.id)).map((group) => group.label);

  return (
    <TabScreen>
      <Content>
        <ThemedText type="subtitle">Technician</ThemedText>
        <ThemedText type="smallBold">{profile?.full_name || 'Technician'}</ThemedText>
        <ThemedText themeColor="textSecondary">+{profile?.phone ?? 'Signed in'}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {labels.length > 0 ? labels.join(' · ') : 'No specializations selected yet.'}
        </ThemedText>
        <AppButton label="Edit specializations" variant="secondary" onPress={() => router.push('/(tech)/specializations')} />
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
