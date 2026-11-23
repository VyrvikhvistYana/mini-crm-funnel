"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AiSuggestion,
  Lead,
  LeadSource,
  LeadStatus,
  SessionUser,
} from "@/lib/types";
import { canListAllLeads, canEditLead, canViewLead } from "@/lib/permissions";
import { canTransition } from "@/lib/statusTransitions";
import {
  loadLeads,
  loadSuggestions,
  saveLeads,
  saveSuggestions,
} from "@/lib/clientLeadsStorage";
import { SEED_USERS } from "@/data/seed";
import { markLeadForHighlight } from "@/lib/highlightLead";

type LeadsContextValue = {
  session: SessionUser;
  ready: boolean;
  leads: Lead[];
  visibleLeads: Lead[];
  getLead: (id: string) => Lead | undefined;
  createLead: (input: {
    name: string;
    contact: string;
    source: LeadSource;
  }) => Lead;
  updateLeadStatus: (id: string, status: LeadStatus) => { ok: true } | { ok: false; error: string };
  addNote: (id: string, text: string) => { ok: true } | { ok: false; error: string };
  ownerName: (ownerId: string) => string;
  suggestionsFor: (leadId: string) => AiSuggestion[];
  addSuggestion: (s: AiSuggestion) => void;
  canEdit: (lead: Lead) => boolean;
  highlightId: string | null;
  flashLead: (leadId: string) => void;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);

  useEffect(() => {
    setLeads(loadLeads());
    setSuggestions(loadSuggestions());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveLeads(leads);
  }, [leads, ready]);

  useEffect(() => {
    if (!ready) return;
    saveSuggestions(suggestions);
  }, [suggestions, ready]);

  const flashLead = useCallback((leadId: string) => {
    markLeadForHighlight(leadId);
    setHighlightId(leadId);
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => {
      setHighlightId((current) => (current === leadId ? null : current));
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  const visibleLeads = useMemo(() => {
    if (canListAllLeads(session)) return leads;
    return leads.filter((l) => l.ownerId === session.id);
  }, [leads, session]);

  const getLead = useCallback(
    (id: string) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return undefined;
      if (!canViewLead(session, lead)) return undefined;
      return lead;
    },
    [leads, session],
  );

  const createLead = useCallback(
    (input: { name: string; contact: string; source: LeadSource }) => {
      const now = new Date().toISOString();
      const lead: Lead = {
        id: `l-${crypto.randomUUID().slice(0, 8)}`,
        name: input.name,
        contact: input.contact,
        source: input.source,
        status: "new",
        ownerId: session.id,
        notes: [],
        lastTouchAt: now,
        createdAt: now,
      };
      setLeads((prev) => {
        const next = [lead, ...prev];
        saveLeads(next);
        return next;
      });
      return lead;
    },
    [session.id],
  );

  const updateLeadStatus = useCallback(
    (id: string, status: LeadStatus) => {
      let error: string | null = null;
      setLeads((prev) => {
        const lead = prev.find((l) => l.id === id);
        if (!lead) {
          error = "Лид не найден";
          return prev;
        }
        if (!canEditLead(session, lead)) {
          error = "Нет прав";
          return prev;
        }
        if (!canTransition(lead.status, status)) {
          error = `Переход ${lead.status} → ${status} запрещён`;
          return prev;
        }
        const next = prev.map((l) =>
          l.id === id
            ? {
                ...l,
                status,
                lastTouchAt:
                  status !== l.status ? new Date().toISOString() : l.lastTouchAt,
              }
            : l,
        );
        saveLeads(next);
        return next;
      });
      if (error) return { ok: false as const, error };
      return { ok: true as const };
    },
    [session],
  );

  const addNote = useCallback(
    (id: string, text: string) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return { ok: false as const, error: "Лид не найден" };
      if (!canEditLead(session, lead)) return { ok: false as const, error: "Нет прав" };
      const note = {
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        text,
        createdAt: new Date().toISOString(),
        authorId: session.id,
      };
      setLeads((prev) => {
        const next = prev.map((l) =>
          l.id === id
            ? {
                ...l,
                notes: [...l.notes, note],
                lastTouchAt: note.createdAt,
              }
            : l,
        );
        saveLeads(next);
        return next;
      });
      return { ok: true as const };
    },
    [leads, session],
  );

  const ownerName = useCallback((ownerId: string) => {
    return SEED_USERS.find((u) => u.id === ownerId)?.name ?? ownerId;
  }, []);

  const suggestionsFor = useCallback(
    (leadId: string) => suggestions.filter((s) => s.leadId === leadId),
    [suggestions],
  );

  const addSuggestionLocal = useCallback((s: AiSuggestion) => {
    setSuggestions((prev) => {
      const next = [...prev, s];
      saveSuggestions(next);
      return next;
    });
  }, []);

  const value = useMemo<LeadsContextValue>(
    () => ({
      session,
      ready,
      leads,
      visibleLeads,
      getLead,
      createLead,
      updateLeadStatus,
      addNote,
      ownerName,
      suggestionsFor,
      addSuggestion: addSuggestionLocal,
      canEdit: (lead) => canEditLead(session, lead),
      highlightId,
      flashLead,
    }),
    [
      session,
      ready,
      leads,
      visibleLeads,
      getLead,
      createLead,
      updateLeadStatus,
      addNote,
      ownerName,
      suggestionsFor,
      addSuggestionLocal,
      highlightId,
      flashLead,
    ],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
