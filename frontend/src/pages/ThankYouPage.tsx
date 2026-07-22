import { useParams } from "react-router-dom";
import { colors, radius, shadow, glassBlur } from "../theme-dark";

export default function ThankYouPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: "1rem" }}>
      <div
        style={{
          textAlign: "center",
          background: colors.surfaceTranslucent,
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          padding: "3rem 2rem",
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          boxShadow: shadow.glow,
          maxWidth: "440px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem", color: colors.cyan }}>✓</div>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", color: colors.text }}>Thank you!</h1>
        <p style={{ color: colors.textMuted, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
          Your response has been recorded. We appreciate your feedback.
        </p>
        <a
          href={`/s/${token}`}
          style={{ color: colors.accent, fontSize: "0.875rem", textDecoration: "none" }}
        >
          Submit another response
        </a>
      </div>
    </div>
  );
}
