// Shared visual constants for the "Dark Modern-SaaS" theme.
// Pure presentation values only — no logic, no component behavior.

export const colors = {
  bg: "#0a0a0f",
  surface: "#13131a",
  surfaceTranslucent: "rgba(19, 19, 26, 0.72)",

  text: "#e4e4e7",
  textMuted: "#a1a1aa",

  accent: "#8b5cf6",
  accentHover: "#7c3aed",
  accentSoft: "rgba(139, 92, 246, 0.15)",
  accentSofter: "rgba(139, 92, 246, 0.1)",
  accentBorder: "rgba(139, 92, 246, 0.4)",

  cyan: "#22d3ee",
  cyanSoft: "rgba(34, 211, 238, 0.15)",
  cyanBorder: "rgba(34, 211, 238, 0.4)",

  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",

  danger: "#f87171",
  dangerSoft: "rgba(248, 113, 113, 0.12)",
  dangerBorder: "rgba(248, 113, 113, 0.35)",

  neutralFill: "#1c1c24",
  neutralFillHover: "#22222c",
  disabledFill: "#26262f",
  disabledText: "#6b6b76",
};

export const fonts = {
  mono: 'ui-monospace, "SF Mono", monospace',
};

export const radius = {
  sm: "8px",
  md: "10px",
};

export const shadow = {
  glow: `0 0 0 1px ${colors.accentSoft}, 0 4px 20px ${colors.accentSofter}`,
  glowStrong: `0 0 0 1px rgba(139, 92, 246, 0.35), 0 4px 24px rgba(139, 92, 246, 0.25)`,
  modal: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 48px rgba(0, 0, 0, 0.5)",
};

export const glassBlur = "blur(8px)";
