import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { findLeadById, findUserById, listSuggestionsByLead } from "@/data/store";
import { SuggestPanel } from "@/components/SuggestPanel";
import { StatusSelect } from "@/components/StatusSelect";
import { AddNoteForm } from "@/components/AddNoteForm";
import { SilentDays } from "@/components/SilentDays";
import { NoteTime } from "@/components/NoteTime";
import { canEditLead, canViewLead } from "@/lib/permissions";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function LeadPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const lead = findLeadById(id);
  if (!lead) notFound();
  if (!canViewLead(session, lead)) redirect("/");

  const owner = findUserById(lead.ownerId);
  const history = listSuggestionsByLead(lead.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← К воронке
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {lead.name}
      </h1>
      <p className="text-sm text-zinc-500">
        {lead.contact} · {lead.source} · owner: {owner?.name ?? lead.ownerId}
      </p>
      <SilentDays lastTouchAt={lead.lastTouchAt} />

      <div className="mt-6 space-y-4">
        <StatusSelect leadId={lead.id} status={lead.status} />
        <SuggestPanel leadId={lead.id} />

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
          {canEditLead(session, lead) && <AddNoteForm leadId={lead.id} />}
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
