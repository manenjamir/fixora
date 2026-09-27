import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import type { AppRole } from '@/context/job-store';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, profile, loading, sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('customer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !session || !profile) return;
    router.replace(profile.role === 'tech' ? '/(tech)/(tabs)/inbox' : '/(customer)/(tabs)/home');
  }, [loading, profile, router, session]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await sendOtp(phone, role);
      router.push({ pathname: '/verify', params: { phone, role } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Enable Phone auth in Supabase.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Content style={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="subtitle">Fixora</ThemedText>
          <ThemedText themeColor="textSecondary">
             You only pay if you repair.
          </ThemedText>
        </View>

        <ThemedText type="smallBold">Phone</ThemedText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+91 90000 11111"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />

        <View style={styles.row}>
          {(['customer', 'tech'] as const).map((option) => {
            const selected = option === role;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setRole(option)}
                style={[
                  styles.role,
                  { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                  {option === 'customer' ? 'Customer' : 'Technician'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}

        <AppButton label={busy ? 'Sending code…' : 'Send OTP'} disabled={busy || phone.trim().length < 10} onPress={submit} />
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
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  role: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
