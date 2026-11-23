"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";
import {
  ALLOWED_TRANSITIONS,
  PIPELINE_STATUSES,
  canTransition,
  daysSinceTouch,
} from "@/lib/statusTransitions";
import { useLeads } from "@/components/LeadsProvider";

const LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

type DragPayload = { id: string; from: LeadStatus };

export function LeadBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const { updateLeadStatus } = useLeads();
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  function moveLead(leadId: string, to: LeadStatus) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === to) return;

    if (!canTransition(lead.status, to)) {
      setError(
        `Нельзя: ${LABELS[lead.status]} → ${LABELS[to]}. Разрешено: ${(
          ALLOWED_TRANSITIONS[lead.status].map((s) => LABELS[s]).join(", ") ||
          "нет (терминальный статус)"
        )}`,
      );
      return;
    }

    setError(null);
    const result = updateLeadStatus(leadId, to);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Перетащи карточку в другую колонку. Клик без драга — открыть лид. Запрещённые
        переходы воронки не применятся.
      </p>
      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            ок
          </button>
        </div>
      )}
      <div className="grid gap-3 overflow-x-auto pb-4 md:grid-cols-3 lg:grid-cols-6">
        {PIPELINE_STATUSES.map((status) => {
          const column = leads.filter((l) => l.status === status);
          const dropOk =
            !dragging ||
            dragging.from === status ||
            canTransition(dragging.from, status);
          const highlighted = overStatus === status && dragging;

          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = dropOk ? "move" : "none";
                setOverStatus(status);
              }}
              onDragLeave={() => {
                setOverStatus((s) => (s === status ? null : s));
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverStatus(null);
                const raw =
                  e.dataTransfer.getData("application/x-lead") ||
                  e.dataTransfer.getData("text/plain");
                if (!raw) return;
                try {
                  const payload = JSON.parse(raw) as DragPayload;
                  moveLead(payload.id, status);
                } catch {
                  /* ignore */
                }
                setDragging(null);
              }}
              className={[
                "min-w-[180px] rounded-xl border p-2 transition",
                highlighted && dropOk
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : highlighted && !dropOk
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50",
              ].join(" ")}
            >
              <header className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>{LABELS[status]}</span>
                <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-700">
                  {column.length}
                </span>
              </header>
              <ul className="flex min-h-[80px] flex-col gap-2">
                {column.map((lead) => {
                  const silent =
                    nowMs === null ? 0 : daysSinceTouch(lead.lastTouchAt, nowMs);
                  return (
                    <li key={lead.id}>
                      <div
                        draggable
                        onDragStart={(e) => {
                          didDrag.current = true;
                          const payload: DragPayload = {
                            id: lead.id,
                            from: lead.status,
                          };
                          e.dataTransfer.setData(
                            "application/x-lead",
                            JSON.stringify(payload),
                          );
                          e.dataTransfer.setData(
                            "text/plain",
                            JSON.stringify(payload),
                          );
                          e.dataTransfer.effectAllowed = "move";
                          setDragging(payload);
                          setError(null);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOverStatus(null);
                          window.setTimeout(() => {
                            didDrag.current = false;
                          }, 0);
                        }}
                        onClick={() => {
                          if (didDrag.current) return;
                          router.push(`/leads/${lead.id}`);
                        }}
                        className={[
                          "cursor-grab rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm transition active:cursor-grabbing",
                          "hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950",
                          dragging?.id === lead.id ? "opacity-40" : "",
                        ].join(" ")}
                      >
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {lead.name}
                        </div>
                        <div className="mt-1 truncate text-xs text-zinc-500">
                          {lead.contact}
                        </div>
                        <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
                          <span>{lead.source}</span>
                          <span className={silent >= 7 ? "text-amber-600" : ""}>
                            {nowMs === null ? "…" : `${silent}d silent`}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
