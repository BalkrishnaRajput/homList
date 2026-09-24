"use client";

import { useEffect, useState } from "react";
import { ScreenHeader, type Nav } from "@/components/chrome";
import { Icon } from "@/components/icons";
import type { ListItem } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { Btn, EmptyState } from "@/components/ui";
import { longDate } from "@/lib/format";

type SavedList = {
  id: string;
  title: string;
  notes: string;
  items: ListItem[];
  itemCount: number;
  updatedAt: string;
};

export default function SavedScreen({ nav }: { nav: Nav }) {
  const { loadItems, currentUserId } = useStore();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/lists")
      .then((r) => r.json())
      .then((data) => {
        if (alive) setLists(data.lists ?? []);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [currentUserId]);

  async function remove(id: string) {
    const prev = lists;
    setLists((cur) => cur.filter((l) => l.id !== id));
    try {
      const response = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
    } catch {
      setLists(prev);
    }
  }

  async function rename(id: string, title: string) {
    const prev = lists;
    setLists((cur) => cur.map((l) => (l.id === id ? { ...l, title } : l)));
    setRenaming(null);
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Rename failed");
    } catch {
      setLists(prev);
    }
  }

  return (
    <div className="pb-32 lg:pb-16">
      <ScreenHeader title="Saved Lists" subtitle="Every list you generated, kept for later" />

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[86px] w-full rounded-2xl" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={<Icon.clock size={28} />}
          title="No saved lists yet"
          hint="When you generate a PDF we keep a copy of the list here, so you can reuse it next time you shop."
          action={<Btn onClick={() => nav("home")}>Start a list</Btn>}
        />
      ) : (
        <ul className="space-y-2.5">
          {lists.map((list) => (
            <li
              key={list.id}
              className="anim-rise rounded-2xl border border-line bg-white px-4 py-4 transition-colors hover:border-sage"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-forest">
                  <Icon.doc size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  {renaming === list.id ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => rename(list.id, draft.trim() || list.title)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") rename(list.id, draft.trim() || list.title);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="w-full rounded-lg border border-line bg-cream px-2 py-1 text-[15px] font-semibold"
                    />
                  ) : (
                    <p className="truncate text-[15.5px] font-semibold">{list.title}</p>
                  )}
                  <p className="tnum text-[12.5px] text-mute">
                    {longDate(new Date(list.updatedAt))} · {list.itemCount}{" "}
                    {list.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Rename ${list.title}`}
                    onClick={() => {
                      setRenaming(list.id);
                      setDraft(list.title);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-lg text-forest hover:bg-mint"
                  >
                    <Icon.pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${list.title}`}
                    onClick={() => remove(list.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-[#b4522f] hover:bg-[#fdf1ed]"
                  >
                    <Icon.trash size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Btn
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    loadItems(list.items, list.notes);
                    nav("list");
                  }}
                >
                  Open list
                </Btn>
                <span className="text-[12.5px] text-mute">
                  {list.items
                    .slice(0, 4)
                    .map((i) => i.name)
                    .join(" · ")}
                  {list.items.length > 4 ? " …" : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
