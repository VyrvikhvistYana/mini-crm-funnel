export type Role = "admin" | "manager" | "viewer";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type LeadSource =
  | "website"
  | "referral"
  | "cold"
  | "event"
  | "other";

export type SuggestProvider = "llm" | "heuristic";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  password: string; // demo only — plain text for local MVP
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  source: LeadSource;
  status: LeadStatus;
  ownerId: string;
  notes: Note[];
  lastTouchAt: string;
  createdAt: string;
}

export interface AiSuggestion {
  id: string;
  leadId: string;
  nextAction: string;
  reason: string;
  channel: "email" | "call" | "messenger" | "meeting";
  draftMessage: string;
  createdAt: string;
  provider?: SuggestProvider;
  fallbackNote?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SuggestResponse {
  nextAction: string;
  reason: string;
  channel: AiSuggestion["channel"];
  draftMessage: string;
  provider: SuggestProvider;
  /** Why heuristic was used despite a configured key */
  fallbackNote?: string;
}
