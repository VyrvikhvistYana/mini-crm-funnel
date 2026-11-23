import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewLead } from "@/lib/permissions";
import { addSuggestion, findLeadById, listSuggestionsByLead } from "@/data/store";
import { suggestNextAction } from "@/lib/aiSuggest";
import type { AiSuggestion } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = findLeadById(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewLead(session, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await suggestNextAction(lead);
  const suggestion: AiSuggestion = {
    id: `s-${crypto.randomUUID().slice(0, 8)}`,
    leadId: lead.id,
    nextAction: result.nextAction,
    reason: result.reason,
    channel: result.channel,
    draftMessage: result.draftMessage,
    provider: result.provider,
    fallbackNote: result.fallbackNote,
    createdAt: new Date().toISOString(),
  };
  addSuggestion(suggestion);
  return NextResponse.json({ suggestion });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = findLeadById(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewLead(session, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ suggestions: listSuggestionsByLead(id) });
}
