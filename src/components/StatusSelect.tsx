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
  const allowed = ALLOWED_TRANSITIONS[status];

  function onChange(next: LeadStatus) {
    if (next === status) return;
    setError(null);
    const result = updateLeadStatus(leadId, next);
    if (!result.ok) setError(result.error);
  }

  // key={status} remounts <select> on change — avoids browser removeChild bugs
  // when option disabled flags flip during reconciliation.
  return (
    <div translate="no">
      <div className="text-xs font-medium text-zinc-500">Status</div>
      <select
        key={`${leadId}-${status}`}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        defaultValue={status}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
      >
        <option value={status}>{status}</option>
        {allowed.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}
