import { Slot } from 'expo-router';

// Single-screen chat app — no tab bar needed.
// Slot renders the active child route directly.
export default function TabsLayout() {
  return <Slot />;
}
