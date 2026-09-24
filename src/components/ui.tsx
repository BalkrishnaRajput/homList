"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { QUICK_QTY, UNITS, UNIT_STEP } from "@/lib/catalog-data";

/* ------------------------------------------------------------------ tick box */
export function Tickbox({
  checked,
  onChange,
  label,
  size = 24,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-[7px] border-2 transition-colors duration-200 ${
        checked
          ? "border-leaf bg-leaf text-white"
          : "border-[#c9c2b2] bg-white hover:border-forest hover:bg-mint"
      }`}
    >
      {checked && (
        <svg width={size - 8} height={size - 8} viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12.5 4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="anim-draw"
          />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------- buttons */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "leaf" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const sizes = {
    sm: "h-9 px-3.5 text-[13px] rounded-xl gap-1.5",
    md: "h-11 px-4 text-[14px] rounded-xl gap-2",
    lg: "h-13 px-5 text-[15px] rounded-2xl gap-2.5",
  }[size];
  const variants = {
    primary: "bg-forest text-cream hover:bg-[#1b4b2d] active:translate-y-px shadow-[0_1px_0_rgba(0,0,0,.12)]",
    leaf: "bg-leaf text-white hover:bg-[#43a05c] active:translate-y-px",
    outline: "border border-line bg-white text-ink hover:border-forest hover:bg-mint/60",
    ghost: "text-forest hover:bg-mint",
    danger: "border border-[#f0d3cb] bg-white text-[#b4522f] hover:bg-[#fdf1ed]",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${sizes} ${variants} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------- stepper */
export function Stepper({
  quantity,
  unit,
  onChange,
  compact = false,
}: {
  quantity: number;
  unit: string;
  onChange: (quantity: number, unit: string) => void;
  compact?: boolean;
}) {
  const step = UNIT_STEP[unit] ?? 1;
  const h = compact ? "h-9" : "h-10";
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-line bg-white ${h} tnum text-[14px] font-semibold`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(step, quantity - step), unit)}
        className="grid h-full w-9 place-items-center rounded-l-xl text-forest transition-colors hover:bg-mint"
      >
        <Icon.minus size={16} />
      </button>
      <span className="min-w-[74px] px-1 text-center">
        {quantity} {unit}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + step, unit)}
        className="grid h-full w-9 place-items-center rounded-r-xl text-forest transition-colors hover:bg-mint"
      >
        <Icon.plus size={16} />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- qty chips */
export function QtyChips({
  quantity,
  unit,
  onChange,
}: {
  quantity: number;
  unit: string;
  onChange: (quantity: number, unit: string) => void;
}) {
  const [other, setOther] = useState(false);
  const [draftQty, setDraftQty] = useState(String(quantity));
  const [draftUnit, setDraftUnit] = useState(unit);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_QTY.map((q) => {
          const active = q.quantity === quantity && q.unit === unit;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setOther(false);
                onChange(q.quantity, q.unit);
              }}
              className={`tnum rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                active
                  ? "border-forest bg-forest text-cream"
                  : "border-line bg-white text-ink hover:border-sage hover:bg-mint"
              }`}
            >
              {q.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setOther((v) => !v);
            setDraftQty(String(quantity));
            setDraftUnit(unit);
          }}
          className={`rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
            other
              ? "border-forest bg-forest text-cream"
              : "border-line bg-white text-ink hover:border-sage hover:bg-mint"
          }`}
        >
          Other
        </button>
      </div>

      {other && (
        <div className="anim-rise flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={draftQty}
            onChange={(e) => setDraftQty(e.target.value)}
            className="tnum h-9 w-20 rounded-lg border border-line bg-white px-2 text-[14px]"
            aria-label="Custom quantity"
          />
          <select
            value={draftUnit}
            onChange={(e) => setDraftUnit(e.target.value)}
            className="h-9 rounded-lg border border-line bg-white px-2 text-[14px]"
            aria-label="Unit"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Btn
            size="sm"
            variant="outline"
            onClick={() => {
              const q = Math.max(1, Number(draftQty) || 1);
              onChange(q, draftUnit);
              setOther(false);
            }}
          >
            Set
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- empty state */
export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="anim-rise mx-auto max-w-md rounded-3xl border border-dashed border-line bg-white/70 px-8 py-14 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-mint text-forest">
        {icon ?? <Icon.basket size={30} />}
      </div>
      <h3 className="display text-[19px] text-forest">{title}</h3>
      <p className="mx-auto mt-2 max-w-[34ch] text-[14px] text-mute">{hint}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ skeletons */
export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
          <div className="skeleton h-6 w-6 rounded-[7px]" />
          <div className="skeleton h-3.5 flex-1" style={{ maxWidth: `${45 + ((i * 13) % 35)}%` }} />
          <div className="skeleton h-3.5 w-12" />
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- count badge */
export function CountPill({ count }: { count: number }) {
  return (
    <span
      key={count}
      className={`tnum inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-[3px] text-[12px] font-bold transition-colors ${
        count > 0 ? "anim-pop bg-leaf text-white" : "bg-mist text-mute"
      }`}
    >
      {count}
    </span>
  );
}

/* ------------------------------------------------------------------ field */
export function Field({
  value,
  onChange,
  placeholder,
  label,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-white px-4 transition-colors focus-within:border-sage">
      <span className="text-mute">{icon ?? <Icon.search size={19} />}</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#a8a294]"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
          className="text-mute transition-colors hover:text-forest"
        >
          <Icon.close size={16} />
        </button>
      )}
    </label>
  );
}

/* ------------------------------------------------- responsive scaled canvas */
export function ScaledSheet({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={wrapRef}
      data-sheet-wrap
      className="w-full overflow-hidden"
      style={{ height: height * scale }}
    >
      <div
        className="sheet-scaler"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function useDelayedFlag(active: boolean, ms = 450) {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFlag(active), active ? ms : 0);
    return () => window.clearTimeout(t);
  }, [active, ms]);
  return active && flag;
}
