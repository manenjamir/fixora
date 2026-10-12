import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, LogOut } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { DEVICE_GROUPS } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { formatPhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

export default function TechAccountScreen() {
  const router = useRouter();
  const { session, profile, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const labels = DEVICE_GROUPS.filter((group) => profile?.specializations?.includes(group.id)).map((group) => group.label);
  const initial = (name.trim() || profile?.full_name || 'T').slice(0, 1).toUpperCase();

  useEffect(() => {
    setName(profile?.full_name ?? '');
    setEmail(profile?.email ?? '');
    setAddress(profile?.address ?? '');
  }, [profile?.full_name, profile?.email, profile?.address]);

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

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
      });
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  async function pickPhoto() {
    if (!session?.user.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos', 'Allow photo access to set a profile picture.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
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

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <ThemedText type="subtitle">Account</ThemedText>

          <View className="items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
            <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={pickPhoto} className="relative">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-800">
                  <Text className="text-3xl font-bold text-blue-700 dark:text-blue-300">{initial}</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:border-slate-900">
                <Camera size={14} color="#ffffff" strokeWidth={2} />
              </View>
            </Pressable>
            <View className="items-center gap-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">{name.trim() || 'Technician'}</Text>
              <Text className="text-sm font-medium text-slate-500">
                {profile?.phone ? formatPhone(profile.phone) : 'Signed in number'}
              </Text>
            </View>
          </View>

          <View className="gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-base font-bold text-slate-900 dark:text-white">Profile</Text>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Home or workshop address" multiline />
            <View className="gap-1">
              <Text className="text-sm font-bold text-slate-500">Phone</Text>
              <View className="min-h-12 justify-center rounded-2xl bg-slate-50 px-4 dark:bg-slate-800">
                <Text className="text-base text-slate-500">
                  {profile?.phone ? formatPhone(profile.phone) : 'Signed in number'}
                </Text>
              </View>
            </View>
            <AppButton label={saving ? 'Saving…' : 'Save profile'} disabled={saving} onPress={save} />
          </View>

          <View className="gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-base font-bold text-slate-900 dark:text-white">Specializations</Text>
            {labels.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {labels.map((label) => (
                  <View key={label} className="rounded-full bg-blue-50 px-3 py-1.5 dark:bg-slate-800">
                    <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">{label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm font-medium text-slate-500">No specializations selected yet.</Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tech)/specializations')}
              className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 active:opacity-80 dark:bg-slate-800">
              <Text className="text-base font-medium text-slate-900 dark:text-white">Edit specializations</Text>
              <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          </View>
        </Content>
      </TabScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
        style={styles.signOut}>
        <LogOut size={18} color="#9F3A3A" strokeWidth={2.4} />
        <Text className="text-base font-bold" style={{ color: '#9F3A3A' }}>Sign out</Text>
      </Pressable>
    </TabScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'email-address';
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-bold text-slate-500">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl bg-slate-50 px-4 text-base text-slate-900 dark:bg-slate-800 dark:text-white ${
          multiline ? 'min-h-24 py-3' : 'min-h-12'
        }`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  signOut: {
    minHeight: 52,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    backgroundColor: '#F6E4E4',
  },
});
