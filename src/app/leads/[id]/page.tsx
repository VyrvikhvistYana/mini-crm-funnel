import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LeadDetailClient } from "@/components/LeadDetailClient";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function LeadPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  await params;

  return <LeadDetailClient session={session} />;
}
