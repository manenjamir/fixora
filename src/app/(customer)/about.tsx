import { ScrollView, StyleSheet } from 'react-native';

import { Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">About Fixora</ThemedText>
          <ThemedText themeColor="textSecondary">
            Fixora sends a technician to your door for phones, appliances, and electrical repairs. The check-up is free. You only pay if you choose a repair.
          </ThemedText>
        </Content>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
