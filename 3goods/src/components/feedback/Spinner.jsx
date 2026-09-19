/** Small inline spinner for buttons and "refreshing" hints (LoadingState is the full-page version). */
export function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden="true"
    />
  );
}
