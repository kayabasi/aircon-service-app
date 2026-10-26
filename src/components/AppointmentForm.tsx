import { useState } from "react";
import { addDays } from "date-fns";
import { CalendarCheck, ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { KINDS } from "@/lib/constants";
import type { Visit, VisitKind } from "@/lib/types";
import { firstName, fmt, toISO, todayISO, uid, unitTitle, waLink } from "@/lib/util";
import { CustomerPicker } from "./CustomerPicker";
import { Button, Chip, ChipRow, Field, Label, Sheet, TextArea } from "./ui";

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function AppointmentForm({ open, onClose, customerId: initialCustomer, date: initialDate, initial, onNewCustomer }: {
  open: boolean; onClose: () => void; customerId?: string; date?: string; initial?: Visit; onNewCustomer: () => void;
}) {
  const { customers, units, saveVisit, deleteVisit, settings } = useStore();
  const [customerId, setCustomerId] = useState(initial?.customerId ?? initialCustomer ?? "");
  const [pick, setPick] = useState(!customerId);
  const [date, setDate] = useState(initial?.date ?? initialDate ?? todayISO());
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  const [kind, setKind] = useState<VisitKind>(initial?.kind ?? "bakim");
  const [unitId, setUnitId] = useState<string | null>(initial?.unitId ?? null);
  const [complaint, setComplaint] = useState(initial?.complaint ?? "");
  const customer = customers.find((c) => c.id === customerId);
  const cUnits = units.filter((u) => u.customerId === customerId && u.status === "active");

  const days = Array.from({ length: 7 }, (_, i) => toISO(addDays(new Date(), i)));
  const dayLabel = (iso: string, i: number) => (i === 0 ? "Bugün" : i === 1 ? "Yarın" : fmt(iso, "EEEE d"));

  async function save() {
    if (!customer) return;
    const v: Visit = {
      id: initial?.id ?? uid(), customerId, unitId, status: "planned", date, time, kind, complaint: complaint.trim(),
      tasks: [], faults: [], parts: [], note: "", photos: [], technician: settings.technicianName,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    try {
      await saveVisit(v);
      const when = `${fmt(date, "d MMMM EEEE")}${time ? ` saat ${time}` : ""}`;
      toast.success(initial ? "Randevu güncellendi" : "Randevu verildi", {
        description: `${customer.name}, ${when}`,
        action: customer.phone
          ? {
              label: "WhatsApp'tan bildir",
              onClick: () => window.open(waLink(customer.phone, `Merhaba ${firstName(customer.name)}, klima servisi için ${when} geliyoruz. ${settings.businessName}`.trim()), "_blank"),
            }
          : undefined,
        duration: 8000,
      });
      onClose();
    } catch { /* store toasts */ }
  }

  async function cancel() {
    if (!initial) return;
    await deleteVisit(initial.id);
    toast.success("Randevu iptal edildi");
    onClose();
  }

  if (pick) {
    return (
      <Sheet open={open} onClose={onClose} tall title="Kime randevu?">
        <CustomerPicker selected={customerId} onPick={(id) => { setCustomerId(id); setPick(false); setUnitId(null); }} onNew={onNewCustomer} />
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={initial ? "Randevuyu düzenle" : "Randevu ver"}
      footer={<Button block onClick={save}><CalendarCheck size={22} />{initial ? "Değişiklikleri kaydet" : "Randevuyu kaydet"}</Button>}
    >
      <div className="space-y-7">
        <button type="button" onClick={() => setPick(true)} className="press flex w-full items-center gap-2 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-inset ring-line">
          <span className="flex-1">
            <span className="block text-sm text-ink-2">Müşteri</span>
            <span className="block text-base font-semibold">{customer?.name}</span>
          </span>
          {!initial && <span className="flex items-center gap-1 font-semibold text-cold"><ChevronLeft size={20} />Değiştir</span>}
        </button>

        <div>
          <Label>Hangi gün?</Label>
          <ChipRow>
            {days.map((d, i) => <Chip key={d} on={date === d} onClick={() => setDate(d)}><span className="first-letter:uppercase">{dayLabel(d, i)}</span></Chip>)}
          </ChipRow>
          <Field className="mt-3" type="date" value={date} min={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Başka bir tarih seç" />
        </div>

        <div>
          <Label>Saat</Label>
          <ChipRow>
            <Chip on={time === null} onClick={() => setTime(null)}>Belli değil</Chip>
            {TIMES.map((t) => <Chip key={t} on={time === t} onClick={() => setTime(t)}><span className="num">{t}</span></Chip>)}
          </ChipRow>
        </div>

        <div>
          <Label>Ne için?</Label>
          <ChipRow>
            {KINDS.map((k) => <Chip key={k.id} on={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</Chip>)}
          </ChipRow>
        </div>

        {cUnits.length > 1 && (
          <div>
            <Label>Hangi klima?</Label>
            <ChipRow>
              <Chip on={unitId === null} onClick={() => setUnitId(null)}>Hepsi</Chip>
              {cUnits.map((u) => <Chip key={u.id} on={unitId === u.id} onClick={() => setUnitId(u.id)}>{u.room || unitTitle(u)}</Chip>)}
            </ChipRow>
          </div>
        )}

        <TextArea label="Not" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Müşteri ne dedi? (Soğutmuyor, su damlatıyor…)" rows={2} />

        {initial && <Button variant="danger" block onClick={cancel}><Trash2 size={20} />Randevuyu iptal et</Button>}
      </div>
    </Sheet>
  );
}
