"use client";

import { useState } from "react";
import type { AiSuggestion } from "@/lib/types";

export function SuggestPanel({ leadId }: { leadId: string }) {
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/suggest`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuggestion(data.suggestion);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!suggestion) return;
    await navigator.clipboard.writeText(suggestion.draftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveToNotes() {
    if (!suggestion) return;
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: `[AI] ${suggestion.nextAction}: ${suggestion.draftMessage}`,
      }),
    });
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
          AI: что делать дальше?
        </h2>
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-50"
        >
          {loading ? "Думаю…" : "Спросить"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {suggestion && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Action:</span> {suggestion.nextAction}{" "}
            <span className="text-zinc-500">({suggestion.channel})</span>
            <span
              className={
                suggestion.provider === "llm"
                  ? "rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
                  : "rounded-full bg-zinc-400 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
              }
            >
              {suggestion.provider === "llm" ? "Gemini/LLM" : "heuristic"}
            </span>
          </p>
          <p className="text-zinc-600 dark:text-zinc-300">{suggestion.reason}</p>
          {suggestion.fallbackNote && (
            <p className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {suggestion.fallbackNote}
            </p>
          )}
          <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs dark:bg-zinc-950">
            {suggestion.draftMessage}
          </pre>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
            >
              {copied ? "Скопировано" : "Скопировать"}
            </button>
            <button
              type="button"
              onClick={saveToNotes}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
            >
              Сохранить в заметки
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
