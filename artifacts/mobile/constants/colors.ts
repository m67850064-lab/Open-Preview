// Vertex AI light palette — matches the web app screenshot
const lightPalette = {
  // Core backgrounds
  background: '#eef2fb',       // very light blue-gray
  foreground: '#1a1c2e',

  // Surfaces
  surface: '#ffffff',           // white cards
  surfaceHover: '#e3e9f7',
  surfaceLight: '#d4dcf0',
  sidebar: '#e3e9f6',           // sidebar/drawer bg

  // Brand — Vertex AI blue & purple
  primary: '#4285f4',
  primaryForeground: '#ffffff',
  brand: '#4285f4',             // primary blue
  brandPurple: '#7c3aed',       // gradient end
  brandLight: '#6ba8ff',

  // Gradient colors
  gradientStart: '#4f7af8',
  gradientEnd: '#8b5cf6',

  // Text
  text: '#1a1c2e',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',

  // Cards / elevated surfaces
  card: '#ffffff',
  cardForeground: '#1a1c2e',

  // Secondary
  secondary: '#f3f4f6',
  secondaryForeground: '#374151',

  // Muted
  muted: '#f3f4f6',
  mutedForeground: '#9ca3af',

  // Accent
  accent: '#eff6ff',
  accentForeground: '#1d4ed8',

  // Destructive
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',

  // Borders & inputs
  border: '#d1dae8',
  input: '#eef2fb',

  // Legacy aliases
  tint: '#4285f4',
};

const colors = {
  light: lightPalette,
  dark: lightPalette,   // force light-only to match web app
  radius: 12,
};

export default colors;
