import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
  const [mediaBase64, setMediaBase64] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyAsset(asset: ImagePicker.ImagePickerAsset) {
    setMediaUri(asset.uri);
    setMediaType(asset.type === 'video' ? 'video' : 'image');
    setMediaBase64(asset.type === 'video' ? undefined : asset.base64 ?? undefined);
  }

  async function captureMedia(kind: 'images' | 'videos') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to take a live photo or video.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: [kind],
      quality: 0.7,
      base64: kind === 'images',
      videoMaxDuration: 30,
    });
    if (result.canceled || !result.assets[0]) return;
    applyAsset(result.assets[0]);
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Allow photo access to attach an existing image or video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    applyAsset(result.assets[0]);
  }

  function showMediaOptions() {
    Alert.alert('Add a photo or video', 'Choose how you want to show the issue.', [
      { text: 'Take photo', onPress: () => captureMedia('images') },
      { text: 'Record video', onPress: () => captureMedia('videos') },
      { text: 'Choose from gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const job = await createJob({
        category: device.id,
        mediaUri,
        mediaType,
        mediaBase64,
        placeTag,
        address: address.trim() || `${placeTag} location`,
      });
      router.replace(`/(customer)/track/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book this visit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Content>
          <ThemedText type="subtitle">{device.label}</ThemedText>
          <ThemedText themeColor="textSecondary">
            Optionally attach a photo or video, then pin where the technician should come.
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            onPress={showMediaOptions}
            style={[styles.media, { backgroundColor: theme.backgroundElement }]}>
            {mediaUri && mediaType !== 'video' ? (
              <>
                <Image source={{ uri: mediaUri }} style={styles.preview} contentFit="cover" />
                <ThemedText type="small" themeColor="textSecondary" style={styles.mediaHint}>
                  Tap to change
                </ThemedText>
              </>
            ) : (
              <>
                <Ionicons name={mediaUri ? 'videocam-outline' : 'camera-outline'} size={32} color={theme.accent} />
                <ThemedText type="smallBold">
                  {mediaUri ? 'Video attached' : 'Add a photo or video of the issue'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {mediaUri ? 'Tap to change' : 'Optional — tap to add'}
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
          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}
          <AppButton label={submitting ? 'Booking…' : 'Book free check-up'} disabled={submitting} onPress={submit} />
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
  mediaHint: {
    paddingVertical: Spacing.two,
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
