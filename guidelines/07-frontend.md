# Guideline 07 — Frontend (Session 6)

## Scope
All TypeScript React code in `frontend/src/`. This is a single-session job.

## Prerequisite
Session 5 must be complete — the backend must be running at `http://localhost:8000`.

## Setup
The `frontend/` directory is pre-scaffolded with `package.json`, `tsconfig.json`, `vite.config.ts`.
Run `npm install` first — do NOT run `npm create vite` (this would overwrite the scaffold).

```powershell
cd frontend
npm install
```

## Architecture
React Router handles all client-side navigation. All backend calls use axios with a shared client.

### Pages
| Route | Component | Auth Required |
|---|---|---|
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/` | `DashboardPage` | Yes |
| `/surveys/:id/builder` | `BuilderPage` | Yes |
| `/surveys/:id/results` | `ResultsPage` | Yes |
| `/s/:token` | `PublicFormPage` | No |
| `/s/:token/thanks` | `ThankYouPage` | No |

### File structure
```
frontend/src/
  api.ts            — axios instance + all API call functions
  types.ts          — TypeScript interfaces (Survey, Question, Response, etc.)
  App.tsx           — Router setup, protected route wrapper
  main.tsx          — ReactDOM.createRoot (pre-scaffolded)
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx
    BuilderPage.tsx
    ResultsPage.tsx
    PublicFormPage.tsx
    ThankYouPage.tsx
  components/
    builder/
      QuestionCard.tsx    — single draggable question item
      QuestionEditor.tsx  — edit label, options, scale_max
      AddQuestionMenu.tsx — pick type: NPS / Rating / Choice / Text
    results/
      NpsChart.tsx
      RatingChart.tsx
      ChoiceChart.tsx
      TextAnswers.tsx
```

## `frontend/src/types.ts`

```typescript
export interface User {
  id: number;
  email: string;
}

export interface Question {
  id: number;
  survey_id: number;
  type: "nps" | "rating" | "choice" | "text";
  label: string;
  options: string[] | null;
  scale_max: number | null;
  order_index: number;
}

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  share_token: string;
  response_count: number;
  questions: Question[];
  created_at: string;
}

export interface SubmitAnswer {
  question_id: number;
  value: string;
}

export interface NpsResult {
  score: number;
  promoter_pct: number;
  passive_pct: number;
  detractor_pct: number;
  promoter_count: number;
  passive_count: number;
  detractor_count: number;
}

export interface RatingResult {
  mean: number;
  median: number;
  distribution: Record<string, number>;
}

export interface ChoiceResult {
  counts: Record<string, number>;
  total: number;
}

export interface TextAnswer {
  response_id: number;
  value: string;
}

export interface QuestionResult {
  question: Question;
  response_count: number;
  nps: NpsResult | null;
  rating: RatingResult | null;
  choice: ChoiceResult | null;
  text_answers: TextAnswer[] | null;
}

export interface SurveyResults {
  survey: { id: number; title: string; response_count: number };
  total_responses: number;
  results: QuestionResult[];
}
```

## `frontend/src/api.ts`

```typescript
import axios from "axios";

const client = axios.create({ baseURL: "" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (email: string, password: string) =>
    client.post<{ access_token: string }>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    client.post<{ access_token: string }>("/api/auth/login", { email, password }),
  me: () => client.get<{ id: number; email: string }>("/api/auth/me"),
};

export const surveyApi = {
  list: () => client.get<Survey[]>("/api/surveys"),
  get: (id: number) => client.get<Survey>(`/api/surveys/${id}`),
  create: (title: string, description?: string) =>
    client.post<Survey>("/api/surveys", { title, description }),
  update: (id: number, data: Partial<{ title: string; description: string }>) =>
    client.put<Survey>(`/api/surveys/${id}`, data),
  delete: (id: number) => client.delete(`/api/surveys/${id}`),
  toggle: (id: number) => client.put<{ is_active: boolean }>(`/api/surveys/${id}/toggle`),
  results: (id: number) => client.get<SurveyResults>(`/api/surveys/${id}/results`),
};

export const questionApi = {
  add: (surveyId: number, data: { type: string; label: string; scale_max?: number; options?: string[] }) =>
    client.post<Question>(`/api/surveys/${surveyId}/questions`, data),
  update: (id: number, data: Partial<{ label: string; options: string[]; scale_max: number }>) =>
    client.put<Question>(`/api/questions/${id}`, data),
  delete: (id: number) => client.delete(`/api/questions/${id}`),
  reorder: (surveyId: number, questionIds: number[]) =>
    client.post(`/api/surveys/${surveyId}/questions/reorder`, { question_ids: questionIds }),
};

export const publicApi = {
  getSurvey: (token: string) => client.get<Survey>(`/s/${token}`),
  submit: (token: string, answers: SubmitAnswer[]) =>
    client.post(`/s/${token}/submit`, { answers }),
};

import type { Survey, Question, SubmitAnswer, SurveyResults } from "./types";
```

## `frontend/src/App.tsx`

```tsx
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
```

## Page Implementation Notes

### LoginPage / RegisterPage
- Form with email + password fields
- On success: `localStorage.setItem("token", data.access_token)` then `navigate("/")`
- Show error message on failure
- Link between the two pages

### DashboardPage
- `useEffect` → `surveyApi.list()` on mount
- Table of surveys: title, question count, response count, active/inactive badge, created date
- Buttons: Create New Survey (modal or inline form), View Builder, View Results, Toggle Active/Inactive, Delete
- Logout button: `localStorage.removeItem("token")` + `navigate("/login")`
- Share link: display full URL `window.location.origin + "/s/" + survey.share_token` with a copy button

### BuilderPage (drag-and-drop)
- Load survey from `/api/surveys/:id`
- Left panel: question list with drag handles using `@dnd-kit/sortable`
- Right panel: question editor for the currently selected question
- Add question: floating button opens `AddQuestionMenu` (choose type → adds to end)
- Drag to reorder: on `DragEndEvent`, call `questionApi.reorder(surveyId, newOrder)`
- Delete question: button on each `QuestionCard`
- Edit question inline: when a card is clicked, show `QuestionEditor` on the right

#### @dnd-kit setup — key pattern:
```tsx
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// In BuilderPage:
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = questions.findIndex((q) => q.id === active.id);
  const newIndex = questions.findIndex((q) => q.id === over.id);
  const newOrder = arrayMove(questions, oldIndex, newIndex);
  setQuestions(newOrder); // optimistic update
  await questionApi.reorder(surveyId, newOrder.map((q) => q.id));
};

// Wrap list with:
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
    {questions.map((q) => <QuestionCard key={q.id} question={q} ... />)}
  </SortableContext>
</DndContext>

// In QuestionCard:
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
const style = { transform: CSS.Transform.toString(transform), transition };
return <div ref={setNodeRef} style={style} {...attributes}>
  <span {...listeners}>⠿</span> {/* drag handle */}
  ...
</div>;
```

### PublicFormPage
- Load survey from `/s/:token` — if 404, show "Survey not found or no longer active"
- Render each question as the appropriate input:
  - `nps`: 0–10 radio buttons or number buttons (label 0 = "Not at all", 10 = "Extremely likely")
  - `rating`: 1–scale_max star buttons or radio
  - `choice`: radio buttons from `options` array
  - `text`: `<textarea>`
- Submit button → `publicApi.submit(token, answers)` → `navigate(`/s/${token}/thanks`)`
- All questions are required before submit is enabled

### ResultsPage
- Load from `/api/surveys/:id/results`
- Show total response count and survey title
- For each question result, render the matching chart component:
  - `nps` → `NpsChart` — show NPS score prominently, then promoter/passive/detractor bars
  - `rating` → `RatingChart` — bar chart of distribution (1 to scale_max), show mean
  - `choice` → `ChoiceChart` — bar chart of option counts
  - `text` → `TextAnswers` — scrollable list of response values

### Chart components (use `recharts`)
```tsx
// NpsChart — show score + three colored bar segments
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

// ChoiceChart
const data = Object.entries(result.choice.counts).map(([name, value]) => ({ name, value }));
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#6366f1" />
  </BarChart>
</ResponsiveContainer>
```

## Key Constraints
- Run `npm install` first — do NOT run `npm create vite` (scaffold is pre-built)
- All API calls go through `api.ts` — no fetch/axios calls inline in pages
- Token stored in `localStorage` with key `"token"` — consistent across pages
- The drag handle `{...listeners}` must be on a child element, not the root `ref={setNodeRef}` element — else clicking anywhere starts a drag
- After `npm run build`, the `frontend/dist/` folder is served by FastAPI as static files
- TypeScript: all API response types must be typed (no `any`)
- `react-router-dom` `<Link>` components for internal navigation, not `<a href>`

## Build & Verify
```powershell
cd frontend
npm run build
# Output: frontend/dist/ folder
# No TypeScript errors expected
```
