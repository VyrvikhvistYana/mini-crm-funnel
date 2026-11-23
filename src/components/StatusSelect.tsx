"use client";

import { useEffect, useState } from "react";
import type { LeadStatus } from "@/lib/types";
import { ALLOWED_TRANSITIONS } from "@/lib/statusTransitions";
import { useLeads } from "@/components/LeadsProvider";
import { SaveToast } from "@/components/SaveToast";

export function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const { updateLeadStatus } = useLeads();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const allowed = ALLOWED_TRANSITIONS[status];

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [saved]);

  function onChange(next: LeadStatus) {
    if (next === status) return;
    setError(null);
    setSaved(false);
    const result = updateLeadStatus(leadId, next);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div translate="no">
      <div className="text-xs font-medium text-zinc-500">Status</div>
      <select
        key={`${leadId}-${status}`}
        data-testid="status-select"
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
      {saved && (
        <SaveToast message="Статус сохранён" onClose={() => setSaved(false)} />
      )}
    </div>
  );
}
