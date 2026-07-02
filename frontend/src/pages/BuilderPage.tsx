import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { surveyApi, questionApi } from "../api";
import type { Survey, Question } from "../types";
import QuestionCard from "../components/builder/QuestionCard";
import QuestionEditor from "../components/builder/QuestionEditor";
import AddQuestionMenu from "../components/builder/AddQuestionMenu";

export default function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const surveyId = Number(id);

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const res = await surveyApi.get(surveyId);
      setSurvey(res.data);
      const sorted = [...res.data.questions].sort((a, b) => a.order_index - b.order_index);
      setQuestions(sorted);
    } catch {
      setError("Failed to load survey.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const newOrder = arrayMove(questions, oldIndex, newIndex);
    setQuestions(newOrder); // optimistic update
    try {
      await questionApi.reorder(surveyId, newOrder.map((q) => q.id));
    } catch {
      setError("Failed to save new order.");
      // Roll back
      setQuestions(questions);
    }
  };

  const handleAddQuestion = async (type: "nps" | "rating" | "choice" | "text") => {
    const defaults: Record<string, { label: string; scale_max?: number; options?: string[] }> = {
      nps: { label: "How likely are you to recommend us to a friend or colleague?" },
      rating: { label: "How would you rate your experience?", scale_max: 5 },
      choice: { label: "Please select an option:", options: ["Option A", "Option B", "Option C"] },
      text: { label: "Please share any additional comments." },
    };
    try {
      const res = await questionApi.add(surveyId, { type, ...defaults[type] });
      const newQuestions = [...questions, res.data];
      setQuestions(newQuestions);
      setSelectedId(res.data.id);
    } catch {
      setError("Failed to add question.");
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Delete this question?")) return;
    try {
      await questionApi.delete(questionId);
      const remaining = questions.filter((q) => q.id !== questionId);
      setQuestions(remaining);
      if (selectedId === questionId) setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    } catch {
      setError("Failed to delete question.");
    }
  };

  const handleQuestionUpdated = (updated: Question) => {
    setQuestions(questions.map((q) => q.id === updated.id ? updated : q));
  };

  const selectedQuestion = questions.find((q) => q.id === selectedId) ?? null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}>← Dashboard</Link>
        <span style={{ color: "#d1d5db" }}>|</span>
        <h1 style={{ margin: 0, fontSize: "1rem", color: "#111827", flex: 1 }}>
          {survey?.title ?? "Survey Builder"}
        </h1>
        <Link
          to={`/surveys/${surveyId}/results`}
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", backgroundColor: "#0ea5e9", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
        >
          View Results
        </Link>
      </header>

      {error && (
        <div style={{ margin: "0.5rem 1.5rem", padding: "0.625rem 0.875rem", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "4px", fontSize: "0.875rem" }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>×</button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel: question list */}
        <div style={{ width: "320px", flexShrink: 0, borderRight: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#374151" }}>
              Questions ({questions.length})
            </span>
            <button
              onClick={() => setShowAddMenu(true)}
              style={{ padding: "0.375rem 0.75rem", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8125rem" }}
            >
              + Add
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#9ca3af", fontSize: "0.875rem" }}>
                No questions yet. Click "+ Add" to get started.
              </div>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      isSelected={q.id === selectedId}
                      onSelect={() => setSelectedId(q.id)}
                      onDelete={() => handleDeleteQuestion(q.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right panel: question editor */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {selectedQuestion ? (
            <QuestionEditor
              key={selectedQuestion.id}
              question={selectedQuestion}
              onUpdated={handleQuestionUpdated}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>Select a question to edit it</p>
                <p style={{ fontSize: "0.8125rem" }}>or click "+ Add" to create a new question</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddMenu && (
        <AddQuestionMenu
          onAdd={handleAddQuestion}
          onClose={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}
