import type { AiSuggestion, Lead } from "@/lib/types";
import { SEED_LEADS } from "@/data/seed";

const LEADS_KEY = "mini-crm-leads-v1";
const SUGGESTIONS_KEY = "mini-crm-suggestions-v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadLeads(): Lead[] {
  if (!canUseStorage()) return structuredClone(SEED_LEADS);
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    if (!raw) {
      const seed = structuredClone(SEED_LEADS);
      localStorage.setItem(LEADS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Lead[];
  } catch {
    return structuredClone(SEED_LEADS);
  }
}

export function saveLeads(leads: Lead[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function loadSuggestions(): AiSuggestion[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(SUGGESTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AiSuggestion[];
  } catch {
    return [];
  }
}

export function saveSuggestions(items: AiSuggestion[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(items));
}
