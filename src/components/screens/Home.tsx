"use client";

import { useMemo, useState } from "react";
import type { Nav } from "@/components/chrome";
import { CategoryIcon, Icon } from "@/components/icons";
import { useStore } from "@/lib/store";
import { Btn, CountPill, EmptyState, Field, Tickbox } from "@/components/ui";

export default function Home({ nav, loading }: { nav: Nav; loading: boolean }) {
  const { categories, selection, selectedItems, toggle, countFor } = useStore();
  const [query, setQuery] = useState("");
  const [heroFailed, setHeroFailed] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: { id: number; name: string; categoryName: string; categoryId: number; selected: boolean; quantity: number; unit: string }[] = [];
    for (const category of categories) {
      for (const product of category.products) {
        if (product.name.toLowerCase().includes(q) || category.name.toLowerCase().includes(q)) {
          out.push({
            id: product.id,
            name: product.name,
            categoryName: category.name,
            categoryId: category.id,
            selected: Boolean(selection[product.id]),
            quantity: product.quantity,
            unit: product.unit,
          });
        }
      }
    }
    return out.slice(0, 40);
  }, [categories, query, selection]);

  return (
    <div className="pb-40 lg:pb-24">
      {/* hero band */}
      <section className="relative mb-6 overflow-hidden rounded-[26px] border border-line bg-mint">
        {!heroFailed && (
          <img
            src="images/pantry-hero.jpg"
            alt="Bowls of dals and spices on a linen cloth"
            onError={() => setHeroFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-[70%_50%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f5] via-[#faf9f5ee] to-[#faf9f533]" />
        <div className="relative px-6 py-9 lg:px-10 lg:py-12">
          <p className="tracked text-[9.5px] font-bold text-mute">Everyday essentials, organized</p>
          <h1 className="display mt-2 text-[38px] leading-[0.95] text-forest lg:text-[54px]">
            Shopping List
          </h1>
          <p className="mt-3 max-w-[32ch] text-[15px] text-ink/80">
            Select what you need to buy — we&apos;ll turn it into a clean list you can print or share.
          </p>
          <p className="script mt-3 text-[22px] text-clay">Plan ✓ Select ✓ Share</p>
        </div>
      </section>

      <Field value={query} onChange={setQuery} placeholder="Search products…" label="Search products" />

      {/* selected summary */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-forest">
          <Icon.basket size={22} />
        </span>
        <div className="flex-1">
          <p className="display tnum text-[17px] text-forest">Selected: {selectedItems.length} items</p>
          <p className="text-[13px] text-mute">Tap categories to choose items</p>
        </div>
        <Icon.chevron size={18} />
      </div>

      {query.trim() ? (
        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="display text-[17px] text-forest">Search results</h2>
            <span className="tnum text-[13px] text-mute">{results.length} found</span>
          </div>
          {results.length === 0 ? (
            <EmptyState
              icon={<Icon.search size={28} />}
              title={`No items match “${query.trim()}”`}
              hint="Try a shorter word — or add it to the catalogue from Settings."
              action={<Btn variant="outline" onClick={() => setQuery("")}>Clear search</Btn>}
            />
          ) : (
            <ul className="space-y-1.5">
              {results.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    r.selected ? "border-leaf/50 bg-mint/70" : "border-line bg-white hover:bg-mint/40"
                  }`}
                >
                  <Tickbox
                    checked={r.selected}
                    label={`Add ${r.name}`}
                    onChange={() =>
                      toggle({
                        id: r.id,
                        categoryId: r.categoryId,
                        name: r.name,
                        selected: r.selected,
                        quantity: r.quantity,
                        unit: r.unit,
                        sortOrder: 0,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => nav("category", r.categoryId)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[15px] font-medium">{r.name}</span>
                    <span className="text-[12px] text-mute">{r.categoryName}</span>
                  </button>
                  <span className="tnum text-[13.5px] text-mute">
                    {r.quantity} {r.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <h2 className="display mb-3 text-[17px] text-forest">Categories</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-[66px] w-full rounded-2xl" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              title="No categories yet"
              hint="Add your first category in Settings → Catalogue and it will show up here."
              action={<Btn onClick={() => nav("settings")}>Open Settings</Btn>}
            />
          ) : (
            <ul className="space-y-2">
              {categories.map((category, i) => {
                const count = countFor(category.id);
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => nav("category", category.id)}
                      className="anim-rise flex w-full items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition-all hover:-translate-y-[1px] hover:border-sage hover:shadow-[0_6px_18px_rgba(36,92,57,0.07)]"
                      style={{ animationDelay: `${i * 22}ms` }}
                    >
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-forest"
                        style={{ background: category.tint }}
                      >
                        <CategoryIcon name={category.icon} size={24} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-semibold">{category.name}</span>
                        <span className="tnum text-[12.5px] text-mute">
                          {category.products.length} products
                        </span>
                      </span>
                      <CountPill count={count} />
                      <Icon.chevron size={17} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
