"use client";

import { useState } from "react";
import type { LeadStatus } from "@/lib/types";
import { ALLOWED_TRANSITIONS, PIPELINE_STATUSES } from "@/lib/statusTransitions";
import { useLeads } from "@/components/LeadsProvider";

export function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const { updateLeadStatus } = useLeads();
  const [error, setError] = useState<string | null>(null);
  const allowed = new Set([status, ...ALLOWED_TRANSITIONS[status]]);

  function onChange(next: LeadStatus) {
    setError(null);
    const result = updateLeadStatus(leadId, next);
    if (!result.ok) setError(result.error);
  }

  return (
    <div>
      <label className="text-xs font-medium text-zinc-500">Status</label>
      <select
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        value={status}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
      >
        {PIPELINE_STATUSES.map((s) => (
          <option key={s} value={s} disabled={!allowed.has(s)}>
            {s}
            {!allowed.has(s) ? " (blocked)" : ""}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
