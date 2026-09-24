"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Nav } from "@/components/chrome";
import type { GeneratedFile } from "@/components/screens/PreviewScreen";
import { useStore } from "@/lib/store";
import { Btn } from "@/components/ui";
import { longDate, fileDate } from "@/lib/format";

export default function ReadyScreen({ nav, file }: { nav: Nav; file: GeneratedFile }) {
  const { selectedItems, notes, newList } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const summary = [
    "Household shopping list — " + longDate(file.date),
    "",
    ...selectedItems.map((i) => `☐ ${i.name} — ${i.quantity} ${i.unit}`),
    notes ? `\nNotes: ${notes}` : "",
    "",
    "Made with ♥ HomeList",
  ]
    .filter(Boolean)
    .join("\n");

  function download() {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setToast("PDF saved to your device");
  }

  async function share() {
    try {
      const pdfFile = new File([file.blob], file.filename, { type: "application/pdf" });
      const navShare = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (typeof navigator.share === "function" && (!navShare.canShare || navShare.canShare({ files: [pdfFile] }))) {
        await navigator.share({
          files: [pdfFile],
          title: "Household shopping list",
          text: summary,
        });
        setShared(true);
        setToast("Shared");
        return;
      }
      await navigator.clipboard.writeText(summary);
      setToast("Sharing isn't supported here — the list is copied as text");
    } catch {
      setToast("Share cancelled");
    }
  }

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className="pb-40 lg:pb-20">
      <div className="anim-rise mx-auto max-w-[560px] text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-mint text-forest">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
            <path
              d="m5 12.5 4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-draw"
            />
          </svg>
        </div>
        <h1 className="display mt-6 text-[30px] leading-[1.05] text-forest lg:text-[36px]">
          Your shopping list is ready.
        </h1>
        <p className="mt-2 text-[15px] text-mute">
          PDF generated successfully on {longDate(file.date)}.
        </p>

        {/* file card */}
        <div className="mt-7 flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fdf1ed] text-[#c0562f]">
            <Icon.doc size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold">{file.filename.replace(".pdf", "")}</p>
            <p className="tnum text-[12.5px] text-mute">
              {fileDate(file.date)} · PDF · 1 page · {file.kilobytes} KB
            </p>
          </div>
        </div>
        {!file.historySaved && (
          <p className="mt-3 rounded-xl border border-[#f0d3cb] bg-[#fdf1ed] px-4 py-3 text-left text-[13px] text-[#8f3d20]">
            Your PDF is ready, but this list was not saved to history. You can still download it.
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          <Btn size="lg" className="w-full" onClick={share}>
            <Icon.share size={19} /> Share PDF
          </Btn>
          <Btn size="lg" variant="outline" className="w-full" onClick={download}>
            <Icon.download size={19} /> Save PDF
          </Btn>
          <Btn
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => {
              newList();
              nav("home");
            }}
          >
            <Icon.plus size={19} /> Create new list
          </Btn>
          <Btn
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => (shared ? nav("home") : nav("list"))}
          >
            Done
          </Btn>
        </div>

        <div className="mt-7 rounded-2xl border border-line bg-white px-4 py-4">
          <p className="tracked text-[9.5px] font-bold text-mute">Share via</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <ShareTile
              label="WhatsApp"
              color="#25D366"
              onClick={() =>
                open(`https://wa.me/?text=${encodeURIComponent(summary)}`)
              }
            />
            <ShareTile
              label="Telegram"
              color="#2AABEE"
              onClick={() =>
                open(
                  `https://t.me/share/url?url=&text=${encodeURIComponent(summary)}`,
                )
              }
            />
            <ShareTile
              label="Email"
              color="#4CAF68"
              onClick={() =>
                open(
                  `mailto:?subject=${encodeURIComponent(
                    "Household shopping list",
                  )}&body=${encodeURIComponent(summary)}`,
                )
              }
            />
            <ShareTile
              label="Copy text"
              color="#245C39"
              onClick={async () => {
                await navigator.clipboard.writeText(summary);
                setToast("List copied as text");
              }}
            />
          </div>
        </div>

        <p className="script mt-7 text-[24px] text-clay">Happy Shopping! ♡</p>
      </div>

      {toast && (
        <div
          role="status"
          className="anim-rise fixed bottom-[84px] left-1/2 z-40 -translate-x-1/2 rounded-full bg-forest px-5 py-2.5 text-[13.5px] font-semibold text-cream shadow-lg lg:bottom-8"
          onAnimationEnd={() => window.setTimeout(() => setToast(null), 2200)}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ShareTile({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[86px] flex-col items-center gap-2 rounded-xl border border-line bg-cream px-2 py-3 transition-all hover:-translate-y-[2px] hover:border-sage"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-[12px] text-white transition-transform group-hover:scale-105"
        style={{ background: color }}
      >
        <Icon.share size={19} />
      </span>
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </button>
  );
}
