"use client";

import { useMemo, useState } from "react";
import { ScreenHeader, type Nav } from "@/components/chrome";
import { CategoryIcon, Icon } from "@/components/icons";
import { useStore } from "@/lib/store";
import { Btn, Field, QtyChips, Stepper, Tickbox } from "@/components/ui";

export default function CategoryScreen({
  categoryId,
  nav,
}: {
  categoryId: number;
  nav: Nav;
}) {
  const { categories, selection, toggle, setQuantity, removeItem, countFor } = useStore();
  const [filter, setFilter] = useState("");
  const category = categories.find((c) => c.id === categoryId);

  const products = useMemo(() => {
    if (!category) return [];
    const q = filter.trim().toLowerCase();
    return q ? category.products.filter((p) => p.name.toLowerCase().includes(q)) : category.products;
  }, [category, filter]);

  if (!category) {
    return (
      <div>
        <ScreenHeader title="Category" onBack={() => nav("home")} />
        <p className="text-[14px] text-mute">This category is no longer in the catalogue.</p>
      </div>
    );
  }

  const count = countFor(category.id);

  return (
    <div className="pb-40 lg:pb-24">
      <ScreenHeader
        title={category.name}
        subtitle="Select the products you need to buy"
        onBack={() => nav("home")}
        right={
          <span
            className="grid h-11 w-11 place-items-center rounded-xl text-forest"
            style={{ background: category.tint }}
          >
            <CategoryIcon name={category.icon} size={24} />
          </span>
        }
      />

      <div className="mb-4 rounded-2xl border border-line px-5 py-4" style={{ background: category.tint }}>
        <p className="display tnum text-[15px] text-forest">
          {count > 0 ? `${count} selected from ${category.name}` : `Nothing selected yet`}
        </p>
        <p className="mt-0.5 text-[13px] text-ink/70">
          Tap a checkbox to add an item — quantity is optional.
        </p>
      </div>

      <Field
        value={filter}
        onChange={setFilter}
        placeholder={`Search in ${category.name}…`}
        label={`Search ${category.name}`}
      />

      <ul className="mt-4 space-y-2">
        {products.map((product, i) => {
          const sel = selection[product.id];
          return (
            <li
              key={product.id}
              className={`anim-rise overflow-hidden rounded-2xl border transition-colors ${
                sel ? "border-leaf/55 bg-mint/60" : "border-line bg-white"
              }`}
              style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Tickbox
                  checked={Boolean(sel)}
                  label={`Select ${product.name}`}
                  onChange={() => toggle(product)}
                />
                <button
                  type="button"
                  onClick={() => toggle(product)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[15.5px] font-medium">{product.name}</span>
                </button>
                {sel && (
                  <span className="tnum shrink-0 rounded-lg bg-white px-2 py-1 text-[13px] font-semibold text-forest">
                    {sel.quantity} {sel.unit}
                  </span>
                )}
              </div>

              {sel && (
                <div className="anim-rise border-t border-dashed border-sage/50 bg-white/70 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stepper
                      quantity={sel.quantity}
                      unit={sel.unit}
                      onChange={(q, u) => setQuantity(product.id, q, u)}
                    />
                    <span className="tracked text-[9.5px] font-bold text-mute">Quick quantity</span>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-[#b4522f] transition-colors hover:text-[#8f3d20]"
                    >
                      <Icon.trash size={15} /> Remove
                    </button>
                  </div>
                  <div className="mt-2.5">
                    <QtyChips
                      quantity={sel.quantity}
                      unit={sel.unit}
                      onChange={(q, u) => setQuantity(product.id, q, u)}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {products.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 px-5 py-8 text-center text-[14px] text-mute">
          No products match “{filter}”.
        </p>
      )}

      <div className="mt-6 hidden gap-3 lg:flex">
        <Btn variant="outline" onClick={() => nav("home")}>
          <Icon.back size={17} /> All categories
        </Btn>
        <Btn onClick={() => nav("list")}>
          <Icon.doc size={17} /> Go to My List
        </Btn>
      </div>
    </div>
  );
}
