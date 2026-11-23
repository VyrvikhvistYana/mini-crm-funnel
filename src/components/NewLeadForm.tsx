"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LeadSource } from "@/lib/types";

const SOURCES: LeadSource[] = ["website", "referral", "cold", "event", "other"];

export function NewLeadForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [source, setSource] = useState<LeadSource>("website");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (!created) return;
    const t = window.setTimeout(() => setCreated(null), 6000);
    return () => window.clearTimeout(t);
  }, [created]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось создать лид");
        return;
      }
      const leadName = name;
      setName("");
      setContact("");
      setSource("website");
      setOpen(false);
      setCreated({ id: data.lead.id, name: leadName });
      router.refresh();
    } catch {
      setError("Сеть: не удалось создать лид");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Новый лид
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="w-full max-w-md space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:w-80"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Новый лид</h2>
            <button
              type="button"
              className="text-xs text-zinc-500"
              onClick={() => setOpen(false)}
            >
              отмена
            </button>
          </div>
          <input
            required
            placeholder="Название / компания"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            required
            placeholder="Контакт (email / телефон)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource)}
            className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-zinc-900 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy ? "Создаю…" : "Создать"}
          </button>
        </form>
      )}

      {created && (
        <div
          role="status"
          className="flex max-w-sm items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
          >
            ✓
          </span>
          <div className="min-w-0">
            <p className="font-medium">Создано</p>
            <p className="truncate text-xs text-emerald-800/80 dark:text-emerald-200/80">
              «{created.name}» в колонке New — можно оставаться на доске
            </p>
            <button
              type="button"
              className="mt-1 text-xs font-medium underline"
              onClick={() => router.push(`/leads/${created.id}`)}
            >
              Открыть карточку
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
