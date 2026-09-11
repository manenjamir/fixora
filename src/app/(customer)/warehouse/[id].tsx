import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, Content, Screen, StatusChip } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function WarehouseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getJob, requestLoaner } = useJobs();
  const job = getJob(id ?? '');
  const [loanerType, setLoanerType] = useState<'phone' | 'laptop'>('laptop');

  if (!job) {
    return (
      <Screen>
        <ThemedText>Job not found in this demo session.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Warehouse & loaner</ThemedText>
          <StatusChip status={job.status} />
          <ThemedText themeColor="textSecondary">
            Pickup and return delivery are free. Ask for a loaner if you need a device for class or work.
          </ThemedText>
          {job.loanerRequested ? (
            <ThemedText type="smallBold">
              Loaner {job.loanerType} requested. We will confirm when it is on the way.
            </ThemedText>
          ) : (
            <>
              <View style={styles.row}>
                {(['phone', 'laptop'] as const).map((type) => {
                  const selected = type === loanerType;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setLoanerType(type)}
                      style={[
                        styles.choice,
                        { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                      ]}>
                      <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                        {type === 'phone' ? 'Loaner phone' : 'Loaner laptop'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <AppButton label="Request loaner device" onPress={() => requestLoaner(job.id, loanerType)} />
            </>
          )}
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
