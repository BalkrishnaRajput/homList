"use client";

import { CategoryIcon, Icon } from "@/components/icons";
import { ScaledSheet } from "@/components/ui";
import { longDate, totalItems, type SheetGroup } from "@/lib/format";

/**
 * The printed sheet, rendered as a true A4 page (794 × 1123 @96dpi) so what you
 * see on Preview is what lands in the PDF.
 */
export default function SheetPreview({
  groups,
  notes,
  date = new Date(),
  title = "My Shopping List",
}: {
  groups: SheetGroup[];
  notes: string;
  date?: Date;
  title?: string;
}) {
  const items = totalItems(groups);
  const columns: SheetGroup[][] = [[], []];
  groups.forEach((g, i) => columns[i % 2].push(g));

  return (
    <ScaledSheet width={794} height={1123}>
      <div
        className="sheet-frame paper-grain relative h-full w-full overflow-hidden bg-cream"
        style={{ padding: "34px 46px 26px" }}
      >
        {/* handwritten margin notes */}
        <div
          className="script absolute left-[8px] top-[26px] text-[17px] leading-[1.15] text-forest"
          style={{ transform: "rotate(-7deg)" }}
        >
          Good
          <br />
          Food
          <br />
          Happier
          <br />
          Days <span className="text-clay">♥</span>
        </div>
        <div className="absolute right-[6px] top-[18px] h-[112px] w-[132px] rounded-[46%_54%_50%_50%/50%_46%_54%_50%] bg-[#E4EBDD]" />
        <div
          className="script absolute right-[16px] top-[26px] w-[118px] text-right text-[18px] leading-[1.15] text-forest"
          style={{ transform: "rotate(4deg)" }}
        >
          Plan it
          <br />
          Shop it
          <br />
          Live it
        </div>

        {/* masthead */}
        <div className="relative text-center">
          <svg width="46" height="42" viewBox="0 0 46 42" fill="none" className="mx-auto">
            <path
              d="M8 20.5 23 7l15 13.5"
              stroke="#D97757"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 19.5v14.2a1.6 1.6 0 0 0 1.6 1.6h20.8a1.6 1.6 0 0 0 1.6-1.6V19.5"
              stroke="#D97757"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M23 30s-5-2.9-5-5.9c0-1.7 1.3-2.8 2.8-2.8 1 0 1.8.5 2.2 1.3.4-.8 1.2-1.3 2.2-1.3 1.5 0 2.8 1.1 2.8 2.8 0 3-5 5.9-5 5.9Z"
              fill="#F0B9AC"
              stroke="#D97757"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="display mt-2 text-[41px] leading-[1] tracking-[-0.015em] text-forest uppercase">
            {title}
          </h1>
          <p className="tracked mt-2 text-[10.5px] font-semibold text-mute">
            Home essentials for a better tomorrow
          </p>
        </div>

        {/* meta pill */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-peach px-6 py-2 text-[13px] font-medium text-forest">
            <span className="flex items-center gap-2">
              <Icon.calendar size={16} />
              <span className="tnum">{longDate(date)}</span>
            </span>
            <span className="h-4 w-px bg-[#d9c6b6]" />
            <span className="flex items-center gap-2">
              <Icon.basket size={16} />
              <span className="tnum">
                {items} items · {groups.length} categories
              </span>
            </span>
          </div>
        </div>

        {/* category blocks */}
        <div className="mt-5 grid grid-cols-2 gap-x-[18px] gap-y-[16px]">
          {columns.map((col, ci) => (
            <div key={ci} className="space-y-[16px]">
              {col.map((group) => (
                <div
                  key={group.name}
                  className="overflow-hidden rounded-[14px] border border-[#E4DDCE] bg-white"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-[10px]"
                    style={{ background: group.tint }}
                  >
                    <span className="text-forest">
                      <CategoryIcon name={group.icon} size={24} />
                    </span>
                    <div>
                      <div className="display text-[15px] leading-[1.1] text-forest uppercase">
                        {group.name}
                      </div>
                      <div className="tnum text-[11px] text-mute">{group.items.length} items</div>
                    </div>
                    <span className="ml-auto text-[#c9a08c]">
                      <CategoryIcon name={group.icon} size={22} />
                    </span>
                  </div>
                  <div className="px-4 pb-2 pt-1">
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-end gap-2 border-b border-dotted border-[#DCD5C6] py-[7px] last:border-b-0"
                      >
                        <span className="mb-[1px] h-[15px] w-[15px] shrink-0 rounded-[4px] border-[1.6px] border-[#9aa0a6]" />
                        <span className="text-[13px] leading-[1.25] text-ink">{item.name}</span>
                        <span className="leader mb-[3px] h-[10px] flex-1" />
                        <span className="tnum text-[12.5px] font-medium text-ink">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* notes + sign-off */}
        <div className="mt-4 flex items-end gap-4">
          <div className="w-[73%] overflow-hidden rounded-[14px] border border-[#E4DDCE] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-forest">
              <Icon.note size={17} />
              <span className="display text-[13px] uppercase">Notes</span>
            </div>
            <div className="mt-2 space-y-[13px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="relative border-b border-[#DCD5C6]">
                  {i === 0 && notes && (
                    <span className="script block truncate pb-[2px] text-[16px] text-forest">
                      {notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex-1 pb-2">
            <div
              className="script text-[19px] leading-[1.1] text-forest"
              style={{ transform: "rotate(-3deg)" }}
            >
              Good Things
              <br />
              for Brighter
              <br />
              Days <span className="text-clay">♥</span>
            </div>
            <svg width="90" height="14" viewBox="0 0 90 14" fill="none" className="mt-1">
              <path
                d="M2 9c22-6 52-8 86-4"
                stroke="#E7A08B"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* footer */}
        <div className="absolute bottom-[22px] left-[46px] right-[46px]">
          <div className="h-px w-full bg-[#E1DACB]" />
          <p className="mt-2 text-center text-[11px] text-mute">
            Made with <span className="text-clay">♥</span>{" "}
            <span className="font-semibold text-forest">HomeList</span>
          </p>
        </div>
      </div>
    </ScaledSheet>
  );
}
