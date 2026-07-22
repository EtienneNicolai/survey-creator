import { colors, fonts, radius, shadow, glassBlur } from "../../theme-dark";

interface AddQuestionMenuProps {
  onAdd: (type: "nps" | "rating" | "choice" | "text") => void;
  onClose: () => void;
}

const TYPE_OPTIONS: { type: "nps" | "rating" | "choice" | "text"; label: string; desc: string }[] = [
  { type: "nps", label: "NPS", desc: "Net Promoter Score (0–10)" },
  { type: "rating", label: "Rating", desc: "Numeric scale (e.g. 1–5)" },
  { type: "choice", label: "Multiple Choice", desc: "Pick one from a list" },
  { type: "text", label: "Text", desc: "Free-form text response" },
];

export default function AddQuestionMenu({ onAdd, onClose }: AddQuestionMenuProps) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div
        style={{
          background: colors.surfaceTranslucent,
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          boxShadow: shadow.modal,
          padding: "1.5rem",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem", color: colors.text }}>Add Question</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: colors.textMuted }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {TYPE_OPTIONS.map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); onClose(); }}
              style={{ textAlign: "left", padding: "0.75rem 1rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.neutralFill, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.accentSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = colors.neutralFill)}
            >
              <div style={{ fontFamily: fonts.mono, fontWeight: 600, color: colors.text, letterSpacing: "0.02em" }}>{label}</div>
              <div style={{ fontSize: "0.8125rem", color: colors.textMuted, marginTop: "0.125rem" }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
