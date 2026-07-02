import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register(email, password);
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
      <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.5rem", color: "#111827" }}>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, color: "#374151" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem", boxSizing: "border-box" }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, color: "#374151" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem", boxSizing: "border-box" }}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "4px", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.625rem", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "4px", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center", color: "#6b7280" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#6366f1", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
