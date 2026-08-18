import { Stack } from 'expo-router';

// Single-screen chat app — no tab bar needed.
// Explicitly declare the child route so Expo Router always finds a screen.
export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
