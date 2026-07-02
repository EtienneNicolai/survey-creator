import type { TextAnswer } from "../../types";

interface TextAnswersProps {
  answers: TextAnswer[];
}

export default function TextAnswers({ answers }: TextAnswersProps) {
  if (answers.length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No text responses yet.</p>;
  }

  return (
    <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {answers.map((answer) => (
        <div
          key={answer.response_id}
          style={{ padding: "0.625rem 0.875rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "0.875rem", color: "#374151", lineHeight: 1.5 }}
        >
          {answer.value}
        </div>
      ))}
    </div>
  );
}
