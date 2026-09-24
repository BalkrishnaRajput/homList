"use client";

import { Icon, BrandMark } from "@/components/icons";
import { Btn } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";

export type ViewName = "home" | "category" | "list" | "preview" | "ready" | "saved" | "settings";

export type Nav = (view: ViewName, categoryId?: number) => void;

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-forest transition-colors hover:bg-mint"
        >
          <Icon.back size={19} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="display text-[26px] leading-[1.1] text-forest lg:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-mute">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

const NAV_ITEMS: { key: ViewName; label: string; icon: (p: { size?: number }) => React.ReactElement }[] = [
  { key: "home", label: "Home", icon: Icon.home },
  { key: "list", label: "My List", icon: Icon.list },
  { key: "saved", label: "Saved Lists", icon: Icon.clock },
  { key: "settings", label: "Settings", icon: Icon.gear },
];

export function SideRail({
  view,
  nav,
  count,
  syncState,
  onNewList,
  accountLabel,
}: {
  view: ViewName;
  nav: Nav;
  count: number;
  syncState: "idle" | "saving" | "saved" | "error";
  onNewList: () => void;
  accountLabel: string;
}) {

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-line bg-paper px-6 py-8 lg:flex">
      <button
        type="button"
        onClick={() => nav("home")}
        className="flex items-center gap-3 text-left"
      >
        <BrandMark size={38} />
        <span>
          <span className="display block text-[20px] leading-none text-forest">HomeList</span>
          <span className="tracked mt-1 block text-[9px] font-semibold text-mute">
            Household shopping list
          </span>
        </span>
      </button>

      <div className="mt-4 rounded-xl border border-dashed border-sage/60 bg-mint/50 p-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-forest">
          <span className="inline-block h-2 w-2 rounded-full bg-leaf" />
          Signed in
        </div>
        <p className="mt-1.5 truncate text-[12.5px] font-medium text-ink/80" title={accountLabel}>
          {accountLabel}
        </p>
        <div className="mt-2.5">
          <SignOutButton className="w-full" />
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key || (view === "category" && item.key === "home");
          const IconCmp = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => nav(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition-colors ${
                active ? "bg-mint text-forest" : "text-mute hover:bg-mint/50 hover:text-forest"
              }`}
            >
              <IconCmp size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.key === "list" && count > 0 && (
                <span className="tnum anim-pop rounded-full bg-leaf px-2 py-[2px] text-[11.5px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-line bg-cream px-4 py-4">
        <p className="tracked text-[9px] font-semibold text-mute">In your list</p>
        <p className="display tnum mt-1 text-[30px] leading-none text-forest">{count}</p>
        <p className="mt-1 text-[12.5px] text-mute">{count === 1 ? "item selected" : "items selected"}</p>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-leaf transition-all duration-500"
            style={{ width: `${Math.min(100, count * 10)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1 text-[12px] text-mute">
        <span
          className={`h-2 w-2 rounded-full ${syncState === "error" ? "bg-[#b4522f]" : syncState === "saving" ? "bg-clay" : "bg-leaf"}`}
        />
        {syncState === "saving" ? "Saving to this device & server…"
          : syncState === "error" ? "Could not sync list — edit to retry"
          : syncState === "saved" ? "List persisted" : "List ready"}
      </div>

      <div className="mt-auto space-y-3">
        <Btn variant="outline" className="w-full" onClick={onNewList}>
          <Icon.plus size={17} /> Start a new list
        </Btn>
        <p className="script text-[18px] leading-tight text-forest">
          A simpler home.
          <br />A smarter you.
        </p>
      </div>
    </aside>
  );
}

export function BottomBar({
  view,
  nav,
  count,
}: {
  view: ViewName;
  nav: Nav;
  count: number;
}) {
  const items = NAV_ITEMS.filter((i) => i.key === "home" || i.key === "list" || i.key === "settings");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-stretch border-t border-line bg-white/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = view === item.key || (view === "category" && item.key === "home");
        const IconCmp = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => nav(item.key)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
              active ? "text-forest" : "text-mute"
            }`}
          >
            <span className={`rounded-full px-4 py-1 ${active ? "bg-mint" : ""}`}>
              <IconCmp size={20} />
            </span>
            {item.label}
            {item.key === "list" && count > 0 && (
              <span className="tnum absolute right-[22%] top-2 rounded-full bg-leaf px-[6px] py-[1px] text-[10.5px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function QuickBar({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-20 flex justify-center px-4 lg:bottom-8 lg:justify-end lg:px-8">
      <Btn
        size="lg"
        onClick={onOpen}
        className="pointer-events-auto w-full max-w-[420px] lg:w-auto"
      >
        <Icon.doc size={19} /> View List · {count} {count === 1 ? "item" : "items"}
        <Icon.chevron size={16} />
      </Btn>
    </div>
  );
}
