import { useState, useEffect } from "react";
import type { Question } from "../../types";
import { questionApi } from "../../api";
import { colors, fonts, radius } from "../../theme-dark";

interface QuestionEditorProps {
  question: Question;
  onUpdated: (updated: Question) => void;
}

export default function QuestionEditor({ question, onUpdated }: QuestionEditorProps) {
  const [label, setLabel] = useState(question.label);
  const [scaleMax, setScaleMax] = useState<number>(question.scale_max ?? 5);
  const [options, setOptions] = useState<string[]>(question.options ?? [""]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Reset editor when question changes
  useEffect(() => {
    setLabel(question.label);
    setScaleMax(question.scale_max ?? 5);
    setOptions(question.options ?? [""]);
    setSaved(false);
    setError("");
  }, [question.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Partial<{ label: string; options: string[]; scale_max: number }> = { label };
      if (question.type === "rating") payload.scale_max = scaleMax;
      if (question.type === "choice") payload.options = options.filter((o) => o.trim() !== "");
      const res = await questionApi.update(question.id, payload);
      onUpdated(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));

  return (
    <form onSubmit={handleSave} style={{ padding: "1.5rem" }}>
      <h3 style={{ marginTop: 0, fontSize: "1rem", color: colors.text }}>
        Edit <span style={{ fontFamily: fonts.mono }}>{question.type.toUpperCase()}</span> Question
      </h3>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.875rem", color: colors.text }}>Label *</label>
        <textarea
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          rows={3}
          style={{ width: "100%", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box", background: colors.neutralFill, color: colors.text }}
        />
      </div>

      {question.type === "rating" && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.875rem", color: colors.text }}>Max Rating Scale</label>
          <input
            type="number"
            min={2}
            max={10}
            value={scaleMax}
            onChange={(e) => setScaleMax(Number(e.target.value))}
            style={{ width: "80px", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: "0.875rem", background: colors.neutralFill, color: colors.text }}
          />
        </div>
      )}

      {question.type === "nps" && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: colors.accentSoft, borderRadius: radius.sm, fontSize: "0.8125rem", color: colors.textMuted, border: `1px solid ${colors.border}` }}>
          NPS questions always use a 0–10 scale.
        </div>
      )}

      {question.type === "choice" && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem", color: colors.text }}>Options</label>
          {options.map((opt, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                style={{ flex: 1, padding: "0.4rem 0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: "0.875rem", background: colors.neutralFill, color: colors.text }}
                placeholder={`Option ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={options.length === 1}
                style={{ padding: "0.4rem 0.5rem", border: `1px solid ${colors.dangerBorder}`, borderRadius: radius.sm, background: "transparent", cursor: "pointer", color: colors.danger, opacity: options.length === 1 ? 0.4 : 1 }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            style={{ fontSize: "0.8125rem", padding: "0.3rem 0.6rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.neutralFill, cursor: "pointer", color: colors.text }}
          >
            + Add option
          </button>
        </div>
      )}

      {question.type === "text" && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: colors.neutralFill, borderRadius: radius.sm, fontSize: "0.8125rem", color: colors.textMuted, border: `1px solid ${colors.border}` }}>
          Text questions accept any free-form response.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: colors.dangerSoft, color: colors.danger, borderRadius: radius.sm, fontSize: "0.8125rem", border: `1px solid ${colors.dangerBorder}` }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: "0.5rem 1.25rem",
          backgroundColor: saved ? colors.cyan : colors.accent,
          color: saved ? colors.bg : "#fff",
          border: "none",
          borderRadius: radius.sm,
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "0.875rem",
          fontWeight: 600,
          transition: "background-color 0.2s",
        }}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
      </button>
    </form>
  );
}
