const KEY = "mini-crm-highlight-lead";

export function markLeadForHighlight(leadId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, leadId);
  } catch {
    /* ignore */
  }
}

export function consumeHighlightedLeadId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(KEY);
    if (id) sessionStorage.removeItem(KEY);
    return id;
  } catch {
    return null;
  }
}
