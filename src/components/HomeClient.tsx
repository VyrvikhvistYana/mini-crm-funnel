"use client";

import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { LeadsProvider, useLeads } from "@/components/LeadsProvider";
import { LeadBoard } from "@/components/LeadBoard";
import { NewLeadForm } from "@/components/NewLeadForm";

function HomeBody({
  logoutAction,
}: {
  logoutAction: () => Promise<void>;
}) {
  const { session, ready, visibleLeads } = useLeads();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Воронка лидов
          </h1>
          <p className="text-sm text-zinc-500">
            {session.name} · {session.role}
            {session.role === "manager" ? " · только свои лиды" : " · все лиды"}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {session.role !== "viewer" && <NewLeadForm />}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      {!ready ? (
        <p className="text-sm text-zinc-500">Загрузка доски…</p>
      ) : (
        <LeadBoard leads={visibleLeads} />
      )}
      <p className="mt-6 text-xs text-zinc-400">
        Данные лидов хранятся в браузере (localStorage) — так демо стабильно на Vercel.{" "}
        <Link href="/login" className="underline">
          сменить пользователя
        </Link>
      </p>
    </main>
  );
}

export function HomeClient({
  session,
  logoutAction,
}: {
  session: SessionUser;
  logoutAction: () => Promise<void>;
}) {
  return (
    <LeadsProvider session={session}>
      <HomeBody logoutAction={logoutAction} />
    </LeadsProvider>
  );
}
