import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canListAllLeads } from "@/lib/permissions";
import { listLeads, upsertLead } from "@/data/store";
import type { Lead, LeadSource, LeadStatus } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let items = listLeads();
  if (!canListAllLeads(session)) {
    items = items.filter((l) => l.ownerId === session.id);
  }
  return NextResponse.json({ leads: items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    name?: string;
    contact?: string;
    source?: LeadSource;
    status?: LeadStatus;
  };

  if (!body.name || !body.contact) {
    return NextResponse.json({ error: "name and contact required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id: `l-${crypto.randomUUID().slice(0, 8)}`,
    name: body.name,
    contact: body.contact,
    source: body.source ?? "other",
    status: body.status ?? "new",
    ownerId: session.id,
    notes: [],
    lastTouchAt: now,
    createdAt: now,
  };

  upsertLead(lead);
  return NextResponse.json({ lead }, { status: 201 });
}
