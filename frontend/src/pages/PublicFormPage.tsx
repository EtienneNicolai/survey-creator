import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { publicApi } from "../api";
import type { Survey, SubmitAnswer } from "../types";

export default function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) return;
    publicApi.getSurvey(token)
      .then((res) => {
        setSurvey(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = survey
    ? survey.questions.every((q) => answers[q.id] !== undefined && answers[q.id].trim() !== "")
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !survey) return;
    setSubmitting(true);
    setSubmitError("");
    const payload: SubmitAnswer[] = survey.questions.map((q) => ({
      question_id: q.id,
      value: answers[q.id] ?? "",
    }));
    try {
      await publicApi.submit(token, payload);
      navigate(`/s/${token}/thanks`);
    } catch {
      setSubmitError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
        <p>Loading survey...</p>
      </div>
    );
  }

  if (notFound || !survey) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ color: "#374151" }}>Survey not found or no longer active</h2>
          <p style={{ color: "#6b7280" }}>This survey link may have expired or been deactivated.</p>
        </div>
      </div>
    );
  }

  const sorted = [...survey.questions].sort((a, b) => a.order_index - b.order_index);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Survey header */}
        <div style={{ background: "#6366f1", color: "#fff", borderRadius: "8px 8px 0 0", padding: "2rem 2rem 1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{survey.title}</h1>
          {survey.description && (
            <p style={{ margin: "0.5rem 0 0", opacity: 0.85, fontSize: "0.9375rem" }}>{survey.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: "0 0 8px 8px", padding: "1.5rem 2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {sorted.map((question, idx) => (
            <div key={question.id} style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: idx < sorted.length - 1 ? "1px solid #e5e7eb" : "none" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 500, color: "#111827", lineHeight: 1.4 }}>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block", marginBottom: "0.2rem" }}>Q{idx + 1}</span>
                {question.label}
                <span style={{ color: "#ef4444", marginLeft: "0.2rem" }}>*</span>
              </label>

              {/* NPS: 0–10 buttons */}
              {question.type === "nps" && (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAnswer(question.id, String(i))}
                        style={{
                          width: "40px",
                          height: "40px",
                          border: answers[question.id] === String(i) ? "2px solid #6366f1" : "1px solid #d1d5db",
                          borderRadius: "6px",
                          background: answers[question.id] === String(i) ? "#6366f1" : "#fff",
                          color: answers[question.id] === String(i) ? "#fff" : "#374151",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem", fontSize: "0.75rem", color: "#6b7280" }}>
                    <span>0 — Not at all likely</span>
                    <span>10 — Extremely likely</span>
                  </div>
                </div>
              )}

              {/* Rating: 1–scale_max buttons */}
              {question.type === "rating" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {Array.from({ length: question.scale_max ?? 5 }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAnswer(question.id, String(v))}
                      style={{
                        width: "40px",
                        height: "40px",
                        border: answers[question.id] === String(v) ? "2px solid #6366f1" : "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: answers[question.id] === String(v) ? "#6366f1" : "#fff",
                        color: answers[question.id] === String(v) ? "#fff" : "#374151",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {/* Choice: radio buttons */}
              {question.type === "choice" && question.options && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {question.options.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.625rem 0.875rem",
                        border: answers[question.id] === opt ? "2px solid #6366f1" : "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: answers[question.id] === opt ? "#f5f3ff" : "#fff",
                        fontSize: "0.9375rem",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={opt}
                        checked={answers[question.id] === opt}
                        onChange={() => setAnswer(question.id, opt)}
                        style={{ accentColor: "#6366f1" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {/* Text: textarea */}
              {question.type === "text" && (
                <textarea
                  value={answers[question.id] ?? ""}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.9375rem", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                  placeholder="Your answer..."
                />
              )}
            </div>
          ))}

          {submitError && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "4px", fontSize: "0.875rem" }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!allAnswered || submitting}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: allAnswered ? "#6366f1" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: allAnswered && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
          {!allAnswered && (
            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              Please answer all questions to submit.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
