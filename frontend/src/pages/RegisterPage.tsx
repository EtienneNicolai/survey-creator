import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { playfulTheme } from "../theme-playful-login";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: playfulTheme.colors.background, fontFamily: playfulTheme.fonts.base }}>
      <div style={{ background: playfulTheme.colors.cardBackground, padding: "2.5rem", borderRadius: playfulTheme.radii.card, boxShadow: playfulTheme.shadows.card, width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.875rem", fontWeight: 700, color: playfulTheme.colors.text }}>Join the fun! 🎉</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600, color: playfulTheme.colors.text }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem 1rem", border: `2px solid ${playfulTheme.colors.border}`, borderRadius: playfulTheme.radii.input, fontSize: "1rem", boxSizing: "border-box", fontFamily: playfulTheme.fonts.base, color: playfulTheme.colors.text }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600, color: playfulTheme.colors.text }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: "100%", padding: "0.75rem 1rem", border: `2px solid ${playfulTheme.colors.border}`, borderRadius: playfulTheme.radii.input, fontSize: "1rem", boxSizing: "border-box", fontFamily: playfulTheme.fonts.base, color: playfulTheme.colors.text }}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", backgroundColor: playfulTheme.colors.errorBg, color: playfulTheme.colors.errorText, borderRadius: playfulTheme.radii.input, fontSize: "0.875rem", fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              backgroundColor: playfulTheme.colors.primary,
              color: "#fff",
              border: "none",
              borderRadius: playfulTheme.radii.pill,
              fontSize: "1.0625rem",
              fontWeight: 700,
              fontFamily: playfulTheme.fonts.base,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: playfulTheme.shadows.card,
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={{ marginTop: "1.5rem", textAlign: "center", color: playfulTheme.colors.textMuted }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: playfulTheme.colors.secondary, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
