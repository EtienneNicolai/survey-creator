import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { surveyApi } from "../api";
import type { Survey } from "../types";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const res = await surveyApi.list();
      setSurveys(res.data);
    } catch {
      setError("Failed to load surveys.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await surveyApi.create(newTitle.trim(), newDescription.trim() || undefined);
      setSurveys([res.data, ...surveys]);
      setNewTitle("");
      setNewDescription("");
      setShowCreate(false);
    } catch {
      setError("Failed to create survey.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    try {
      await surveyApi.delete(id);
      setSurveys(surveys.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete survey.");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await surveyApi.toggle(id);
      setSurveys(surveys.map((s) => s.id === id ? { ...s, is_active: res.data.is_active } : s));
    } catch {
      setError("Failed to toggle survey status.");
    }
  };

  const handleCopyLink = (survey: Survey) => {
    const link = `${window.location.origin}/s/${survey.share_token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(survey.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#111827" }}>Survey Creator</h1>
        <button
          onClick={handleLogout}
          style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#374151" }}
        >
          Logout
        </button>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem" }}>
        {error && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        {/* Create button / form */}
        <div style={{ marginBottom: "1.5rem" }}>
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: "0.625rem 1.25rem", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }}
            >
              + New Survey
            </button>
          ) : (
            <form onSubmit={handleCreate} style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: "500px" }}>
              <h3 style={{ margin: "0 0 1rem" }}>Create New Survey</h3>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px", boxSizing: "border-box" }}
                  placeholder="My Survey"
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px", boxSizing: "border-box" }}
                  placeholder="Optional description"
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewTitle(""); setNewDescription(""); }}
                  style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Survey list */}
        {surveys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <p>No surveys yet. Create your first survey above.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {surveys.map((survey) => (
              <div key={survey.id} style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: "1.125rem", color: "#111827" }}>{survey.title}</h2>
                      <span style={{
                        padding: "0.125rem 0.5rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: survey.is_active ? "#d1fae5" : "#f3f4f6",
                        color: survey.is_active ? "#065f46" : "#6b7280"
                      }}>
                        {survey.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {survey.description && (
                      <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>{survey.description}</p>
                    )}
                    <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "#6b7280", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <span>{survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}</span>
                      <span>{survey.response_count} response{survey.response_count !== 1 ? "s" : ""}</span>
                      <span>Created {new Date(survey.created_at).toLocaleDateString()}</span>
                    </div>
                    {/* Share link */}
                    <div style={{ marginTop: "0.625rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#6b7280", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "320px" }}>
                        {window.location.origin}/s/{survey.share_token}
                      </span>
                      <button
                        onClick={() => handleCopyLink(survey)}
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", background: copiedId === survey.id ? "#d1fae5" : "#fff", cursor: "pointer", color: copiedId === survey.id ? "#065f46" : "#374151", whiteSpace: "nowrap" }}
                      >
                        {copiedId === survey.id ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <Link
                      to={`/surveys/${survey.id}/builder`}
                      style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", backgroundColor: "#6366f1", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
                    >
                      Builder
                    </Link>
                    <Link
                      to={`/surveys/${survey.id}/results`}
                      style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", backgroundColor: "#0ea5e9", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
                    >
                      Results
                    </Link>
                    <button
                      onClick={() => handleToggle(survey.id)}
                      style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#374151" }}
                    >
                      {survey.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", border: "1px solid #fca5a5", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#dc2626" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
