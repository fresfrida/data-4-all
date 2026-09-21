/**
 * Minimal inline icons — deliberately not an icon library dependency for a
 * handful of nav glyphs. Each accepts `className` for sizing/colour via
 * Tailwind (currentColor).
 */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <path d="M12 21s-7-5.2-7-10.6C5 6.4 8.1 3 12 3s7 3.4 7 7.4C19 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </svg>
  );
}

export function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
    </svg>
  );
}

export function PackageIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <rect x="3" y="5" width="18" height="4" rx="1" />
      <path d="M12 5v15" />
    </svg>
  );
}

export function BuildingIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6" />
    </svg>
  );
}

export function HeartHandshakeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
      <path d="M12 20s-6.5-4.2-9-8.4C1.2 8 3 4.8 6 4.4c1.8-.3 3.4.5 4 1.7.6-1.2 2.2-2 4-1.7 3 .4 4.8 3.6 3 7.2-2.5 4.2-9 8.4-9 8.4Z" />
    </svg>
  );
}
