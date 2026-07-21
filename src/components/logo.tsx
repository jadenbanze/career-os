/**
 * Career OS logo — a minimal "trending up" mark on a rounded tile.
 * Matches the app icon (src-tauri/icons). Self-contained (own background),
 * so it reads well in both light and dark themes.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Career OS"
    >
      <rect width="32" height="32" rx="7" fill="#18181b" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="27 10.5 17.7 19.9 12.2 14.4 5 21.5" />
        <polyline points="20.4 10.5 27 10.5 27 17.1" />
      </g>
    </svg>
  );
}
