import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { corporateTheme } from "../theme-corporate-login";

const { colors, radius, fontFamily } = corporateTheme;

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.background, fontFamily }}>
      <div style={{ background: "#ffffff", padding: "2rem", borderRadius: radius, border: `1px solid ${colors.border}`, width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.375rem", fontWeight: 600, color: colors.heading }}>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.875rem", color: colors.bodyText }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius, fontSize: "0.9375rem", fontFamily, boxSizing: "border-box", color: colors.heading }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.875rem", color: colors.bodyText }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: "100%", padding: "0.5rem", border: `1px solid ${colors.border}`, borderRadius: radius, fontSize: "0.9375rem", fontFamily, boxSizing: "border-box", color: colors.heading }}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: colors.errorBg, color: colors.errorText, border: `1px solid ${colors.errorText}`, borderRadius: radius, fontSize: "0.8125rem" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.625rem", backgroundColor: colors.primary, color: "#ffffff", border: "none", borderRadius: radius, fontSize: "0.9375rem", fontWeight: 500, fontFamily, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: colors.bodyText }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: colors.primary, textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
