import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewLead } from "@/lib/permissions";
import { suggestNextAction } from "@/lib/aiSuggest";
import type { AiSuggestion, Lead } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { lead?: Lead };
  const lead = body.lead;
  if (!lead || lead.id !== id) {
    return NextResponse.json(
      { error: "Lead payload required (client store)" },
      { status: 400 },
    );
  }
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
  return NextResponse.json({ suggestion });
}
