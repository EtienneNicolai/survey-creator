import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { surveyApi } from "../api";
import type { SurveyResults } from "../types";
import NpsChart from "../components/results/NpsChart";
import RatingChart from "../components/results/RatingChart";
import ChoiceChart from "../components/results/ChoiceChart";
import TextAnswers from "../components/results/TextAnswers";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const surveyId = Number(id);

  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, [surveyId]);

  const loadResults = async () => {
    try {
      const res = await surveyApi.results(surveyId);
      setResults(res.data);
    } catch {
      setError("Failed to load results.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#dc2626" }}>{error || "Results not found."}</p>
          <Link to="/" style={{ color: "#6366f1" }}>Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}>← Dashboard</Link>
        <span style={{ color: "#d1d5db" }}>|</span>
        <h1 style={{ margin: 0, fontSize: "1rem", color: "#111827", flex: 1 }}>
          Results: {results.survey.title}
        </h1>
        <Link
          to={`/surveys/${surveyId}/builder`}
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", backgroundColor: "#6366f1", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
        >
          Builder
        </Link>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Summary */}
        <div style={{ background: "#fff", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>{results.total_responses}</div>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>total response{results.total_responses !== 1 ? "s" : ""}</div>
          <button
            onClick={loadResults}
            style={{ marginTop: "0.75rem", padding: "0.375rem 0.75rem", fontSize: "0.8125rem", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#374151" }}
          >
            Refresh
          </button>
        </div>

        {/* Question results */}
        {results.results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            No responses yet. Share your survey link to start collecting responses.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {results.results.map((qResult, idx) => (
              <div key={qResult.question.id} style={{ background: "#fff", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Q{idx + 1} · {qResult.question.type}
                  </span>
                  <h2 style={{ margin: "0.25rem 0 0", fontSize: "1rem", color: "#111827" }}>
                    {qResult.question.label}
                  </h2>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    {qResult.response_count} response{qResult.response_count !== 1 ? "s" : ""}
                  </div>
                </div>

                {qResult.response_count === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No responses for this question yet.</p>
                ) : (
                  <>
                    {qResult.question.type === "nps" && qResult.nps && (
                      <NpsChart result={qResult.nps} />
                    )}
                    {qResult.question.type === "rating" && qResult.rating && (
                      <RatingChart result={qResult.rating} />
                    )}
                    {qResult.question.type === "choice" && qResult.choice && (
                      <ChoiceChart result={qResult.choice} />
                    )}
                    {qResult.question.type === "text" && qResult.text_answers && (
                      <TextAnswers answers={qResult.text_answers} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
