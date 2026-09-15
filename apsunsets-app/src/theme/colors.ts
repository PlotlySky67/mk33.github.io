export const colors = {
  bg: '#140B18',
  surface: '#1F1522',
  surfaceAlt: '#2A1C2E',
  border: 'rgba(248, 239, 231, 0.10)',
  text: '#F8EFE7',
  textMuted: 'rgba(248, 239, 231, 0.62)',
  textFaint: 'rgba(248, 239, 231, 0.38)',
  accent: '#FF7E5F',
  accentSoft: 'rgba(255, 126, 95, 0.16)',
  danger: '#FF6B6B',
} as const;

export const gradient = ['#FF9966', '#FF5E62', '#6A3093'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
