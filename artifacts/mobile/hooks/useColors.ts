import { useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the active theme.
 */
export function useColors() {
  const { theme } = useTheme();
  const palette = theme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
