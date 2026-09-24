"use client";

import { useState } from "react";
import { ScreenHeader, type Nav } from "@/components/chrome";
import { CategoryIcon, Icon } from "@/components/icons";
import { useStore, type SelectedItem } from "@/lib/store";
import { Btn, EmptyState, QtyChips, Stepper, Tickbox } from "@/components/ui";

export default function MyList({ nav }: { nav: Nav }) {
  const { selectedGroups, selectedItems, notes, setNotes, removeItem, setQuantity, newList } = useStore();
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <div className="pb-40 lg:pb-24">
      <ScreenHeader
        title="My Shopping List"
        subtitle={`Total items: ${selectedItems.length}`}
        onBack={() => nav("home")}
        right={
          selectedItems.length > 0 ? (
            <Btn variant="outline" size="sm" onClick={newList}>
              <Icon.trash size={15} /> Clear
            </Btn>
          ) : undefined
        }
      />

      {selectedItems.length === 0 ? (
        <EmptyState
          title="Your list is empty"
          hint="Pick items from any category and they will be grouped here, ready to print or share."
          action={<Btn onClick={() => nav("home")}>Browse categories</Btn>}
        />
      ) : (
        <div className="space-y-5">
          {selectedGroups.map((group) => (
            <section
              key={group.category.id}
              className="anim-rise overflow-hidden rounded-2xl border border-line bg-white"
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: group.category.tint }}
              >
                <span className="text-forest">
                  <CategoryIcon name={group.category.icon} size={22} />
                </span>
                <h2 className="display text-[15px] uppercase text-forest">
                  {group.category.name}{" "}
                  <span className="tnum text-[13px] font-semibold text-ink/60">({group.items.length})</span>
                </h2>
              </div>

              <ul>
                {group.items.map((item) => (
                  <li key={item.productId} className="border-b border-dotted border-line last:border-b-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Tickbox
                        checked
                        label={`Keep ${item.name}`}
                        onChange={() => removeItem(item.productId)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{item.name}</p>
                        <p className="tnum text-[12.5px] text-mute">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Edit quantity of ${item.name}`}
                        onClick={() => setEditing(editing === item.productId ? null : item.productId)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-forest transition-colors hover:bg-mint"
                      >
                        <Icon.pencil size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.productId)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-[#b4522f] transition-colors hover:bg-[#fdf1ed]"
                      >
                        <Icon.trash size={17} />
                      </button>
                    </div>

                    {editing === item.productId && (
                      <ItemEditor
                        item={item}
                        onSave={(q, u) => {
                          setQuantity(item.productId, q, u);
                          setEditing(null);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rounded-2xl border border-line bg-white px-4 py-4">
            <div className="flex items-center gap-2 text-forest">
              <Icon.note size={18} />
              <h2 className="display text-[14px] uppercase">Notes for the shop</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Buy the monthly refill — check the bathroom shelf too."
              className="mt-3 w-full resize-none rounded-xl border border-line bg-cream px-3 py-2.5 text-[14.5px] outline-none transition-colors focus:border-sage"
            />
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Btn variant="outline" size="lg" className="flex-1" onClick={() => nav("home")}>
              <Icon.plus size={18} /> Add more items
            </Btn>
            <Btn size="lg" className="flex-1" onClick={() => nav("preview")}>
              <Icon.doc size={18} /> Generate PDF
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemEditor({
  item,
  onSave,
}: {
  item: SelectedItem;
  onSave: (quantity: number, unit: string) => void;
}) {
  const [quantity, setQuantityState] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);

  return (
    <div className="anim-rise border-t border-dashed border-sage/50 bg-mint/40 px-4 py-3">
      <Stepper
        compact
        quantity={quantity}
        unit={unit}
        onChange={(q, u) => {
          setQuantityState(q);
          setUnit(u);
          onSave(q, u);
        }}
      />
      <div className="mt-2.5">
        <QtyChips
          quantity={quantity}
          unit={unit}
          onChange={(q, u) => {
            setQuantityState(q);
            setUnit(u);
            onSave(q, u);
          }}
        />
      </div>
    </div>
  );
}
