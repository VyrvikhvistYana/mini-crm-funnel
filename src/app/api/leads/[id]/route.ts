import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canEditLead, canViewLead } from "@/lib/permissions";
import { findLeadById, upsertLead } from "@/data/store";
import { canTransition } from "@/lib/statusTransitions";
import type { LeadStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = findLeadById(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewLead(session, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = findLeadById(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditLead(session, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    status?: LeadStatus;
    note?: string;
    name?: string;
    contact?: string;
  };

  if (body.status && !canTransition(lead.status, body.status)) {
    return NextResponse.json(
      {
        error: `Transition ${lead.status} → ${body.status} is not allowed`,
      },
      { status: 400 },
    );
  }

  const updated = { ...lead };
  if (body.name) updated.name = body.name;
  if (body.contact) updated.contact = body.contact;
  if (body.status) updated.status = body.status;
  if (body.note) {
    updated.notes = [
      ...updated.notes,
      {
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        text: body.note,
        createdAt: new Date().toISOString(),
        authorId: session.id,
      },
    ];
    updated.lastTouchAt = new Date().toISOString();
  } else if (body.status && body.status !== lead.status) {
    updated.lastTouchAt = new Date().toISOString();
  }

  upsertLead(updated);
  return NextResponse.json({ lead: updated });
}
