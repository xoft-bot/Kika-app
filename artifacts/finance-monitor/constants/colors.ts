const palette = {
  bg: "#0A0E1A",
  bgElevated: "#0F1525",
  card: "#111827",
  cardElevated: "#1A2235",
  border: "#1E2D45",
  borderStrong: "#2A3B57",

  primary: "#00C896",
  primarySoft: "rgba(0, 200, 150, 0.14)",
  primaryDim: "rgba(0, 200, 150, 0.30)",

  accent: "#60A5FA",
  accentSoft: "rgba(96, 165, 250, 0.16)",

  warn: "#F59E0B",
  warnSoft: "rgba(245, 158, 11, 0.16)",
  danger: "#EF4444",
  dangerSoft: "rgba(239, 68, 68, 0.16)",

  text: "#F0F4FF",
  textMuted: "#94A3B8",
  textDim: "#64748B",

  white: "#FFFFFF",
  mtn: "#FFCC00",
  airtel: "#E4003A",
  bank: "#3B82F6",
};

const colors = {
  light: {
    text: palette.text,
    tint: palette.primary,

    background: palette.bg,
    foreground: palette.text,

    card: palette.card,
    cardForeground: palette.text,

    primary: palette.primary,
    primaryForeground: palette.bg,

    secondary: palette.cardElevated,
    secondaryForeground: palette.text,

    muted: palette.cardElevated,
    mutedForeground: palette.textMuted,

    accent: palette.accent,
    accentForeground: palette.bg,

    destructive: palette.danger,
    destructiveForeground: palette.white,

    border: palette.border,
    input: palette.border,

    // Extended brand tokens
    bg: palette.bg,
    bgElevated: palette.bgElevated,
    cardElevated: palette.cardElevated,
    borderStrong: palette.borderStrong,
    primarySoft: palette.primarySoft,
    primaryDim: palette.primaryDim,
    accentSoft: palette.accentSoft,
    warn: palette.warn,
    warnSoft: palette.warnSoft,
    danger: palette.danger,
    dangerSoft: palette.dangerSoft,
    textMuted: palette.textMuted,
    textDim: palette.textDim,
    mtn: palette.mtn,
    airtel: palette.airtel,
    bank: palette.bank,
  },
  dark: {
    text: palette.text,
    tint: palette.primary,

    background: palette.bg,
    foreground: palette.text,

    card: palette.card,
    cardForeground: palette.text,

    primary: palette.primary,
    primaryForeground: palette.bg,

    secondary: palette.cardElevated,
    secondaryForeground: palette.text,

    muted: palette.cardElevated,
    mutedForeground: palette.textMuted,

    accent: palette.accent,
    accentForeground: palette.bg,

    destructive: palette.danger,
    destructiveForeground: palette.white,

    border: palette.border,
    input: palette.border,

    bg: palette.bg,
    bgElevated: palette.bgElevated,
    cardElevated: palette.cardElevated,
    borderStrong: palette.borderStrong,
    primarySoft: palette.primarySoft,
    primaryDim: palette.primaryDim,
    accentSoft: palette.accentSoft,
    warn: palette.warn,
    warnSoft: palette.warnSoft,
    danger: palette.danger,
    dangerSoft: palette.dangerSoft,
    textMuted: palette.textMuted,
    textDim: palette.textDim,
    mtn: palette.mtn,
    airtel: palette.airtel,
    bank: palette.bank,
  },
  radius: 14,
};

export default colors;
