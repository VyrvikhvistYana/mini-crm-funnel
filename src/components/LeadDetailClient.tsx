"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Component, useMemo } from "react";
import type { SessionUser } from "@/lib/types";
import { LeadsProvider, useLeads } from "@/components/LeadsProvider";
import { SuggestPanel } from "@/components/SuggestPanel";
import { StatusSelect } from "@/components/StatusSelect";
import { AddNoteForm } from "@/components/AddNoteForm";
import { SilentDays } from "@/components/SilentDays";
import { NoteTime } from "@/components/NoteTime";

class SoftErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null; resetKey: number }
> {
  state: { error: Error | null; resetKey: number } = {
    error: null,
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // DOM reconciliation glitches (often <select>) — auto-recover by remount
    if (error.message.includes("removeChild")) {
      window.setTimeout(() => {
        this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }));
      }, 0);
    }
  }

  render() {
    if (this.state.error && !this.state.error.message.includes("removeChild")) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            ← К воронке
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Ошибка на карточке</h1>
          <div className="mt-2 text-sm text-zinc-500">{this.state.error.message}</div>
          <button
            type="button"
            className="mt-4 rounded-lg border px-3 py-1.5 text-sm"
            onClick={() => this.setState({ error: null, resetKey: this.state.resetKey + 1 })}
          >
            Попробовать снова
          </button>
        </main>
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

function LeadBody() {
  const params = useParams();
  const id = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { ready, getLead, ownerName, suggestionsFor, canEdit } = useLeads();

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 text-sm text-zinc-500">
        Загрузка…
      </main>
    );
  }

  if (!id) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← К воронке
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Нет id карточки</h1>
      </main>
    );
  }

  const lead = getLead(id);
  if (!lead) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← К воронке
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Карточка не найдена</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Лид мог быть из другого браузера/устройства. Создай его снова на доске.
        </p>
      </main>
    );
  }

  const history = suggestionsFor(lead.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← К воронке
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {lead.name}
      </h1>
      <div className="text-sm text-zinc-500">
        {lead.contact} · {lead.source} · owner: {ownerName(lead.ownerId)}
      </div>
      <SilentDays lastTouchAt={lead.lastTouchAt} />

      <div className="mt-6 space-y-4">
        <StatusSelect leadId={lead.id} status={lead.status} />
        <SuggestPanel lead={lead} />

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">Заметки</h2>
          {lead.notes.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Пока пусто</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {lead.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-950">
                  <NoteTime iso={n.createdAt} />
                  {n.text}
                </li>
              ))}
            </ul>
          )}
          {canEdit(lead) && <AddNoteForm leadId={lead.id} />}
        </section>

        {history.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">История AI-советов</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {history.map((s) => (
                <li key={s.id} className="text-zinc-600 dark:text-zinc-300">
                  {s.nextAction} — {s.reason}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

export function LeadDetailClient({ session }: { session: SessionUser }) {
  return (
    <LeadsProvider session={session}>
      <SoftErrorBoundary>
        <LeadBody />
      </SoftErrorBoundary>
    </LeadsProvider>
  );
}
