import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs, type AppRole } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function RolePickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setRole } = useJobs();

  function enter(role: AppRole) {
    setRole(role);
    router.replace(role === 'customer' ? '/(customer)/(tabs)/home' : '/(tech)/(tabs)/inbox');
  }

  return (
    <Screen>
      <Content style={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="subtitle">Doorstep repair</ThemedText>
          <ThemedText themeColor="textSecondary">
            Free check-up at your place. You only pay if you repair.
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as customer"
          onPress={() => enter('customer')}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="person-outline" size={28} color={theme.accent} />
          <View style={styles.cardCopy}>
            <ThemedText type="smallBold">Continue as customer</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Book a technician, track arrival, and choose A1 / A2 / A3.
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as technician"
          onPress={() => enter('tech')}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="construct-outline" size={28} color={theme.accent} />
          <View style={styles.cardCopy}>
            <ThemedText type="smallBold">Continue as technician</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Route jobs, send quotes, and close on-site or warehouse visits.
            </ThemedText>
          </View>
        </Pressable>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  hero: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: 18,
    alignItems: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
});
