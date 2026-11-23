"use client";

import { useEffect, useState } from "react";
import { daysSinceTouch } from "@/lib/statusTransitions";

export function SilentDays({ lastTouchAt }: { lastTouchAt: string }) {
  const [label, setLabel] = useState("Без касания: …");

  useEffect(() => {
    const days = daysSinceTouch(lastTouchAt, Date.now());
    setLabel(`Без касания: ${days} дн.`);
  }, [lastTouchAt]);

  return <div className="mt-1 text-xs text-zinc-400">{label}</div>;
}
