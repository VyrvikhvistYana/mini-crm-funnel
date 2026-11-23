import type { AiSuggestion, Lead, User } from "@/lib/types";
import { SEED_LEADS, SEED_SUGGESTIONS, SEED_USERS } from "./seed";

/**
 * In-memory store for local MVP.
 * Survives within the Node process; reset on server restart.
 * Replace with Postgres/SQLite later without changing API shapes.
 */
const g = globalThis as unknown as {
  __crmUsers?: User[];
  __crmLeads?: Lead[];
  __crmSuggestions?: AiSuggestion[];
};

function users(): User[] {
  if (!g.__crmUsers) g.__crmUsers = structuredClone(SEED_USERS);
  return g.__crmUsers;
}

function leads(): Lead[] {
  if (!g.__crmLeads) g.__crmLeads = structuredClone(SEED_LEADS);
  return g.__crmLeads;
}

function suggestions(): AiSuggestion[] {
  if (!g.__crmSuggestions) g.__crmSuggestions = structuredClone(SEED_SUGGESTIONS);
  return g.__crmSuggestions;
}

export function findUserByEmail(email: string): User | undefined {
  return users().find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users().find((u) => u.id === id);
}

export function listLeads(): Lead[] {
  return leads();
}

export function findLeadById(id: string): Lead | undefined {
  return leads().find((l) => l.id === id);
}

export function upsertLead(lead: Lead): Lead {
  const all = leads();
  const idx = all.findIndex((l) => l.id === lead.id);
  if (idx === -1) all.push(lead);
  else all[idx] = lead;
  return lead;
}

export function addSuggestion(s: AiSuggestion): AiSuggestion {
  suggestions().push(s);
  return s;
}

export function listSuggestionsByLead(leadId: string): AiSuggestion[] {
  return suggestions().filter((s) => s.leadId === leadId);
}

export function resetStore(): void {
  g.__crmUsers = structuredClone(SEED_USERS);
  g.__crmLeads = structuredClone(SEED_LEADS);
  g.__crmSuggestions = structuredClone(SEED_SUGGESTIONS);
}
