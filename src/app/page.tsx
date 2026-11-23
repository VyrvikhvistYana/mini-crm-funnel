import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { canListAllLeads } from "@/lib/permissions";
import { listLeads } from "@/data/store";
import { LeadBoard } from "@/components/LeadBoard";
import { NewLeadForm } from "@/components/NewLeadForm";

/** cacheComponents: use instant=false instead of dynamic=force-dynamic */
export const instant = false;

async function logout() {
  "use server";
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/login");
}

export default async function HomePage() {
  await connection();
  const session = await getSession();
  if (!session) redirect("/login");

  let leads = listLeads();
  if (!canListAllLeads(session)) {
    leads = leads.filter((l) => l.ownerId === session.id);
  }

  const nowMs = Date.now();

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
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      <LeadBoard leads={leads} nowMs={nowMs} />
      <p className="mt-6 text-xs text-zinc-400">
        Drag-and-drop по воронке · роли · AI на карточке лида.{" "}
        <Link href="/login" className="underline">
          сменить пользователя
        </Link>
      </p>
    </main>
  );
}
