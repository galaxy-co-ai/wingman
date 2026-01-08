/**
 * TypeScript Design Token Exports
 * Use these for type-safe access to design tokens in JavaScript
 */

export const colors = {
  // Background
  bgPrimary: 'var(--color-bg-primary)',
  bgSecondary: 'var(--color-bg-secondary)',
  bgTertiary: 'var(--color-bg-tertiary)',
  bgElevated: 'var(--color-bg-elevated)',
  bgOverlay: 'var(--color-bg-overlay)',

  // Surface
  surface: 'var(--color-surface)',
  surfaceElevated: 'var(--color-surface-elevated)',
  surfaceHover: 'var(--color-surface-hover)',
  surfaceActive: 'var(--color-surface-active)',

  // Border
  border: 'var(--color-border)',
  borderMuted: 'var(--color-border-muted)',
  borderFocus: 'var(--color-border-focus)',

  // Text
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  textInverse: 'var(--color-text-inverse)',
  textLink: 'var(--color-text-link)',

  // Accent
  accent: 'var(--color-accent)',
  accentHover: 'var(--color-accent-hover)',
  accentMuted: 'var(--color-accent-muted)',
  accentText: 'var(--color-accent-text)',

  // Semantic
  success: 'var(--color-success)',
  successBg: 'var(--color-success-bg)',
  warning: 'var(--color-warning)',
  warningBg: 'var(--color-warning-bg)',
  error: 'var(--color-error)',
  errorBg: 'var(--color-error-bg)',
  info: 'var(--color-info)',
  infoBg: 'var(--color-info-bg)',
} as const;

export const typography = {
  // Font families
  fontSans: 'var(--font-family-sans)',
  fontMono: 'var(--font-family-mono)',

  // Font sizes
  sizeXs: 'var(--font-size-xs)',
  sizeSm: 'var(--font-size-sm)',
  sizeMd: 'var(--font-size-md)',
  sizeLg: 'var(--font-size-lg)',
  sizeXl: 'var(--font-size-xl)',
  size2xl: 'var(--font-size-2xl)',
  size3xl: 'var(--font-size-3xl)',

  // Font weights
  weightNormal: 'var(--font-weight-normal)',
  weightMedium: 'var(--font-weight-medium)',
  weightSemibold: 'var(--font-weight-semibold)',
  weightBold: 'var(--font-weight-bold)',

  // Line heights
  lineHeightTight: 'var(--line-height-tight)',
  lineHeightNormal: 'var(--line-height-normal)',
  lineHeightRelaxed: 'var(--line-height-relaxed)',
} as const;

export const spacing = {
  0: 'var(--spacing-0)',
  1: 'var(--spacing-1)',
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  8: 'var(--spacing-8)',
  10: 'var(--spacing-10)',
  12: 'var(--spacing-12)',
  16: 'var(--spacing-16)',
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
} as const;

export const radius = {
  none: 'var(--radius-none)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  focus: 'var(--shadow-focus)',
} as const;

export const zIndex = {
  base: 'var(--z-base)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  tooltip: 'var(--z-tooltip)',
  toast: 'var(--z-toast)',
} as const;

export const animation = {
  // Durations
  durationInstant: 'var(--duration-instant)',
  durationFast: 'var(--duration-fast)',
  durationNormal: 'var(--duration-normal)',
  durationSlow: 'var(--duration-slow)',
  durationSlower: 'var(--duration-slower)',

  // Easings
  easeLinear: 'var(--ease-linear)',
  easeIn: 'var(--ease-in)',
  easeOut: 'var(--ease-out)',
  easeInOut: 'var(--ease-in-out)',
  easeBounce: 'var(--ease-bounce)',
} as const;

export const layout = {
  windowMinWidth: 'var(--window-min-width)',
  windowMinHeight: 'var(--window-min-height)',
  windowDefaultWidth: 'var(--window-default-width)',
  windowDefaultHeight: 'var(--window-default-height)',
  panelMinWidth: 'var(--panel-min-width)',
  panelMaxWidth: 'var(--panel-max-width)',
  panelDefaultSplit: 'var(--panel-default-split)',
  titlebarHeight: 'var(--titlebar-height)',
  statusbarHeight: 'var(--statusbar-height)',
  tabbarHeight: 'var(--tabbar-height)',
} as const;

// Type definitions for tokens
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadows;
export type ZIndexToken = keyof typeof zIndex;
