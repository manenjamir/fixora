import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();

  useEffect(() => {
    setName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  useEffect(() => {
    if (!profile?.avatar_path) {
      setAvatarUrl(undefined);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from('profile-avatars')
      .createSignedUrl(profile.avatar_path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setAvatarUrl(data?.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_path]);

  async function pickPhoto() {
    if (!session?.user.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos', 'Allow photo access to set a profile picture.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (picked.canceled || !picked.assets[0]) return;
    const path = `${session.user.id}/avatar.jpg`;
    const response = await fetch(picked.assets[0].uri);
    const body = new Uint8Array(await response.arrayBuffer());
    const { error } = await supabase.storage.from('profile-avatars').upload(path, body, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) {
      Alert.alert('Could not upload photo', error.message);
      return;
    }
    await updateProfile({ avatar_path: path });
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ full_name: name.trim() });
      router.back();
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">Edit profile</ThemedText>
          <View style={styles.photoRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder, { backgroundColor: theme.backgroundElement }]} />
            )}
            <AppButton label={avatarUrl ? 'Change photo' : 'Add photo'} variant="secondary" onPress={pickPhoto} />
          </View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <AppButton label={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={save} />
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  placeholder: {},
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
