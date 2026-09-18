/**
 * Fallback visual for an item with no bundled photo — a plain coloured
 * initial, not an external image request that could fail. Colour is keyed
 * by category so items scan quickly in a grid even without photos.
 */
const STYLE_BY_CATEGORY = {
  Rice: "bg-amber-100 text-amber-700",
  Clothes: "bg-sky-100 text-sky-700",
  Books: "bg-indigo-100 text-indigo-700",
  "Household Items": "bg-emerald-100 text-emerald-700",
  "Non-Perishable Food": "bg-accent-100 text-accent-700",
  "Hygiene Products": "bg-teal-100 text-teal-700",
  "Children Items": "bg-rose-100 text-rose-700",
  Miscellaneous: "bg-slate-100 text-slate-700",
};

export function CategoryIcon({ category, className = "h-full w-full" }) {
  const style = STYLE_BY_CATEGORY[category] ?? "bg-ink-600/10 text-ink-600";
  return (
    <div className={`flex items-center justify-center text-xl font-semibold ${style} ${className}`} aria-hidden="true">
      {category?.[0] ?? "?"}
    </div>
  );
}
