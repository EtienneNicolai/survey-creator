import { useParams } from "react-router-dom";

export default function ThankYouPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", padding: "1rem" }}>
      <div style={{ textAlign: "center", background: "#fff", padding: "3rem 2rem", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxWidth: "440px", width: "100%" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✓</div>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", color: "#111827" }}>Thank you!</h1>
        <p style={{ color: "#6b7280", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
          Your response has been recorded. We appreciate your feedback.
        </p>
        <a
          href={`/s/${token}`}
          style={{ color: "#6366f1", fontSize: "0.875rem", textDecoration: "none" }}
        >
          Submit another response
        </a>
      </div>
    </div>
  );
}
