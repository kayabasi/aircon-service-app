import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Drawer } from "vaul";
import { Check, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

/* ─── Buttons ─────────────────────────────────────────── */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "wa" | "quiet";
const variants: Record<Variant, string> = {
  primary: "bg-cold text-white active:bg-cold-press",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line active:bg-sunk",
  quiet: "bg-sunk text-ink active:bg-line",
  ghost: "bg-transparent text-cold active:bg-cold-tint",
  danger: "bg-hot-tint text-hot active:bg-[#f8d9c8]",
  wa: "bg-wa text-white active:bg-wa-press",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "lg" | "md" | "sm"; block?: boolean }>(
  ({ variant = "primary", size = "lg", block, className, ...p }, ref) => (
    <button
      ref={ref}
      type="button"
      {...p}
      className={cx(
        "press inline-flex items-center justify-center gap-2 rounded-2xl font-semibold disabled:opacity-40",
        size === "lg" && "h-14 px-5 text-base",
        size === "md" && "h-12 px-4 text-base",
        size === "sm" && "h-10 px-3.5 text-sm",
        block && "w-full",
        variants[variant],
        className,
      )}
    />
  ),
);

/** Link styled as a button — used for tel:, wa.me and maps so the OS handles them. */
export function LinkButton({ href, variant = "secondary", size = "md", className, children, onClick, newTab }: {
  href: string; variant?: Variant; size?: "lg" | "md" | "sm"; className?: string; children: ReactNode; onClick?: () => void; newTab?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={cx(
        "press inline-flex items-center justify-center gap-2 rounded-2xl font-semibold",
        size === "lg" && "h-14 px-5 text-base",
        size === "md" && "h-12 px-4 text-base",
        size === "sm" && "h-10 px-3.5 text-sm",
        variants[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}

/* ─── Form fields ─────────────────────────────────────── */
export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-2 block">
      <span className="block text-base font-semibold">{children}</span>
      {hint && <span className="block text-sm text-ink-3">{hint}</span>}
    </span>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }>(
  ({ label, hint, className, ...p }, ref) => (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <input
        ref={ref}
        {...p}
        className={cx(
          "h-14 w-full rounded-2xl bg-surface px-4 text-base text-ink ring-1 ring-inset ring-line outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-cold",
          className,
        )}
      />
    </label>
  ),
);

export function TextArea({ label, hint, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <textarea
        rows={3}
        {...p}
        className={cx(
          "w-full resize-none rounded-2xl bg-surface px-4 py-3.5 text-base text-ink ring-1 ring-inset ring-line outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-cold",
          className,
        )}
      />
    </label>
  );
}

/* ─── Chips: the main input method. Tapping beats typing. ─ */
export function Chip({ on, onClick, children, className }: { on?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "press inline-flex min-h-12 items-center gap-1.5 rounded-full px-4 text-base font-medium",
        on ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-inset ring-line active:bg-sunk",
        className,
      )}
    >
      {on && <Check size={18} strokeWidth={2.75} />}
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

/* ─── Big choice tile (kinds, customers, units) ───────── */
export function Tile({ on, onClick, title, sub, right, className }: { on?: boolean; onClick?: () => void; title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "press flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left",
        on ? "bg-cold-tint ring-2 ring-inset ring-cold" : "bg-surface ring-1 ring-inset ring-line active:bg-sunk",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        {sub && <span className="block text-sm text-ink-2">{sub}</span>}
      </span>
      {right ?? (on !== undefined && (
        <span className={cx("grid size-7 shrink-0 place-items-center rounded-full", on ? "bg-cold text-white" : "ring-2 ring-inset ring-line")}>
          {on && <Check size={17} strokeWidth={3} />}
        </span>
      ))}
    </button>
  );
}

/* ─── Bottom sheet (vaul) ─────────────────────────────── */
export function Sheet({ open, onClose, title, children, footer, tall }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; tall?: boolean;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/45" />
        <Drawer.Content
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg flex-col rounded-t-[28px] bg-paper outline-none",
            tall ? "h-[94dvh]" : "max-h-[94dvh]",
          )}
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-line" />
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3">
            <Drawer.Title className="text-lg font-bold">{title}</Drawer.Title>
            <button onClick={onClose} aria-label="Kapat" className="press grid size-11 place-items-center rounded-full bg-sunk">
              <X size={22} />
            </button>
          </div>
          <div className="scroll-contain min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2">{children}</div>
          {footer && <div className="pb-safe shrink-0 bg-paper px-5 pt-3"><div className="pb-4">{footer}</div></div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* ─── Misc ────────────────────────────────────────────── */
export function SectionTitle({ children, count, action }: { children: ReactNode; count?: number; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3">
      <h2 className="text-lg font-bold">
        {children}
        {count !== undefined && <span className="num ml-2 font-semibold text-ink-3">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-sunk px-5 py-6">
      <p className="text-base font-semibold">{title}</p>
      {children && <p className="mt-1 text-base text-ink-2">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name, tone = "plain" }: { name: string; tone?: "plain" | "late" | "soon" }) {
  const initials = name.trim().split(/\s+/).map((p) => p[0]).filter(Boolean);
  const text = ((initials[0] ?? "") + (initials.length > 1 ? initials[initials.length - 1] : "")).toLocaleUpperCase("tr");
  return (
    <span
      className={cx(
        "grid size-12 shrink-0 place-items-center rounded-full text-base font-bold",
        tone === "late" ? "bg-hot-tint text-hot" : tone === "soon" ? "bg-warm-tint text-warm" : "bg-sunk text-ink-2",
      )}
    >
      {text}
    </span>
  );
}

export function DueBadge({ state, children }: { state: "late" | "soon" | "ok" | "none"; children: ReactNode }) {
  if (state === "none") return null;
  return (
    <span
      className={cx(
        "inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap",
        state === "late" && "bg-hot-tint text-hot",
        state === "soon" && "bg-warm-tint text-warm",
        state === "ok" && "bg-ok-tint text-ok",
      )}
    >
      {children}
    </span>
  );
}
