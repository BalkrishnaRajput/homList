"use client";

import { useState } from "react";
import { ScreenHeader, type Nav } from "@/components/chrome";
import SheetPreview from "@/components/SheetPreview";
import { Icon } from "@/components/icons";
import { useStore } from "@/lib/store";
import { Btn, EmptyState } from "@/components/ui";
import type { SheetGroup } from "@/lib/format";

export type GeneratedFile = {
  blob: Blob;
  filename: string;
  kilobytes: number;
  date: Date;
  title: string;
  listId: string | null;
  historySaved: boolean;
};

export default function PreviewScreen({
  nav,
  onGenerated,
}: {
  nav: Nav;
  onGenerated: (file: GeneratedFile) => void;
}) {
  const { selectedGroups, selectedItems, notes } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups: SheetGroup[] = selectedGroups.map((g) => ({
    name: g.category.name,
    icon: g.category.icon,
    tint: g.category.tint,
    items: g.items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
  }));

  async function generate() {
    setBusy(true);
    setError(null);
    const date = new Date();
    try {
      const { makePdfFile } = await import("@/lib/pdf-doc");
      const file = await makePdfFile({ groups, notes, date, title: "My Shopping List" });

      // keep a history entry the moment the PDF exists
      let listId: string | null = null;
      let historySaved = false;
      try {
        const res = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "My Shopping List",
            notes,
            items: selectedItems.map((i) => ({
              productId: i.productId,
              categoryId: i.categoryId,
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
            })),
          }),
        });
        if (!res.ok) throw new Error(`Saving PDF history failed (${res.status})`);
        const data = await res.json();
        listId = data?.list?.id ?? null;
        historySaved = Boolean(listId);
      } catch (error) {
        console.error(error);
      }

      onGenerated({ ...file, date, title: "My Shopping List", listId, historySaved });
    } catch (e) {
      console.error(e);
      setError("The PDF could not be built in this browser. Try the print option instead.");
    } finally {
      setBusy(false);
    }
  }

  function printSheet() {
    window.print();
  }

  return (
    <div className="pb-40 lg:pb-24">
      <ScreenHeader
        title="PDF Preview"
        subtitle="Check the sheet before generating"
        onBack={() => nav("list")}
        right={
          <button
            type="button"
            onClick={printSheet}
            aria-label="Print this sheet"
            title="Print / Save as PDF"
            className="mt-1 grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-forest transition-colors hover:bg-mint"
          >
            <Icon.printer size={18} />
          </button>
        }
      />

      {selectedItems.length === 0 ? (
        <EmptyState
          title="Nothing to print yet"
          hint="Add a few items to your list and the printable sheet appears here."
          action={<Btn onClick={() => nav("home")}>Browse categories</Btn>}
        />
      ) : (
        <>
          <div
            className="rounded-[24px] border border-line p-4 shadow-[0_18px_40px_rgba(31,41,55,0.10)] sm:p-8"
            style={{
              backgroundImage: "url(images/desk-surface.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="anim-lay overflow-hidden rounded-[6px] bg-cream shadow-[0_10px_30px_rgba(31,41,55,0.22)]">
              <SheetPreview groups={groups} notes={notes} date={new Date()} title="My Shopping List" />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-[#f0d3cb] bg-[#fdf1ed] px-4 py-3 text-[13.5px] text-[#8f3d20]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Btn variant="outline" size="lg" className="flex-1" onClick={() => nav("list")}>
              <Icon.back size={18} /> Back to edit
            </Btn>
            <Btn size="lg" className="flex-1" onClick={generate} disabled={busy}>
              {busy ? (
                "Building PDF…"
              ) : (
                <>
                  <Icon.doc size={18} /> Generate PDF sheet
                </>
              )}
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
