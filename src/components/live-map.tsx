import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cameraForPins, type MapPin } from '@/lib/geo';

export function LiveMap({ pins, caption }: { pins: MapPin[]; caption?: string }) {
  const theme = useTheme();
  const cameraPosition = cameraForPins(pins);
  const mapsKeyConfigured = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
  const appleMarkers = pins.map((pin) => ({
    id: pin.id,
    coordinates: { latitude: pin.latitude, longitude: pin.longitude },
    title: pin.title,
    systemImage: pin.kind === 'technician' ? 'car.fill' : 'house.fill',
    tintColor: pin.kind === 'technician' ? '#208AEF' : '#15803D',
  }));
  const googleMarkers = pins.map((pin) => ({
    id: pin.id,
    coordinates: { latitude: pin.latitude, longitude: pin.longitude },
    title: pin.title,
  }));

  return (
    <View style={[styles.map, { backgroundColor: theme.backgroundSelected }]}>
      {pins.length === 0 || !cameraPosition ? (
        <View style={styles.empty}>
          <ThemedText type="smallBold">Waiting for a live location</ThemedText>
        </View>
      ) : Platform.OS === 'android' && !mapsKeyConfigured ? (
        <View style={styles.empty}>
          <ThemedText type="smallBold">Map unavailable until a Google Maps API key is added and the Android app is rebuilt.</ThemedText>
        </View>
      ) : Platform.OS === 'ios' ? (
        <AppleMaps.View style={styles.fill} cameraPosition={cameraPosition} markers={appleMarkers} />
      ) : Platform.OS === 'android' ? (
        <GoogleMaps.View style={styles.fill} cameraPosition={cameraPosition} markers={googleMarkers} />
      ) : (
        <View style={styles.empty}>
          <ThemedText type="smallBold">Maps are available on Android and iOS</ThemedText>
        </View>
      )}
      {caption ? (
        <View style={[styles.caption, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold">{caption}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  caption: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    bottom: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
