// Hand-drawn style icon set — no emoji anywhere in the interface.

type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function CategoryIcon({
  name,
  size = 26,
  strokeWidth = 1.6,
}: IconProps & { name: string }) {
  const p = { ...base(size), strokeWidth };
  switch (name) {
    case "dals":
      return (
        <svg {...p}>
          <path d="M7.5 6.2c2.4-1.4 4.6.2 4.2 2.6-.4 2.3-3 3.4-4.7 2.2-1.6-1.1-1.6-3.7.5-4.8Z" />
          <path d="M14.2 10.6c2.3-1.3 4.4.4 3.9 2.7-.5 2.2-3 3.2-4.6 2-1.5-1.1-1.4-3.7.7-4.7Z" />
          <path d="M7.8 14.4c2.2-1.2 4.2.4 3.7 2.6-.5 2.1-2.9 3-4.4 1.9-1.5-1-1.3-3.5.7-4.5Z" />
        </svg>
      );
    case "spice":
      return (
        <svg {...p}>
          <path d="M9 3h6v2.5l1.4 1.6c.3.4.5.9.5 1.4V19a2 2 0 0 1-2 2H9.1a2 2 0 0 1-2-2V8.5c0-.5.2-1 .5-1.4L9 5.5V3Z" />
          <path d="M9.8 12.5h4.4" />
          <circle cx="12" cy="16" r="1.4" />
        </svg>
      );
    case "flour":
      return (
        <svg {...p}>
          <path d="M6.5 8h11l-1 11.2a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6.5 8Z" />
          <path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <path d="M12 12.5c-1.2 1-1.2 2.4 0 3.4" />
        </svg>
      );
    case "chilli":
      return (
        <svg {...p}>
          <path d="M14.5 5.2c.4-1.3 1.6-2 2.8-1.7" />
          <path d="M15 5.3c3 1 4.5 3.7 3.6 6.6-1 3.3-4.8 5.6-8.6 5.6-2.4 0-4-1-4-2.6 0-1.4 1.3-2 2.9-2.5 2.6-.8 4.5-4.2 6.1-7.1Z" />
        </svg>
      );
    case "bowl":
      return (
        <svg {...p}>
          <path d="M3.5 11h17c0 4.4-3.8 7.5-8.5 7.5S3.5 15.4 3.5 11Z" />
          <path d="M8 8.2c.8-1 .4-2-.2-2.7" />
          <path d="M12 7.8c.8-1 .4-2.2-.2-3" />
          <path d="M16 8.2c.8-1 .4-2-.2-2.7" />
        </svg>
      );
    case "apple":
      return (
        <svg {...p}>
          <path d="M12 8.2c1.2-1.4 3.2-1.8 4.7-1 2 .9 3 3.2 2.3 5.6-.7 2.6-2.8 5.4-4.7 6-.9.3-1.6 0-2.3 0s-1.4.3-2.3 0c-1.9-.6-4-3.4-4.7-6-.7-2.4.3-4.7 2.3-5.6 1.5-.8 3.5-.4 4.7 1Z" />
          <path d="M12 8c0-1.8.8-3.1 2.4-3.8" />
        </svg>
      );
    case "soap":
      return (
        <svg {...p}>
          <path d="M10 3h4v2.6h-4z" />
          <path d="M8.4 5.6h7.2c.8 0 1.4.6 1.4 1.4v2.2a2 2 0 0 1-.7 1.5l-.9.8a2 2 0 0 0-.7 1.5v5.6a2 2 0 0 1-2 2h-2.2a2 2 0 0 1-2-2v-5.6a2 2 0 0 0-.7-1.5l-.9-.8a2 2 0 0 1-.7-1.5V7c0-.8.6-1.4 1.4-1.4Z" />
          <path d="M8.8 15.4h6.4" />
        </svg>
      );
    case "oil":
      return (
        <svg {...p}>
          <path d="M10 2.8h4v2.4h-4z" />
          <path d="M8.6 5.2h6.8c.7 0 1.3.6 1.3 1.3v12.4a2 2 0 0 1-2 2H9.3a2 2 0 0 1-2-2V6.5c0-.7.6-1.3 1.3-1.3Z" />
          <path d="M12 9.4c1.4 1.7 2.1 2.9 2.1 4a2.1 2.1 0 1 1-4.2 0c0-1.1.7-2.3 2.1-4Z" />
        </svg>
      );
    case "cup":
      return (
        <svg {...p}>
          <path d="M4.5 9h12v5.5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9Z" />
          <path d="M16.5 10.4h1.6a2.3 2.3 0 0 1 0 4.6h-1.6" />
          <path d="M8 2.8c-.8.9-.8 1.7 0 2.6" />
          <path d="M12 2.8c-.8.9-.8 1.7 0 2.6" />
        </svg>
      );
    case "grid":
    default:
      return (
        <svg {...p}>
          <rect x="4" y="4" width="6.2" height="6.2" rx="1.6" />
          <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.6" />
          <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.6" />
          <rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.6" />
        </svg>
      );
  }
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="11" fill="#245C39" />
      <path
        d="M11 20.4 20 12.6l9 7.8"
        stroke="#FAF9F5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.4 20.2v7.4a1.4 1.4 0 0 0 1.4 1.4h10.4a1.4 1.4 0 0 0 1.4-1.4v-7.4"
        stroke="#FAF9F5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 25.6s-3-1.7-3-3.5c0-1 .8-1.6 1.6-1.6.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.6.6 1.6 1.6 0 1.8-3 3.5-3 3.5Z"
        fill="#D97757"
      />
    </svg>
  );
}

export const Icon = {
  search: (p: IconProps) => (
    <svg {...base(p.size ?? 20)} strokeWidth={p.strokeWidth ?? 1.7}>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  ),
  back: (p: IconProps) => (
    <svg {...base(p.size ?? 20)} strokeWidth={p.strokeWidth ?? 1.8}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  ),
  chevron: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.8}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg {...base(p.size ?? 16)} strokeWidth={p.strokeWidth ?? 2.4}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  ),
  pencil: (p: IconProps) => (
    <svg {...base(p.size ?? 17)} strokeWidth={p.strokeWidth ?? 1.7}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m14.5 5.5 4 4" />
    </svg>
  ),
  trash: (p: IconProps) => (
    <svg {...base(p.size ?? 17)} strokeWidth={p.strokeWidth ?? 1.7}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    </svg>
  ),
  plus: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.9}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.9}>
      <path d="M5 12h14" />
    </svg>
  ),
  share: (p: IconProps) => (
    <svg {...base(p.size ?? 19)} strokeWidth={p.strokeWidth ?? 1.7}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="17.5" cy="6" r="2.4" />
      <circle cx="17.5" cy="18" r="2.4" />
      <path d="m8.2 10.9 7.1-3.7M8.2 13.1l7.1 3.7" />
    </svg>
  ),
  download: (p: IconProps) => (
    <svg {...base(p.size ?? 19)} strokeWidth={p.strokeWidth ?? 1.7}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  ),
  doc: (p: IconProps) => (
    <svg {...base(p.size ?? 19)} strokeWidth={p.strokeWidth ?? 1.6}>
      <path d="M6 3.5h7.5L18.5 8v12.5h-12z" />
      <path d="M13 3.5V8h5" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  ),
  home: (p: IconProps) => (
    <svg {...base(p.size ?? 21)} strokeWidth={p.strokeWidth ?? 1.7}>
      <path d="M4 11 12 4.5 20 11" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  ),
  list: (p: IconProps) => (
    <svg {...base(p.size ?? 21)} strokeWidth={p.strokeWidth ?? 1.7}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.4" />
      <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
    </svg>
  ),
  gear: (p: IconProps) => (
    <svg {...base(p.size ?? 21)} strokeWidth={p.strokeWidth ?? 1.6}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </svg>
  ),
  clock: (p: IconProps) => (
    <svg {...base(p.size ?? 21)} strokeWidth={p.strokeWidth ?? 1.6}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  ),
  basket: (p: IconProps) => (
    <svg {...base(p.size ?? 22)} strokeWidth={p.strokeWidth ?? 1.6}>
      <path d="M3.5 9.5h17l-1.7 8.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L3.5 9.5Z" />
      <path d="m8.5 9.5 2.2-5M15.5 9.5l-2.2-5" />
      <path d="M9.5 13v3M14.5 13v3" />
    </svg>
  ),
  calendar: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.6}>
      <rect x="3.8" y="5.5" width="16.4" height="14.7" rx="2.2" />
      <path d="M3.8 10h16.4M8.5 3.5v4M15.5 3.5v4" />
    </svg>
  ),
  note: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.6}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.2" />
      <path d="M8.5 3.5v17M11.5 9h5M11.5 13h5" />
    </svg>
  ),
  close: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.8}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
  link: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.7}>
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.4 1.4" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.4-1.4" />
    </svg>
  ),
  printer: (p: IconProps) => (
    <svg {...base(p.size ?? 19)} strokeWidth={p.strokeWidth ?? 1.6}>
      <path d="M7 8.5V3.8h10v4.7" />
      <path d="M5.2 8.5h13.6a1.8 1.8 0 0 1 1.8 1.8v5H3.4v-5a1.8 1.8 0 0 1 1.8-1.8Z" />
      <path d="M7 15.3h10v5H7z" />
    </svg>
  ),
  leaf: (p: IconProps) => (
    <svg {...base(p.size ?? 18)} strokeWidth={p.strokeWidth ?? 1.6}>
      <path d="M5 19c-1.5-7 3.5-13 15-13.5C19.5 14 13.5 19.5 5 19Z" />
      <path d="M5 19c3-5 6.5-8 11-10" />
    </svg>
  ),
};
