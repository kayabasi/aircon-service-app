import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, ClipboardCheck, UserPlus } from "lucide-react";
import type { Customer, Unit, Visit } from "@/lib/types";
import { AppointmentForm } from "./AppointmentForm";
import { CustomerForm } from "./CustomerForm";
import { UnitForm } from "./UnitForm";
import { VisitSheet } from "./VisitSheet";
import { Sheet } from "./ui";

type Active =
  | { kind: "new" }
  | { kind: "customer"; initial?: Customer; onSaved?: (c: Customer) => void }
  | { kind: "unit"; customerId: string; initial?: Unit; onSaved?: (u: Unit) => void }
  | { kind: "appointment"; customerId?: string; date?: string; initial?: Visit }
  | { kind: "visit"; visit: Visit }
  | null;

type Api = {
  openNew(): void;
  openCustomer(initial?: Customer, onSaved?: (c: Customer) => void): void;
  openUnit(customerId: string, initial?: Unit, onSaved?: (u: Unit) => void): void;
  openAppointment(opts?: { customerId?: string; date?: string; initial?: Visit }): void;
  openVisit(v: Visit): void;
};

const Ctx = createContext<Api | null>(null);
export const useSheets = () => useContext(Ctx)!;

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active>(null);
  const [key, setKey] = useState(0);
  const nav = useNavigate();
  const open = useCallback((a: Active) => { setKey((k) => k + 1); setActive(a); }, []);
  const close = useCallback(() => setActive(null), []);

  const api = useMemo<Api>(() => ({
    openNew: () => open({ kind: "new" }),
    openCustomer: (initial, onSaved) => open({ kind: "customer", initial, onSaved }),
    openUnit: (customerId, initial, onSaved) => open({ kind: "unit", customerId, initial, onSaved }),
    openAppointment: (o) => open({ kind: "appointment", ...o }),
    openVisit: (visit) => open({ kind: "visit", visit }),
  }), [open]);

  return (
    <Ctx.Provider value={api}>
      {children}

      {active?.kind === "new" && (
        <Sheet open onClose={close} title="Ne yapmak istiyorsun?">
          <div className="space-y-3 pb-2">
            <BigAction icon={<ClipboardCheck size={30} />} title="Yapılan işi kaydet" sub="Bakım, arıza, montaj" onClick={() => { close(); nav("/is"); }} primary />
            <BigAction icon={<CalendarPlus size={30} />} title="Randevu ver" sub="İleri bir tarihe iş yaz" onClick={() => open({ kind: "appointment" })} />
            <BigAction icon={<UserPlus size={30} />} title="Yeni müşteri" sub="Sadece kişiyi kaydet" onClick={() => open({ kind: "customer", onSaved: (c) => nav(`/musteri/${c.id}`) })} />
          </div>
        </Sheet>
      )}

      {active?.kind === "customer" && (
        <CustomerForm key={key} open onClose={close} initial={active.initial} onSaved={active.onSaved} />
      )}
      {active?.kind === "unit" && (
        <UnitForm key={key} open onClose={close} customerId={active.customerId} initial={active.initial} onSaved={active.onSaved} />
      )}
      {active?.kind === "appointment" && (
        <AppointmentForm
          key={key}
          open
          onClose={close}
          customerId={active.customerId}
          date={active.date}
          initial={active.initial}
          onNewCustomer={() => {
            const date = active.date;
            open({ kind: "customer", onSaved: (c) => setTimeout(() => open({ kind: "appointment", customerId: c.id, date }), 350) });
          }}
        />
      )}
      {active?.kind === "visit" && <VisitSheet key={key} visit={active.visit} onClose={close} />}
    </Ctx.Provider>
  );
}

function BigAction({ icon, title, sub, onClick, primary }: { icon: ReactNode; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`press flex w-full items-center gap-4 rounded-3xl px-5 py-5 text-left ${primary ? "bg-cold text-white active:bg-cold-press" : "bg-surface ring-1 ring-inset ring-line active:bg-sunk"}`}
    >
      <span className={primary ? "text-white" : "text-cold"}>{icon}</span>
      <span>
        <span className="block text-lg font-bold">{title}</span>
        <span className={`block text-base ${primary ? "text-white/85" : "text-ink-2"}`}>{sub}</span>
      </span>
    </button>
  );
}
