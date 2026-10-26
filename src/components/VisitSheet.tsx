import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { KIND_LABEL } from "@/lib/constants";
import type { Visit } from "@/lib/types";
import { fmt, unitTitle } from "@/lib/util";
import { Lightbox, Photo } from "./Photos";
import { Button, Sheet } from "./ui";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <p className="text-sm text-ink-2">{label}</p>
      <div className="mt-0.5 text-base">{children}</div>
    </div>
  );
}

export function VisitSheet({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const { units, customers, settings, deleteVisit } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const unit = units.find((u) => u.id === visit.unitId);
  const customer = customers.find((c) => c.id === visit.customerId);
  const faultTitle = (code: string) => settings.faults.find((f) => f.code === code)?.title;

  return (
    <Sheet open onClose={onClose} title={`${KIND_LABEL[visit.kind]}, ${fmt(visit.date, "d MMMM yyyy")}`}>
      <div className="divide-y divide-line">
        <Row label="Müşteri">{customer?.name}</Row>
        {unit && <Row label="Klima">{[unit.room, unitTitle(unit)].filter(Boolean).join(", ")}</Row>}
        {visit.complaint && <Row label="Şikayet">{visit.complaint}</Row>}
        {visit.tasks.length > 0 && <Row label="Yapılanlar"><ul className="list-disc pl-5">{visit.tasks.map((t) => <li key={t}>{t}</li>)}</ul></Row>}
        {visit.faults.length > 0 && <Row label="Arıza kodu">{visit.faults.map((c) => <p key={c}><b>{c}</b>{faultTitle(c) ? `, ${faultTitle(c)}` : ""}</p>)}</Row>}
        {visit.parts.length > 0 && <Row label="Değişen parçalar">{visit.parts.join(", ")}</Row>}
        {visit.note && <Row label="Not"><p className="whitespace-pre-wrap">{visit.note}</p></Row>}
        {visit.photos.length > 0 && (
          <Row label="Fotoğraflar">
            <div className="mt-1 flex flex-wrap gap-2">{visit.photos.map((p) => <Photo key={p} path={p} className="size-24" onClick={() => setView(p)} />)}</div>
          </Row>
        )}
        {visit.technician && <Row label="Yapan">{visit.technician}</Row>}
      </div>
      <div className="mt-6">
        {confirm ? (
          <div className="rounded-3xl bg-hot-tint p-4">
            <p className="font-semibold text-hot">Bu servis kaydı silinsin mi?</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>Vazgeç</Button>
              <Button className="bg-hot text-white" onClick={async () => { await deleteVisit(visit.id); toast.success("Servis kaydı silindi"); onClose(); }}>Sil</Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" block onClick={() => setConfirm(true)}><Trash2 size={20} />Kaydı sil</Button>
        )}
      </div>
      {view && <Lightbox path={view} onClose={() => setView(null)} />}
    </Sheet>
  );
}
