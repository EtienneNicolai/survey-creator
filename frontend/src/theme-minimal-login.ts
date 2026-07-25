import type { CSSProperties } from "react";

// Shared "Minimal / Editorial" style constants for LoginPage and RegisterPage.
// Near-monochrome palette with a single muted accent reserved for the
// focus state and the primary submit button only.

export const colors = {
  background: "#fafaf9",
  textPrimary: "#1c1917",
  textMuted: "#78716c",
  hairline: "#e7e5e4",
  accent: "#3f6212",
};

export const fonts = {
  serif: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
  padding: "2rem 1.5rem",
  boxSizing: "border-box",
};

export const formWrapperStyle: CSSProperties = {
  width: "100%",
  maxWidth: "380px",
};

export const headingStyle: CSSProperties = {
  fontFamily: fonts.serif,
  fontWeight: 400,
  fontSize: "2.5rem",
  lineHeight: 1.2,
  color: colors.textPrimary,
  marginTop: 0,
  marginBottom: "2.75rem",
  letterSpacing: "-0.01em",
};

export const fieldWrapperStyle: CSSProperties = {
  marginBottom: "1.75rem",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: fonts.sans,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: colors.textMuted,
  marginBottom: "0.625rem",
};

export function inputStyle(focused: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "0.625rem 0.125rem",
    fontFamily: fonts.sans,
    fontSize: "1rem",
    color: colors.textPrimary,
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${focused ? colors.accent : colors.hairline}`,
    borderRadius: 0,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  };
}

export const errorTextStyle: CSSProperties = {
  fontFamily: fonts.sans,
  fontStyle: "italic",
  fontSize: "0.875rem",
  color: colors.textMuted,
  marginTop: "-0.5rem",
  marginBottom: "1.5rem",
};

export function buttonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "0.875rem 1.5rem",
    marginTop: "0.5rem",
    fontFamily: fonts.sans,
    fontSize: "1rem",
    color: colors.background,
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: 0,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "opacity 0.15s ease",
  };
}

export const footerTextStyle: CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: "0.875rem",
  color: colors.textMuted,
  marginTop: "2.5rem",
  textAlign: "center",
};

export const footerLinkStyle: CSSProperties = {
  color: colors.textPrimary,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};
