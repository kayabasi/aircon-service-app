import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, MessageCircle, Navigation, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { KIND_LABEL } from "@/lib/constants";
import type { Customer, Unit, Visit } from "@/lib/types";
import { daysUntil, dueState, dueText, fmt, mapsLink, parse, reminderMessage, telLink, unitTitle, waLink } from "@/lib/util";
import { useSheets } from "./Sheets";
import { Avatar, Button, DueBadge, LinkButton, cx } from "./ui";

/* ─── Customer list row ─────────────────────────────────── */
export function CustomerRow({ c, units }: { c: Customer; units: Unit[] }) {
  const { settings } = useStore();
  const due = units.map((u) => ({ u, s: dueState(u, settings.remindWindowDays) })).filter((x) => x.s === "late" || x.s === "soon")
    .sort((a, b) => a.u.nextDueDate!.localeCompare(b.u.nextDueDate!))[0];
  return (
    <Link to={`/musteri/${c.id}`} className="press flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 active:bg-sunk">
      <Avatar name={c.name} tone={due?.s === "late" ? "late" : due?.s === "soon" ? "soon" : "plain"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold">{c.name}</span>
        <span className="block truncate text-sm text-ink-2">{[c.district, units.length ? `${units.length} klima` : ""].filter(Boolean).join(", ")}</span>
      </span>
      {due ? <DueBadge state={due.s}>{due.s === "late" ? "Bakım geçti" : "Bakım yakın"}</DueBadge> : <ChevronRight size={22} className="text-ink-3" />}
    </Link>
  );
}

/* ─── Unit "service sticker" with maintenance gauge ─────── */
export function UnitCard({ u }: { u: Unit }) {
  const { settings } = useStore();
  const { openUnit } = useSheets();
  const state = dueState(u, settings.remindWindowDays);
  let progress = 0;
  if (u.lastServiceDate && u.nextDueDate) {
    const total = parse(u.nextDueDate).getTime() - parse(u.lastServiceDate).getTime();
    const gone = Date.now() - parse(u.lastServiceDate).getTime();
    progress = Math.max(0.04, Math.min(1, gone / total));
  } else if (u.nextDueDate) progress = daysUntil(u.nextDueDate) <= 0 ? 1 : 0.5;
  const inactive = u.status !== "active";

  return (
    <button onClick={() => openUnit(u.customerId, u)} className={cx("press block w-full rounded-3xl bg-surface p-4 text-left active:bg-sunk", inactive && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight">{u.room || unitTitle(u)}</p>
          <p className="mt-0.5 text-ink-2">{u.room ? unitTitle(u) : u.model}{inactive ? `, ${u.status === "removed" ? "söküldü" : "değiştirildi"}` : ""}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunk text-ink-2"><Pencil size={18} /></span>
      </div>

      {!inactive && (u.nextDueDate ? (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-ink-2">Sonraki bakım</p>
              <p className="text-xl font-bold leading-tight first-letter:uppercase">{fmt(u.nextDueDate, "MMMM yyyy")}</p>
            </div>
            <DueBadge state={state}>{dueText(u.nextDueDate)}</DueBadge>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sunk" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Bakıma kalan süre">
            <div
              className={cx("h-full rounded-full", state === "late" ? "bg-hot" : state === "soon" ? "bg-warm" : "bg-cold")}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {u.lastServiceDate && <p className="mt-2 text-sm text-ink-2">Son bakım {fmt(u.lastServiceDate)}</p>}
        </div>
      ) : (
        <p className="mt-3 text-ink-2">{u.intervalMonths ? "Henüz bakım kaydı yok" : "Bakım hatırlatması kapalı"}</p>
      ))}
    </button>
  );
}

/* ─── Service history item ─────────────────────────────── */
export function VisitRow({ v, showCustomer }: { v: Visit; showCustomer?: boolean }) {
  const { units, customers } = useStore();
  const { openVisit } = useSheets();
  const u = units.find((x) => x.id === v.unitId);
  const c = customers.find((x) => x.id === v.customerId);
  const summary = v.tasks.length ? v.tasks.join(", ") : v.complaint || v.note || "Detay girilmemiş";
  return (
    <button onClick={() => openVisit(v)} className="press flex w-full gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left active:bg-sunk">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{KIND_LABEL[v.kind]}</span>
          <span className="text-sm text-ink-2">{showCustomer ? c?.name : fmt(v.date)}</span>
        </span>
        <span className="mt-0.5 block text-ink-2">{[u?.room || (u && unitTitle(u)), summary].filter(Boolean).join(": ")}</span>
      </span>
      <ChevronRight size={22} className="mt-0.5 shrink-0 text-ink-3" />
    </button>
  );
}

/* ─── Appointment card with one-tap actions ───────────── */
export function PlannedCard({ v, showDate }: { v: Visit; showDate?: boolean }) {
  const { customers, units } = useStore();
  const { openAppointment } = useSheets();
  const nav = useNavigate();
  const c = customers.find((x) => x.id === v.customerId);
  if (!c) return null;
  const u = units.find((x) => x.id === v.unitId);
  const late = daysUntil(v.date) < 0;
  const map = mapsLink(c);

  return (
    <div className="rounded-3xl bg-surface p-4">
      <button onClick={() => openAppointment({ initial: v })} className="press flex w-full items-start gap-4 text-left">
        <span className={cx("num w-16 shrink-0 text-xl font-bold leading-tight", late && "text-hot")}>
          {showDate || late ? <span className="block text-base">{late ? dueText(v.date) : fmt(v.date, "d MMM")}</span> : null}
          {v.time ?? (showDate || late ? "" : "Gün içi")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-tight">{c.name}</span>
          <span className="block text-ink-2">{[c.district, KIND_LABEL[v.kind] + (u ? ` (${u.room || unitTitle(u)})` : "")].filter(Boolean).join(", ")}</span>
          {v.complaint && <span className="mt-1 block">{v.complaint}</span>}
        </span>
      </button>
      {c.note && <p className="mt-3 rounded-2xl bg-warm-tint px-3.5 py-2.5 text-ink">{c.note}</p>}
      <div className="mt-3 grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        {c.phone ? <LinkButton href={telLink(c.phone)} size="md"><Phone size={20} />Ara</LinkButton> : <span />}
        {map ? <LinkButton href={map} size="md" newTab><Navigation size={20} />Yol</LinkButton> : <span />}
        <Button size="md" onClick={() => nav(`/is?musteri=${c.id}&randevu=${v.id}`)}><CheckCircle2 size={20} />İş bitti</Button>
      </div>
    </div>
  );
}

/* ─── Maintenance-due card ─────────────────────────────── */
export function DueCard({ c, units: us, due }: { c: Customer; units: Unit[]; due: string }) {
  const { settings, markReminded } = useStore();
  const { openAppointment } = useSheets();
  const late = daysUntil(due) < 0;
  const what = us.length === 1 ? (us[0].room || unitTitle(us[0])) : `${us.length} klima`;
  return (
    <div className="rounded-3xl bg-surface p-4">
      <Link to={`/musteri/${c.id}`} className="press flex items-center gap-3">
        <Avatar name={c.name} tone={late ? "late" : "soon"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold leading-tight">{c.name}</span>
          <span className="block truncate text-ink-2">{[c.district, what].filter(Boolean).join(", ")}</span>
        </span>
        <DueBadge state={late ? "late" : "soon"}>{dueText(due)}</DueBadge>
      </Link>
      <div className="mt-3 grid grid-cols-[1.5fr_1fr_1fr] gap-2">
        {c.phone ? (
          <LinkButton
            href={waLink(c.phone, reminderMessage(settings, c, us[0]))}
            variant="wa"
            size="md"
            newTab
            onClick={() => {
              void markReminded(us.map((u) => u.id));
              toast.success(`${c.name} hatırlatıldı`, { description: "14 gün boyunca bu listede görünmeyecek." });
            }}
          >
            <MessageCircle size={20} />Hatırlat
          </LinkButton>
        ) : <span />}
        {c.phone ? <LinkButton href={telLink(c.phone)} size="md"><Phone size={20} />Ara</LinkButton> : <span />}
        <Button variant="secondary" size="md" onClick={() => openAppointment({ customerId: c.id })}>Randevu</Button>
      </div>
    </div>
  );
}
