import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { DEVICE_GROUPS, type DeviceGroupId } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

const GROUP_IDS = new Set<string>(DEVICE_GROUPS.map((group) => group.id));

function savedGroups(values: string[] | undefined): DeviceGroupId[] {
  return (values ?? []).filter((value): value is DeviceGroupId => GROUP_IDS.has(value));
}

export default function SpecializationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, saveSpecializations } = useAuth();
  const [selected, setSelected] = useState<DeviceGroupId[]>(() => savedGroups(profile?.specializations));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: DeviceGroupId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await saveSpecializations(selected);
      router.replace('/(tech)/(tabs)/inbox');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save specializations');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Content>
        <ThemedText type="subtitle">Your specializations</ThemedText>
        <ThemedText themeColor="textSecondary">
          Incoming jobs are limited to the categories you select.
        </ThemedText>
        {DEVICE_GROUPS.map((group) => {
          const active = selected.includes(group.id);
          return (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              onPress={() => toggle(group.id)}
              style={[
                styles.option,
                { backgroundColor: active ? theme.accent : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: active ? '#ffffff' : theme.text }}>
                {group.label}
              </ThemedText>
              <ThemedText type="small" style={{ color: active ? '#ffffff' : theme.textSecondary }}>
                {group.devices.map((device) => device.label).join(' · ')}
              </ThemedText>
            </Pressable>
          );
        })}
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
        <AppButton label={busy ? 'Saving…' : 'Save specializations'} disabled={busy || selected.length === 0} onPress={save} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
