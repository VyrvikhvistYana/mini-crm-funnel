"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLeads } from "@/components/LeadsProvider";

export function DeleteLeadButton({
  leadId,
  leadName,
}: {
  leadId: string;
  leadName: string;
}) {
  const router = useRouter();
  const { deleteLead } = useLeads();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    const result = deleteLead(leadId);
    if (!result.ok) {
      setError(result.error);
      setConfirming(false);
      return;
    }
    router.push("/");
  }

  if (!confirming) {
    return (
      <button
        data-testid="delete-lead"
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        Удалить лид
      </button>
    );
  }

  return (
    <div
      data-testid="delete-lead-confirm"
      className="space-y-2 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
    >
      <p className="text-sm text-red-900 dark:text-red-100">
        Удалить «{leadName}»? Это нельзя отменить.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          data-testid="delete-lead-yes"
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
        >
          Да, удалить
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
