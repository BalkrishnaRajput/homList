"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/chrome";
import { CategoryIcon, Icon } from "@/components/icons";
import { TINTS, UNITS } from "@/lib/catalog-data";
import { useStore } from "@/lib/store";
import { Btn } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";

const ICON_CHOICES = [
  { value: "dals", label: "Dals" },
  { value: "spice", label: "Spices" },
  { value: "flour", label: "Flour" },
  { value: "chilli", label: "Masalas" },
  { value: "bowl", label: "Breakfast" },
  { value: "apple", label: "Fresh" },
  { value: "soap", label: "Cleaning" },
  { value: "oil", label: "Oil" },
  { value: "cup", label: "Tea & Snacks" },
  { value: "grid", label: "Other" },
];

const TINT_CHOICES = Object.values(TINTS);

export default function SettingsScreen({ accountLabel }: { accountLabel: string }) {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    newList,
  } = useStore();

  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
  const active = categories.find((c) => c.id === activeId) ?? categories[0] ?? null;

  const [newCat, setNewCat] = useState({ name: "", icon: "grid", tint: TINT_CHOICES[6] });
  const [newProd, setNewProd] = useState({ name: "", quantity: "1", unit: "kg" });

  return (
    <div className="pb-32 lg:pb-16">
      <ScreenHeader
        title="Settings"
        subtitle="Edit the catalogue — categories and products are yours to shape"
      />

      <section className="mb-6 rounded-2xl border border-line bg-white px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="display text-[15px] uppercase text-forest">Account</h2>
            <p className="mt-1 truncate text-[13.5px] text-mute" title={accountLabel}>
              {accountLabel}
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-white px-5 py-5">
        <h2 className="display text-[15px] uppercase text-forest">Your list</h2>
        <p className="mt-1 text-[13.5px] text-mute">
          The current list is saved on this device as you tick, and mirrored to your account&apos;s
          list record. Starting fresh clears both.
        </p>
        <Btn variant="outline" className="mt-3" onClick={newList}>
          <Icon.plus size={17} /> Start a new list
        </Btn>
      </section>

      <section className="rounded-2xl border border-line bg-white px-5 py-5">
        <h2 className="display text-[15px] uppercase text-forest">Catalogue</h2>
        <p className="mt-1 text-[13.5px] text-mute">
          {categories.length} categories ·{" "}
          {categories.reduce((n, c) => n + c.products.length, 0)} products
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* categories */}
          <div>
            <ul className="space-y-1.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(category.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      active?.id === category.id
                        ? "border-forest bg-mint"
                        : "border-line hover:bg-mint/50"
                    }`}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-forest"
                      style={{ background: category.tint }}
                    >
                      <CategoryIcon name={category.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                      {category.name}
                    </span>
                    <span className="tnum text-[12px] text-mute">{category.products.length}</span>
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 space-y-2 rounded-xl border border-dashed border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCat.name.trim()) return;
                addCategory(newCat.name.trim(), newCat.icon, newCat.tint);
                setNewCat({ ...newCat, name: "" });
              }}
            >
              <p className="tracked text-[9px] font-bold text-mute">Add category</p>
              <input
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="Category name"
                className="h-10 w-full rounded-lg border border-line bg-cream px-3 text-[14px] outline-none focus:border-sage"
              />
              <div className="flex gap-2">
                <select
                  value={newCat.icon}
                  onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-line bg-cream px-2 text-[14px]"
                  aria-label="Icon"
                >
                  {ICON_CHOICES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  {TINT_CHOICES.map((tint) => (
                    <button
                      key={tint}
                      type="button"
                      aria-label={`Tint ${tint}`}
                      onClick={() => setNewCat({ ...newCat, tint })}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        newCat.tint === tint ? "border-forest scale-110" : "border-line"
                      }`}
                      style={{ background: tint }}
                    />
                  ))}
                </div>
              </div>
              <Btn type="submit" size="sm" className="w-full">
                <Icon.plus size={15} /> Add category
              </Btn>
            </form>
          </div>

          {/* products */}
          <div className="min-w-0">
            {!active ? (
              <p className="text-[14px] text-mute">Add a category first.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={active.name}
                    onChange={(e) => updateCategory(active.id, { name: e.target.value })}
                    className="display h-11 min-w-[180px] flex-1 rounded-xl border border-line bg-cream px-3 text-[16px] text-forest outline-none focus:border-sage"
                    aria-label="Category name"
                  />
                  <select
                    value={active.icon}
                    onChange={(e) => updateCategory(active.id, { icon: e.target.value })}
                    className="h-11 rounded-xl border border-line bg-cream px-2 text-[14px]"
                    aria-label="Category icon"
                  >
                    {ICON_CHOICES.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                  <Btn
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteCategory(active.id);
                      setActiveId(categories.find((c) => c.id !== active.id)?.id ?? null);
                    }}
                  >
                    <Icon.trash size={15} /> Delete
                  </Btn>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="tracked text-[9px] font-bold text-mute">Tint</span>
                  {TINT_CHOICES.map((tint) => (
                    <button
                      key={tint}
                      type="button"
                      aria-label={`Tint ${tint}`}
                      onClick={() => updateCategory(active.id, { tint })}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        active.tint === tint ? "border-forest scale-110" : "border-line"
                      }`}
                      style={{ background: tint }}
                    />
                  ))}
                </div>

                <ul className="mt-4 divide-y divide-dotted divide-line overflow-hidden rounded-xl border border-line">
                  {active.products.map((product) => (
                    <li key={product.id} className="flex flex-wrap items-center gap-2 bg-white px-3 py-2">
                      <input
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                        className="h-9 min-w-[140px] flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14.5px] outline-none transition-colors hover:border-line focus:border-sage focus:bg-cream"
                        aria-label={`Name of ${product.name}`}
                      />
                      <input
                        type="number"
                        min={1}
                        value={product.quantity}
                        onChange={(e) =>
                          updateProduct(product.id, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="tnum h-9 w-16 rounded-lg border border-line bg-cream px-2 text-[13.5px]"
                        aria-label={`Quantity of ${product.name}`}
                      />
                      <select
                        value={product.unit}
                        onChange={(e) => updateProduct(product.id, { unit: e.target.value })}
                        className="h-9 rounded-lg border border-line bg-cream px-2 text-[13.5px]"
                        aria-label={`Unit of ${product.name}`}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => deleteProduct(product.id)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-[#b4522f] hover:bg-[#fdf1ed]"
                      >
                        <Icon.trash size={16} />
                      </button>
                    </li>
                  ))}
                  {active.products.length === 0 && (
                    <li className="bg-white px-3 py-6 text-center text-[13.5px] text-mute">
                      No products in this category yet.
                    </li>
                  )}
                </ul>

                <form
                  className="mt-3 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newProd.name.trim()) return;
                    addProduct(
                      active.id,
                      newProd.name.trim(),
                      Math.max(1, Number(newProd.quantity) || 1),
                      newProd.unit,
                    );
                    setNewProd({ name: "", quantity: "1", unit: "kg" });
                  }}
                >
                  <input
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="New product name"
                    className="h-10 min-w-[160px] flex-1 rounded-lg border border-line bg-cream px-3 text-[14px] outline-none focus:border-sage"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newProd.quantity}
                    onChange={(e) => setNewProd({ ...newProd, quantity: e.target.value })}
                    className="tnum h-10 w-16 rounded-lg border border-line bg-cream px-2 text-[13.5px]"
                    aria-label="Default quantity"
                  />
                  <select
                    value={newProd.unit}
                    onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    className="h-10 rounded-lg border border-line bg-cream px-2 text-[13.5px]"
                    aria-label="Default unit"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <Btn type="submit" size="sm">
                    <Icon.plus size={15} /> Add product
                  </Btn>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <p className="script mt-6 text-[20px] text-clay">Home · List · Life · Sorted</p>
    </div>
  );
}
