import type { LeadStatus } from "./types";

/** Allowed funnel transitions — business process, not free-form statuses */
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "lost"],
  contacted: ["qualified", "lost"],
  qualified: ["proposal", "lost"],
  proposal: ["won", "lost"],
  won: [],
  lost: [],
};

export const PIPELINE_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function daysSinceTouch(lastTouchAt: string, nowMs: number): number {
  const ms = nowMs - new Date(lastTouchAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
