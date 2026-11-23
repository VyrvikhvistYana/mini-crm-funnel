"use client";

import { useEffect, useState } from "react";
import { daysSinceTouch } from "@/lib/statusTransitions";

export function SilentDays({ lastTouchAt }: { lastTouchAt: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(daysSinceTouch(lastTouchAt, Date.now()));
  }, [lastTouchAt]);

  return (
    <p className="mt-1 text-xs text-zinc-400">
      Без касания: {days === null ? "…" : `${days} дн.`}
    </p>
  );
}
