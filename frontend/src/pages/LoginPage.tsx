import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import {
  pageStyle,
  formWrapperStyle,
  headingStyle,
  fieldWrapperStyle,
  labelStyle,
  inputStyle,
  errorTextStyle,
  buttonStyle,
  footerTextStyle,
  footerLinkStyle,
} from "../theme-minimal-login";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

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
    <div style={pageStyle}>
      <div style={formWrapperStyle}>
        <h1 style={headingStyle}>Sign In</h1>
        <form onSubmit={handleSubmit}>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle(focusedField === "email")}
              placeholder="you@example.com"
            />
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle(focusedField === "password")}
              placeholder="••••••••"
            />
          </div>
          {error && <div style={errorTextStyle}>{error}</div>}
          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={footerTextStyle}>
          Don't have an account?{" "}
          <Link to="/register" style={footerLinkStyle}>Register</Link>
        </p>
      </div>
    </div>
  );
}
