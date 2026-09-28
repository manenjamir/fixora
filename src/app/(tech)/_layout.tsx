import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth';

export default function TechLayout() {
  const { profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || profile?.role !== 'tech') return;
    const missing = (profile.specializations ?? []).length === 0;
    const onSpecializations = segments.join('/').includes('specializations');
    if (missing && !onSpecializations) {
      router.replace('/(tech)/specializations');
    }
  }, [loading, profile, router, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ title: 'Job' }} />
      <Stack.Screen name="specializations" options={{ title: 'Specializations' }} />
    </Stack>
  );
}
