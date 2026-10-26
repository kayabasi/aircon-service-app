import { useState } from "react";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { BRANDS, BTUS, INTERVALS, ROOMS } from "@/lib/constants";
import type { Unit } from "@/lib/types";
import { addMonthsISO, fmt, uid } from "@/lib/util";
import { PhotoPicker } from "./Photos";
import { Button, Chip, ChipRow, Field, Label, Sheet } from "./ui";

export function UnitForm({ open, customerId, initial, onClose, onSaved }: {
  open: boolean; customerId: string; initial?: Unit; onClose: () => void; onSaved?: (u: Unit) => void;
}) {
  const { saveUnit, deleteUnit, settings } = useStore();
  const [f, setF] = useState<Unit>(() => initial ?? {
    id: uid(), customerId, room: "", brand: "", model: "", btu: null, serialNumber: "", installDate: null, warrantyUntil: null,
    status: "active", intervalMonths: settings.defaultIntervalMonths, lastServiceDate: null, nextDueDate: null,
    lastRemindedAt: null, photos: [], createdAt: new Date().toISOString(),
  });
  const [more, setMore] = useState(!!initial && !!(initial.model || initial.serialNumber || initial.installDate || initial.warrantyUntil));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Unit>(k: K, v: Unit[K]) => setF((x) => ({ ...x, [k]: v }));
  const customBrand = f.brand && !BRANDS.includes(f.brand);

  async function save() {
    if (!f.brand.trim()) return toast.error("Klimanın markasını seç.");
    const u: Unit = {
      ...f,
      brand: f.brand.trim(),
      nextDueDate: f.lastServiceDate && f.intervalMonths ? addMonthsISO(f.lastServiceDate, f.intervalMonths) : f.intervalMonths ? f.nextDueDate : null,
    };
    try {
      await saveUnit(u);
      toast.success(initial ? "Klima güncellendi" : "Klima eklendi");
      onSaved?.(u);
      onClose();
    } catch { /* toast shown by store */ }
  }

  async function remove() {
    if (!initial) return;
    await deleteUnit(initial.id);
    toast.success("Klima silindi");
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={initial ? "Klimayı düzenle" : "Yeni klima"}
      footer={<Button block onClick={save}><Check size={22} />{initial ? "Değişiklikleri kaydet" : "Klimayı kaydet"}</Button>}
    >
      <div className="space-y-7">
        <div>
          <Label>Nerede?</Label>
          <ChipRow>
            {[...new Set([...ROOMS, ...(f.room && !ROOMS.includes(f.room) ? [f.room] : [])])].map((r) => (
              <Chip key={r} on={f.room === r} onClick={() => set("room", f.room === r ? "" : r)}>{r}</Chip>
            ))}
          </ChipRow>
          <Field className="mt-3" value={ROOMS.includes(f.room) ? "" : f.room} onChange={(e) => set("room", e.target.value)} placeholder="Başka bir yer yaz (Oda 3, Teras…)" />
        </div>

        <div>
          <Label>Marka</Label>
          <ChipRow>
            {BRANDS.map((b) => <Chip key={b} on={f.brand === b} onClick={() => set("brand", f.brand === b ? "" : b)}>{b}</Chip>)}
          </ChipRow>
          <Field className="mt-3" value={customBrand ? f.brand : ""} onChange={(e) => set("brand", e.target.value)} placeholder="Listede yoksa yaz" />
        </div>

        <div>
          <Label>BTU</Label>
          <ChipRow>
            {BTUS.map((b) => <Chip key={b} on={f.btu === b} onClick={() => set("btu", f.btu === b ? null : b)}><span className="num">{b.toLocaleString("tr-TR")}</span></Chip>)}
          </ChipRow>
        </div>

        <div>
          <Label hint="Seri no ve model yazmak yerine cihaz etiketinin fotoğrafını çek">Fotoğraf</Label>
          <PhotoPicker value={f.photos} onChange={(v) => set("photos", v)} label="Etiket çek" />
        </div>

        <div>
          <Label hint="Bu tarihe göre müşteriye hatırlatma yapılır">Bakım ne sıklıkla?</Label>
          <ChipRow>
            {INTERVALS.map((i) => <Chip key={i.label} on={f.intervalMonths === i.months} onClick={() => set("intervalMonths", i.months)}>{i.label}</Chip>)}
          </ChipRow>
          {!initial && (
            <div className="mt-4">
              <Field
                label="Son bakım tarihi"
                hint="Biliyorsan gir, bilmiyorsan boş bırak"
                type="date"
                value={f.lastServiceDate ?? ""}
                onChange={(e) => set("lastServiceDate", e.target.value || null)}
              />
              {f.lastServiceDate && f.intervalMonths && (
                <p className="mt-2 text-ink-2">Sonraki bakım: <b className="text-ink">{fmt(addMonthsISO(f.lastServiceDate, f.intervalMonths), "MMMM yyyy")}</b></p>
              )}
            </div>
          )}
        </div>

        <div>
          <button type="button" onClick={() => setMore(!more)} className="press flex h-12 items-center gap-2 font-semibold text-cold">
            <ChevronDown size={22} className={more ? "rotate-180 transition-transform" : "transition-transform"} />
            {more ? "Ek bilgileri gizle" : "Model, seri no, garanti"}
          </button>
          {more && (
            <div className="mt-3 space-y-5 anim-rise">
              <Field label="Model" value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="MSZ-HR50VF" autoCapitalize="characters" />
              <Field label="Seri numarası" value={f.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} autoCapitalize="characters" />
              <Field label="Montaj tarihi" type="date" value={f.installDate ?? ""} onChange={(e) => set("installDate", e.target.value || null)} />
              <Field label="Garanti bitişi" type="date" value={f.warrantyUntil ?? ""} onChange={(e) => set("warrantyUntil", e.target.value || null)} />
              {initial && (
                <div>
                  <Label>Durum</Label>
                  <ChipRow>
                    <Chip on={f.status === "active"} onClick={() => set("status", "active")}>Kullanımda</Chip>
                    <Chip on={f.status === "removed"} onClick={() => set("status", "removed")}>Söküldü</Chip>
                    <Chip on={f.status === "replaced"} onClick={() => set("status", "replaced")}>Değiştirildi</Chip>
                  </ChipRow>
                </div>
              )}
            </div>
          )}
        </div>

        {initial && (
          confirmDelete ? (
            <div className="rounded-3xl bg-hot-tint p-4">
              <p className="font-semibold text-hot">Bu klima ve hatırlatmaları silinsin mi?</p>
              <p className="mt-1 text-ink-2">Geçmiş servis kayıtları müşteride kalır.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Vazgeç</Button>
                <Button className="bg-hot text-white" onClick={remove}>Sil</Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" block onClick={() => setConfirmDelete(true)}><Trash2 size={20} />Klimayı sil</Button>
          )
        )}
      </div>
    </Sheet>
  );
}
