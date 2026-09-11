import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Content, TabScreen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { DEVICE_CATEGORIES } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <TabScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Content>
          <ThemedText type="subtitle">What needs a check-up?</ThemedText>
          <View style={[styles.banner, { backgroundColor: theme.accent }]}>
            <ThemedText style={styles.bannerTitle}>Free Doorstep Check-up</ThemedText>
            <ThemedText style={styles.bannerBody}>You only pay if you repair. Decline costs ₹0.</ThemedText>
          </View>
          <View style={styles.grid}>
            {DEVICE_CATEGORIES.map((device) => (
              <Pressable
                key={device.id}
                accessibilityRole="button"
                accessibilityLabel={device.label}
                onPress={() => router.push(`/(customer)/book/${device.id}`)}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
                ]}>
                <Ionicons name={device.icon} size={28} color={theme.accent} />
                <ThemedText type="smallBold" style={styles.tileLabel}>
                  {device.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Content>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 700,
  },
  bannerBody: {
    color: '#ffffff',
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
