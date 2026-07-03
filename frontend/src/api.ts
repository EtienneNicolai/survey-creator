import axios from "axios";
import type { Survey, Question, SubmitAnswer, SurveyResults } from "./types";

const client = axios.create({ baseURL: "" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

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
  getSurvey: (token: string) => client.get<Survey>(`/api/s/${token}`),
  submit: (token: string, answers: SubmitAnswer[]) =>
    client.post(`/api/s/${token}/submit`, { answers }),
};
