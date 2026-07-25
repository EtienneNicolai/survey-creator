import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { colors, radius, shadow } from "../theme-dark";

export default function LoginPage() {
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
      const res = await authApi.login(email, password);
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <div style={{ background: colors.surface, padding: "2rem", borderRadius: radius.md, border: `1px solid ${colors.border}`, boxShadow: shadow.glow, width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.5rem", color: colors.text }}>Sign In</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, color: colors.textMuted }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: "1rem", boxSizing: "border-box", background: colors.neutralFill, color: colors.text }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, color: colors.textMuted }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: "1rem", boxSizing: "border-box", background: colors.neutralFill, color: colors.text }}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: colors.dangerSoft, color: colors.danger, borderRadius: radius.sm, fontSize: "0.875rem", border: `1px solid ${colors.dangerBorder}` }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.625rem", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: radius.sm, fontSize: "1rem", fontWeight: 600, boxShadow: shadow.glow, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center", color: colors.textMuted }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: colors.accent, textDecoration: "none" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
