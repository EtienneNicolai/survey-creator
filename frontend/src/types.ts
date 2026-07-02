// All TypeScript interfaces for the Survey Creator app.
// Matches the API contracts defined in guidelines/01-project-overview.md.
// Session 6 imports from this file — do not move or rename these types.

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
