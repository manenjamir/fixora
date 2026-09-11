import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SimulatedMap({
  etaMinutes,
  moving,
  caption,
}: {
  etaMinutes: number;
  moving: boolean;
  caption?: string;
}) {
  const theme = useTheme();
  const progress = useSharedValue(0.18);

  useEffect(() => {
    if (!moving) return;
    progress.value = withRepeat(withTiming(0.72, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [moving, progress]);

  const pinStyle = useAnimatedStyle(() => ({
    left: 28 + progress.value * 200,
    top: 150 - progress.value * 80,
  }));

  return (
    <View style={[styles.map, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.road, styles.roadA]} />
      <View style={[styles.road, styles.roadB]} />
      <View style={styles.you}>
        <Ionicons name="home" size={18} color={theme.accent} />
        <ThemedText type="smallBold">You</ThemedText>
      </View>
      <Animated.View style={[styles.pin, pinStyle]}>
        <Ionicons name="car" size={18} color="#ffffff" />
      </Animated.View>
      <View style={[styles.eta, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">
          {caption ?? (moving ? `${etaMinutes} min away` : 'Waiting for dispatch')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  road: {
    position: 'absolute',
    backgroundColor: 'rgba(27, 111, 219, 0.18)',
    borderRadius: 8,
  },
  roadA: {
    width: '120%',
    height: 18,
    top: '46%',
    left: '-10%',
    transform: [{ rotate: '-8deg' }],
  },
  roadB: {
    width: 18,
    height: '90%',
    left: '38%',
    top: '8%',
  },
  you: {
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B6FDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eta: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
});
