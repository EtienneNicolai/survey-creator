import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question } from "../../types";

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const TYPE_LABELS: Record<Question["type"], string> = {
  nps: "NPS",
  rating: "Rating",
  choice: "Choice",
  text: "Text",
};

const TYPE_COLORS: Record<Question["type"], string> = {
  nps: "#6366f1",
  rating: "#0ea5e9",
  choice: "#f59e0b",
  text: "#10b981",
};

export default function QuestionCard({ question, isSelected, onSelect, onDelete }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        onClick={onSelect}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          background: isSelected ? "#f5f3ff" : "#fff",
          border: isSelected ? "2px solid #6366f1" : "1px solid #e5e7eb",
          borderRadius: "6px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Drag handle */}
        <span
          {...listeners}
          style={{ cursor: "grab", color: "#9ca3af", fontSize: "1rem", flexShrink: 0, touchAction: "none" }}
          title="Drag to reorder"
        >
          ⠿
        </span>

        {/* Type badge */}
        <span style={{
          flexShrink: 0,
          padding: "0.125rem 0.4rem",
          borderRadius: "4px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          backgroundColor: TYPE_COLORS[question.type] + "20",
          color: TYPE_COLORS[question.type],
          letterSpacing: "0.03em",
        }}>
          {TYPE_LABELS[question.type]}
        </span>

        {/* Label */}
        <span style={{ flex: 1, minWidth: 0, fontSize: "0.875rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {question.label}
        </span>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ flexShrink: 0, padding: "0.2rem 0.4rem", border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1rem" }}
          title="Delete question"
        >
          ×
        </button>
      </div>
    </div>
  );
}
