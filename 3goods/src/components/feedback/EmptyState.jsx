/**
 * The single fallback for every empty list in the app (safe, understandable
 * failure/empty behaviour — never a blank div).
 */
export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-ink-600/20 bg-white/60 px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {hint && <p className="max-w-xs text-xs text-ink-600">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
