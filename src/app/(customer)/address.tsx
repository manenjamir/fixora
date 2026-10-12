import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

export default function AddressScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, updateProfile } = useAuth();
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAddress(profile?.address ?? '');
  }, [profile?.address]);

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ address: address.trim() || null });
      router.back();
    } catch (error) {
      Alert.alert('Could not save address', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Manage Address</ThemedText>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Home or workplace"
            placeholderTextColor={theme.textSecondary}
            multiline
            textAlignVertical="top"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <AppButton label={saving ? 'Saving…' : 'Save address'} disabled={saving} onPress={save} />
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
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 120,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
});
