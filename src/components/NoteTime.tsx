"use client";

import { useEffect, useState } from "react";

export function NoteTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState(iso.slice(0, 16).replace("T", " "));

  useEffect(() => {
    setLabel(new Date(iso).toLocaleString());
  }, [iso]);

  return <div className="text-xs text-zinc-400">{label}</div>;
}
