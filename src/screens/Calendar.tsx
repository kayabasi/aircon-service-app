import { useMemo, useRef, useState } from "react";
import { addDays, addWeeks, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/store";
import { fmt, toISO, todayISO } from "@/lib/util";
import { PlannedCard, VisitRow } from "@/components/Rows";
import { useSheets } from "@/components/Sheets";
import { Button, cx } from "@/components/ui";

export default function Calendar() {
  const { visits, units } = useStore();
  const { openAppointment } = useSheets();
  const [week, setWeek] = useState(0);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const today = todayISO();

  const days = useMemo(() => {
    const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), week);
    return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
  }, [week]);

  const byDay = useMemo(() => {
    const m: Record<string, { planned: typeof visits; done: typeof visits; due: number }> = {};
    for (const d of days) m[d] = { planned: [], done: [], due: 0 };
    for (const v of visits) {
      if (!m[v.date]) continue;
      if (v.status === "planned") m[v.date].planned.push(v);
      else if (v.status === "done") m[v.date].done.push(v);
    }
    for (const u of units) if (u.status === "active" && u.nextDueDate && m[u.nextDueDate]) m[u.nextDueDate].due++;
    for (const d of days) m[d].planned.sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
    return m;
  }, [visits, units, days]);

  const range = `${fmt(days[0], "d MMM")} – ${fmt(days[6], "d MMM")}`;

  return (
    <div>
      <div className="pt-safe sticky top-0 z-20 -mx-4 bg-paper px-4 pb-3 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Takvim</h1>
          {week !== 0 && <Button size="sm" variant="quiet" onClick={() => setWeek(0)}>Bu hafta</Button>}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button aria-label="Önceki hafta" onClick={() => setWeek(week - 1)} className="press grid size-12 place-items-center rounded-full bg-surface ring-1 ring-inset ring-line"><ChevronLeft size={24} /></button>
          <p className="num text-lg font-semibold">{range}</p>
          <button aria-label="Sonraki hafta" onClick={() => setWeek(week + 1)} className="press grid size-12 place-items-center rounded-full bg-surface ring-1 ring-inset ring-line"><ChevronRight size={24} /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const n = byDay[d].planned.length;
            return (
              <button
                key={d}
                onClick={() => refs.current[d]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={cx("press flex h-[68px] flex-col items-center justify-center rounded-2xl", d === today ? "bg-cold text-white" : "bg-surface")}
              >
                <span className={cx("text-[13px] font-semibold first-letter:uppercase", d === today ? "text-white/85" : "text-ink-2")}>{fmt(d, "EEEEEE")}</span>
                <span className="num text-lg font-bold leading-tight">{fmt(d, "d")}</span>
                <span className={cx("mt-0.5 h-1.5 w-1.5 rounded-full", n ? (d === today ? "bg-white" : "bg-cold") : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-7 pt-2">
        {days.map((d) => {
          const { planned, done, due } = byDay[d];
          const empty = !planned.length && !done.length;
          return (
            <section key={d} ref={(el) => { refs.current[d] = el; }} className="scroll-mt-[260px]">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h2 className={cx("text-lg font-bold first-letter:uppercase", d < today && "text-ink-2")}>
                  {d === today ? "Bugün, " : ""}{fmt(d, d === today ? "d MMMM" : "EEEE d MMMM")}
                </h2>
                {d >= today && (
                  <Button size="sm" variant="ghost" onClick={() => openAppointment({ date: d })}><Plus size={18} />Randevu</Button>
                )}
              </div>
              {empty ? (
                <p className="rounded-2xl bg-sunk px-4 py-3.5 text-ink-2">{d < today ? "İş kaydı yok" : "Boş gün"}</p>
              ) : (
                <div className="space-y-2.5">
                  {planned.map((v) => <PlannedCard key={v.id} v={v} />)}
                  {done.map((v) => <VisitRow key={v.id} v={v} showCustomer />)}
                </div>
              )}
              {due > 0 && <p className="mt-2 px-1 text-sm text-warm">{due} klimanın bakım tarihi bu gün doluyor</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
