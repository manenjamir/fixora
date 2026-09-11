import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[category]" options={{ title: 'Book a technician' }} />
      <Stack.Screen name="track/[id]" options={{ title: 'Live tracking' }} />
      <Stack.Screen name="estimate/[id]" options={{ title: 'Repair estimate' }} />
      <Stack.Screen name="warehouse/[id]" options={{ title: 'Warehouse' }} />
    </Stack>
  );
}
