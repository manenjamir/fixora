import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ImageIcon, Video } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChoiceChip, SectionCard } from '@/components/booking-section';
import { AppButton } from '@/components/repair-ui';
import { getBrandsForCategory, OTHER_BRAND } from '@/constants/device-brands';
import { getDevice, PLACE_TAGS, type PlaceTag } from '@/constants/devices';
import { Spacing } from '@/constants/theme';
import { useJobs } from '@/context/job-store';

export default function BookScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const device = getDevice(category ?? 'other');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createJob } = useJobs();
  const mediaSheetRef = useRef<BottomSheetModal>(null);
  const mediaSnapPoints = useMemo(() => ['38%'], []);

  const brands = getBrandsForCategory(device.id);
  const [customerIssue, setCustomerIssue] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [customBrand, setCustomBrand] = useState('');
  const [placeTag, setPlaceTag] = useState<PlaceTag>('Home');
  const [address, setAddress] = useState('');
  const [mediaUri, setMediaUri] = useState<string>();
  const [mediaType, setMediaType] = useState<'image' | 'video'>();
  const [mediaBase64, setMediaBase64] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resolvedBrand() {
    if (!selectedBrand) return '';
    if (selectedBrand === OTHER_BRAND) return customBrand.trim();
    return selectedBrand;
  }

  const brandLabel = resolvedBrand();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  function applyAsset(asset: ImagePicker.ImagePickerAsset) {
    setMediaUri(asset.uri);
    setMediaType(asset.type === 'video' ? 'video' : 'image');
    setMediaBase64(asset.type === 'video' ? undefined : asset.base64 ?? undefined);
  }

  async function captureMedia(kind: 'images' | 'videos') {
    mediaSheetRef.current?.dismiss();
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
    mediaSheetRef.current?.dismiss();
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

  async function submit() {
    setError(null);
    const issue = customerIssue.trim();
    const brand = resolvedBrand();
    if (!issue) {
      setError('Describe what is wrong with your device.');
      return;
    }
    if (!brand) {
      setError(selectedBrand === OTHER_BRAND ? 'Enter your device brand.' : 'Select a device brand.');
      return;
    }
    setSubmitting(true);
    try {
      let customerLocation: { lat: number; lng: number } | undefined;
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) {
        try {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          customerLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch {
          customerLocation = undefined;
        }
      }
      const job = await createJob({
        category: device.id,
        customerIssue: issue,
        deviceBrand: brand,
        mediaUri,
        mediaType,
        mediaBase64,
        placeTag,
        address: address.trim() || `${placeTag} location`,
        customerLocation,
      });
      router.replace(`/(customer)/track/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book this visit');
    } finally {
      setSubmitting(false);
    }
  }

  const mediaTitle = mediaUri
    ? mediaType === 'video'
      ? 'Video attached'
      : 'Photo attached'
    : 'Add photo or video';
  const mediaSubtitle = mediaUri ? 'Tap to change' : 'Show the issue to your technician';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.two,
          paddingBottom: insets.bottom + Spacing.six,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-3xl gap-3">
          <View className="gap-1">
            <Text className="text-[32px] font-semibold leading-10 text-slate-900 dark:text-white">{device.label}</Text>
            <Text className="text-base font-medium text-slate-500">
              Free doorstep check-up. You only pay if you repair.
            </Text>
          </View>

          <SectionCard title="Photo or video" hint={mediaSubtitle} optional>
            <Pressable
              accessibilityRole="button"
              onPress={() => mediaSheetRef.current?.present()}
              className="min-h-[160] items-center justify-center overflow-hidden rounded-[18px] border border-slate-200/60 bg-slate-50 active:opacity-80 dark:border-slate-700 dark:bg-slate-800">
              {mediaUri && mediaType === 'image' ? (
                <>
                  <Image source={{ uri: mediaUri }} style={{ width: '100%', height: 180 }} contentFit="cover" />
                  <Text className="py-2 text-sm font-medium text-slate-500">Tap to change</Text>
                </>
              ) : (
                <View className="items-center justify-center gap-1 px-4 py-6">
                  {mediaUri && mediaType === 'video' ? (
                    <Video size={32} color="#2563EB" strokeWidth={2} />
                  ) : (
                    <Camera size={32} color="#2563EB" strokeWidth={2} />
                  )}
                  <Text className="text-base font-bold text-slate-900 dark:text-white">{mediaTitle}</Text>
                  <Text className="text-sm font-medium text-slate-500">
                    {mediaUri ? 'Tap to change' : 'Optional — tap to add'}
                  </Text>
                </View>
              )}
            </Pressable>
          </SectionCard>

          <SectionCard title="What's the problem?" hint="Be specific so the technician can prepare.">
            <TextInput
              value={customerIssue}
              onChangeText={setCustomerIssue}
              placeholder="e.g. Screen cracked after a drop, phone won't charge"
              placeholderTextColor="#64748B"
              multiline
              textAlignVertical="top"
              className="min-h-[96px] rounded-[14px] border border-slate-200/60 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </SectionCard>

          <SectionCard title="Device brand" hint="Swipe to see more brands.">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
              {brands.map((brand) => (
                <ChoiceChip
                  key={brand}
                  label={brand}
                  selected={brand === selectedBrand}
                  onPress={() => {
                    setSelectedBrand(brand);
                    if (brand !== OTHER_BRAND) setCustomBrand('');
                  }}
                />
              ))}
            </ScrollView>
            {brandLabel && selectedBrand !== OTHER_BRAND ? (
              <Text className="text-sm font-medium text-slate-500">Selected: {brandLabel}</Text>
            ) : null}
            {selectedBrand === OTHER_BRAND ? (
              <TextInput
                value={customBrand}
                onChangeText={setCustomBrand}
                placeholder="Enter brand name"
                placeholderTextColor="#64748B"
                className="min-h-12 rounded-[14px] border border-slate-200/60 bg-slate-50 px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            ) : null}
          </SectionCard>

          <SectionCard title="Where should we come?" hint="Pick a place type, then add a landmark if you can.">
            <View className="flex-row flex-wrap gap-2">
              {PLACE_TAGS.map((tag) => (
                <ChoiceChip
                  key={tag}
                  label={tag}
                  selected={tag === placeTag}
                  onPress={() => setPlaceTag(tag)}
                />
              ))}
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Building, room, landmark"
              placeholderTextColor="#64748B"
              className="min-h-12 rounded-[14px] border border-slate-200/60 bg-slate-50 px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </SectionCard>

          {error ? (
            <View className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900 dark:bg-rose-950">
              <Text className="text-base font-medium text-rose-700 dark:text-rose-300">{error}</Text>
            </View>
          ) : null}

          <AppButton label={submitting ? 'Booking…' : 'Book free check-up'} disabled={submitting} onPress={submit} />
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={mediaSheetRef}
        snapPoints={mediaSnapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#ffffff' }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E1' }}>
        <BottomSheetView>
          <View className="gap-2 px-4 pb-8">
            <Text className="text-xl font-bold text-slate-900">Add media</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => captureMedia('images')}
              className="flex-row items-center gap-3 rounded-xl border border-slate-200/60 p-4 active:bg-slate-50">
              <Camera size={20} color="#2563EB" strokeWidth={2} />
              <Text className="text-base font-medium text-slate-900">Take photo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => captureMedia('videos')}
              className="flex-row items-center gap-3 rounded-xl border border-slate-200/60 p-4 active:bg-slate-50">
              <Video size={20} color="#2563EB" strokeWidth={2} />
              <Text className="text-base font-medium text-slate-900">Record video</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={pickFromGallery}
              className="flex-row items-center gap-3 rounded-xl border border-slate-200/60 p-4 active:bg-slate-50">
              <ImageIcon size={20} color="#2563EB" strokeWidth={2} />
              <Text className="text-base font-medium text-slate-900">Choose from gallery</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => mediaSheetRef.current?.dismiss()}
              className="mt-1 items-center rounded-xl py-3 active:opacity-70">
              <Text className="text-sm font-medium text-slate-500">Cancel</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
