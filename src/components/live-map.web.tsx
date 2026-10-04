import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MapPin } from '@/lib/geo';

export function LiveMap({ pins, caption }: { pins: MapPin[]; caption?: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.map, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">{caption ?? 'Live location'}</ThemedText>
      {pins.length === 0 ? (
        <ThemedText themeColor="textSecondary">Waiting for a live location</ThemedText>
      ) : (
        pins.map((pin) => (
          <ThemedText key={pin.id} themeColor="textSecondary">
            {pin.title}: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
          </ThemedText>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    minHeight: 160,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
