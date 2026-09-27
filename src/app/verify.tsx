import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!phone) {
      setError('Missing phone number. Go back and request a new code.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Content style={styles.content}>
        <ThemedText type="subtitle">Enter OTP</ThemedText>
        <ThemedText themeColor="textSecondary">We sent a code to {phone}</ThemedText>
        <TextInput
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="6-digit code"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
        <AppButton label={busy ? 'Verifying…' : 'Verify and continue'} disabled={busy || code.trim().length < 4} onPress={submit} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    letterSpacing: 4,
  },
});
