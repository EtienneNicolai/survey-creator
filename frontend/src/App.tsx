import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BuilderPage from "./pages/BuilderPage";
import ResultsPage from "./pages/ResultsPage";
import PublicFormPage from "./pages/PublicFormPage";
import ThankYouPage from "./pages/ThankYouPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/builder" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/s/:token" element={<PublicFormPage />} />
        <Route path="/s/:token/thanks" element={<ThankYouPage />} />
      </Routes>
    </BrowserRouter>
  );
}
