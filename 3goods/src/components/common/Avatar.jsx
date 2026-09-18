/**
 * Mini Profile Icon / Avatar placeholder component for Organisations and Donors.
 */

const ORG_GRADIENTS = {
  "org-food-share": "from-emerald-500 to-teal-700 text-white",
  "org-hanoi-pantry": "from-blue-600 to-indigo-800 text-white",
  "org-books-children": "from-amber-500 to-orange-700 text-white",
  "org-warm-homes": "from-rose-500 to-pink-700 text-white",
  "org-care-bridge": "from-cyan-500 to-blue-700 text-white",
};

const DEFAULT_ORG_GRADIENT = "from-accent-600 to-indigo-700 text-white";
const DEFAULT_DONOR_GRADIENT = "from-slate-600 to-ink-800 text-white";

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base font-bold",
};

export function Avatar({ name = "", id, type = "donor", size = "sm", className = "" }) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  let gradient = type === "organisation" ? ORG_GRADIENTS[id] || DEFAULT_ORG_GRADIENT : DEFAULT_DONOR_GRADIENT;

  // Extract 1-2 initials
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || (type === "organisation" ? "ORG" : "U");

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br font-bold shadow-xs border border-white/20 ${gradient} ${sizeClass} ${className}`}
      title={name}
    >
      {type === "organisation" ? (
        <span className="tracking-tight">{initials}</span>
      ) : (
        <span className="tracking-tight">{initials}</span>
      )}
    </div>
  );
}
