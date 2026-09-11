import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, Content, Screen } from '@/components/repair-ui';
import { ThemedText } from '@/components/themed-text';
import { getDevice, PLACE_TAGS, type PlaceTag } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';
import { useTheme } from '@/hooks/use-theme';

export default function BookScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const device = getDevice(category ?? 'other');
  const theme = useTheme();
  const router = useRouter();
  const { createJob } = useJobs();

  const [placeTag, setPlaceTag] = useState<PlaceTag>('Home');
  const [address, setAddress] = useState('');
  const [mediaUri, setMediaUri] = useState<string>();
  const [mediaType, setMediaType] = useState<'image' | 'video'>();

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setMediaUri(asset.uri);
    setMediaType(asset.type === 'video' ? 'video' : 'image');
  }

  function submit() {
    const job = createJob({
      category: device.id,
      mediaUri,
      mediaType,
      placeTag,
      address: address.trim() || `${placeTag} location`,
    });
    router.replace(`/(customer)/track/${job.id}`);
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">{device.label}</ThemedText>
          <ThemedText themeColor="textSecondary">
            Upload a photo or video of the issue, then pin where the technician should come.
          </ThemedText>

          <Pressable
            onPress={pickMedia}
            style={[styles.media, { backgroundColor: theme.backgroundElement }]}>
            {mediaUri && mediaType !== 'video' ? (
              <Image source={{ uri: mediaUri }} style={styles.preview} />
            ) : (
              <>
                <Ionicons name={mediaUri ? 'videocam-outline' : 'camera-outline'} size={32} color={theme.accent} />
                <ThemedText type="smallBold">
                  {mediaUri ? 'Media attached (tap to change)' : 'Add photo or video'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Optional — skip if you prefer
                </ThemedText>
              </>
            )}
          </Pressable>

          <ThemedText type="smallBold">Where should we come?</ThemedText>
          <View style={styles.tags}>
            {PLACE_TAGS.map((tag) => {
              const selected = tag === placeTag;
              return (
                <Pressable
                  key={tag}
                  onPress={() => setPlaceTag(tag)}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: selected ? theme.accent : theme.backgroundElement,
                    },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                    {tag}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Building, room, landmark"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <AppButton label="Book free check-up" onPress={submit} />
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
  media: {
    minHeight: 160,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 180,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
