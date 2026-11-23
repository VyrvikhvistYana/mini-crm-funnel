"use client";

export function SaveToast({
  message = "Сохранено",
  onClose,
}: {
  message?: string;
  onClose?: () => void;
}) {
  return (
    <div
      role="status"
      className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
    >
      <span
        aria-hidden
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
      >
        ✓
      </span>
      <span className="font-medium">{message}</span>
      {onClose && (
        <button
          type="button"
          className="ml-auto text-xs underline opacity-70"
          onClick={onClose}
        >
          ок
        </button>
      )}
    </div>
  );
}
