import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { HomeClient } from "@/components/HomeClient";

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

  return <HomeClient session={session} logoutAction={logout} />;
}
