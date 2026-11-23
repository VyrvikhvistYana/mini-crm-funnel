"use client";

import { useEffect, useState } from "react";
import { useLeads } from "@/components/LeadsProvider";
import { SaveToast } from "@/components/SaveToast";

export function AddNoteForm({ leadId }: { leadId: string }) {
  const { addNote } = useLeads();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [saved]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    const result = addNote(leadId, text.trim());
    if (!result.ok) {
      setError(result.error);
      setSaved(false);
      return;
    }
    setText("");
    setSaved(true);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea
        rows={3}
        placeholder="Что обсудили / следующий шаг…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      {saved && <SaveToast message="Заметка сохранена" onClose={() => setSaved(false)} />}
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-zinc-600"
      >
        Добавить заметку
      </button>
    </form>
  );
}
