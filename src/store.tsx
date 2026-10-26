import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Customer, Settings, Snapshot, Unit, Visit, VisitKind } from "@/lib/types";
import { addMonthsISO, daysUntil, uid } from "@/lib/util";
import type { Repo } from "@/repo/repo";

export type ServiceInput = {
  customerId: string;
  unitIds: string[];
  date: string;
  kind: VisitKind;
  complaint: string;
  tasks: string[];
  faults: string[];
  parts: string[];
  note: string;
  photos: string[];
  intervalMonths: number | null;
  /** When completing an appointment, the planned visit is converted instead of duplicated. */
  plannedVisitId?: string;
};

type Store = Snapshot & {
  repo: Repo;
  ready: boolean;
  saveCustomer(c: Customer): Promise<void>;
  deleteCustomer(id: string): Promise<void>;
  saveUnit(u: Unit): Promise<void>;
  deleteUnit(id: string): Promise<void>;
  saveVisit(v: Visit): Promise<void>;
  deleteVisit(id: string): Promise<void>;
  recordService(input: ServiceInput): Promise<void>;
  markReminded(unitIds: string[]): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  reload(): Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ repo, children }: { repo: Repo; children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;

  const reload = useCallback(async () => {
    try {
      setSnap(await repo.load());
    } catch (e) {
      toast.error("Kayıtlar yüklenemedi. İnternet bağlantını kontrol et.", { description: String((e as Error).message) });
    }
  }, [repo]);

  useEffect(() => { void reload(); }, [reload]);

  /** Optimistic update: change the screen immediately, then persist; roll back by reloading on failure. */
  const run = useCallback(async (mutate: (s: Snapshot) => Snapshot, persist: () => Promise<unknown>) => {
    setSnap((s) => (s ? mutate(s) : s));
    try {
      await persist();
    } catch (e) {
      toast.error("Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.", { description: String((e as Error).message) });
      await reload();
      throw e;
    }
  }, [reload]);

  const upsert = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

  const store = useMemo<Store | null>(() => {
    if (!snap) return null;
    return {
      ...snap,
      repo,
      ready: true,
      reload,
      saveCustomer: (c) => run((s) => ({ ...s, customers: upsert(s.customers, c) }), () => repo.saveCustomer(c)),
      deleteCustomer: (id) => run(
        (s) => ({
          ...s,
          customers: s.customers.filter((c) => c.id !== id),
          units: s.units.filter((u) => u.customerId !== id),
          visits: s.visits.filter((v) => v.customerId !== id),
        }),
        () => repo.deleteCustomer(id),
      ),
      saveUnit: (u) => run((s) => ({ ...s, units: upsert(s.units, u) }), () => repo.saveUnit(u)),
      deleteUnit: (id) => run(
        (s) => ({ ...s, units: s.units.filter((u) => u.id !== id), visits: s.visits.map((v) => (v.unitId === id ? { ...v, unitId: null } : v)) }),
        () => repo.deleteUnit(id),
      ),
      saveVisit: (v) => run((s) => ({ ...s, visits: upsert(s.visits, v) }), () => repo.saveVisit(v)),
      deleteVisit: (id) => run((s) => ({ ...s, visits: s.visits.filter((v) => v.id !== id) }), () => repo.deleteVisit(id)),
      saveSettings: (settings) => run((s) => ({ ...s, settings }), () => repo.saveSettings(settings)),

      async recordService(input) {
        const s = snapRef.current!;
        const now = new Date().toISOString();
        const targets: (string | null)[] = input.unitIds.length ? input.unitIds : [null];
        const visits: Visit[] = targets.map((unitId, i) => ({
          id: i === 0 && input.plannedVisitId ? input.plannedVisitId : uid(),
          customerId: input.customerId,
          unitId,
          status: "done",
          date: input.date,
          time: null,
          kind: input.kind,
          complaint: input.complaint,
          tasks: input.tasks,
          faults: input.faults,
          parts: input.parts,
          note: input.note,
          photos: i === 0 ? input.photos : [],
          technician: s.settings.technicianName,
          createdAt: now,
        }));
        const units: Unit[] = s.units
          .filter((u) => input.unitIds.includes(u.id))
          .map((u) => {
            // A newer service already on record wins (e.g. back-dating an old visit).
            const isLatest = !u.lastServiceDate || input.date >= u.lastServiceDate;
            if (!isLatest) return u;
            return {
              ...u,
              lastServiceDate: input.date,
              intervalMonths: input.intervalMonths,
              nextDueDate: input.intervalMonths ? addMonthsISO(input.date, input.intervalMonths) : null,
              lastRemindedAt: null,
            };
          });
        await run(
          (st) => ({
            ...st,
            visits: visits.reduce((acc, v) => upsert(acc, v), st.visits),
            units: units.reduce((acc, u) => upsert(acc, u), st.units),
          }),
          async () => {
            for (const v of visits) await repo.saveVisit(v);
            for (const u of units) await repo.saveUnit(u);
          },
        );
      },

      async markReminded(unitIds) {
        const at = new Date().toISOString();
        const units = snapRef.current!.units.filter((u) => unitIds.includes(u.id)).map((u) => ({ ...u, lastRemindedAt: at }));
        await run(
          (st) => ({ ...st, units: units.reduce((acc, u) => upsert(acc, u), st.units) }),
          async () => { for (const u of units) await repo.saveUnit(u); },
        );
      },
    };
  }, [snap, repo, run, reload]);

  if (!store) return <Splash />;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center text-ink-2">
      <p className="text-lg">Kayıtlar açılıyor…</p>
    </div>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** Customers whose active units are due within the window and weren't reminded in the last 14 days. */
export function useDueList() {
  const { customers, units, settings, visits } = useStore();
  return useMemo(() => {
    const planned = new Set(visits.filter((v) => v.status === "planned").map((v) => v.customerId));
    const byCustomer = new Map<string, Unit[]>();
    for (const u of units) {
      if (u.status !== "active" || !u.nextDueDate) continue;
      if (daysUntil(u.nextDueDate) > settings.remindWindowDays) continue;
      if (u.lastRemindedAt && (Date.now() - Date.parse(u.lastRemindedAt)) / 86400000 < 14) continue;
      if (planned.has(u.customerId)) continue;
      byCustomer.set(u.customerId, [...(byCustomer.get(u.customerId) ?? []), u]);
    }
    return [...byCustomer.entries()]
      .map(([cid, us]) => ({
        customer: customers.find((c) => c.id === cid)!,
        units: us,
        due: us.map((u) => u.nextDueDate!).sort()[0],
      }))
      .filter((x) => x.customer)
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [customers, units, settings.remindWindowDays, visits]);
}
