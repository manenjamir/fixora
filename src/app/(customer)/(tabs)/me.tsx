import { useRouter } from 'expo-router';
import { ChevronRight, Info, LogOut, MapPin, Pencil } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Content, TabScreen, TabScrollView } from '@/components/repair-ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { formatPhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

export default function CustomerAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const name = profile?.full_name?.trim() || 'Customer';
  const initial = name.slice(0, 1).toUpperCase();

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

  return (
    <TabScreen>
      <TabScrollView>
        <Content>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.initial, { color: theme.text }]}>{initial}</Text>
              </View>
            )}
            <View style={styles.identity}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.phone, { color: theme.textSecondary }]}>
                {profile?.phone ? formatPhone(profile.phone) : 'Signed in'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => router.push('/(customer)/edit-profile')}
              style={styles.edit}>
              <Pencil size={18} color="#ffffff" strokeWidth={2.2} />
            </Pressable>
          </View>

          <MenuRow icon={<MapPin size={20} color={theme.text} strokeWidth={2} />} label="Manage Address" onPress={() => router.push('/(customer)/address')} />
          <MenuRow icon={<Info size={20} color={theme.text} strokeWidth={2} />} label="About Fixora" onPress={() => router.push('/(customer)/about')} />
          <MenuRow
            icon={<LogOut size={20} color={theme.text} strokeWidth={2} />}
            label="Logout"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
        </Content>
      </TabScrollView>
    </TabScreen>
  );
}

function MenuRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {icon}
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.four,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 24,
    fontWeight: '700',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  phone: {
    fontSize: 14,
    fontWeight: '500',
  },
  edit: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 56,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
