import { useMemo, useState } from "react";
import { BookUser, Check, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { MAHALLELER } from "@/lib/constants";
import type { Customer } from "@/lib/types";
import { searchKey, uid } from "@/lib/util";
import { Button, Chip, ChipRow, Field, Label, Sheet, TextArea } from "./ui";

type ContactsAPI = { select(props: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]> };

export function CustomerForm({ open, initial, onClose, onSaved }: { open: boolean; initial?: Customer; onClose: () => void; onSaved?: (c: Customer) => void }) {
  const { saveCustomer, customers } = useStore();
  const [f, setF] = useState<Customer>(() => initial ?? {
    id: uid(), name: "", phone: "", district: "", address: "", locationNote: "", mapLink: "", lat: null, lng: null, note: "",
    createdAt: new Date().toISOString(),
  });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setF((x) => ({ ...x, [k]: v }));

  // Most-used mahalle first, then filtered by what's typed.
  const mahalleChips = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of customers) count.set(c.district, (count.get(c.district) ?? 0) + 1);
    const key = searchKey(f.district);
    const all = [...new Set([...MAHALLELER, ...count.keys()])].filter(Boolean);
    if (key && !all.some((m) => m === f.district)) return all.filter((m) => searchKey(m).includes(key)).slice(0, 8);
    return all.sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0) || a.localeCompare(b, "tr")).slice(0, 8);
  }, [customers, f.district]);

  const contacts = (navigator as unknown as { contacts?: ContactsAPI }).contacts;
  async function pickContact() {
    try {
      const [c] = await contacts!.select(["name", "tel"], { multiple: false });
      if (c?.name?.[0]) set("name", c.name[0]);
      if (c?.tel?.[0]) set("phone", c.tel[0]);
    } catch { /* cancelled */ }
  }

  function locate() {
    if (!navigator.geolocation) return toast.error("Bu telefonda konum alınamıyor.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({ ...x, lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }));
        setLocating(false);
        toast.success("Konum kaydedildi");
      },
      () => {
        setLocating(false);
        toast.error("Konum alınamadı. Telefonda konum iznini aç ve tekrar dene.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function save() {
    if (!f.name.trim()) return toast.error("Müşterinin adını yaz.");
    setSaving(true);
    const c = { ...f, name: f.name.trim(), phone: f.phone.trim() };
    try {
      await saveCustomer(c);
      toast.success(initial ? "Müşteri güncellendi" : "Müşteri eklendi");
      onSaved?.(c);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={initial ? "Müşteriyi düzenle" : "Yeni müşteri"}
      footer={<Button block onClick={save} disabled={saving}><Check size={22} />{initial ? "Değişiklikleri kaydet" : "Müşteriyi kaydet"}</Button>}
    >
      <div className="space-y-6">
        {contacts && !initial && (
          <Button variant="quiet" block onClick={pickContact}><BookUser size={22} />Rehberden seç</Button>
        )}
        <Field label="Ad soyad" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ahmet Yılmaz" autoComplete="off" autoCapitalize="words" />
        <Field label="Telefon" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0532 000 00 00" type="tel" inputMode="tel" autoComplete="off" />

        <div>
          <Field label="Mahalle" value={f.district} onChange={(e) => set("district", e.target.value)} placeholder="Yaz veya aşağıdan seç" autoComplete="off" />
          <div className="mt-3"><ChipRow>
            {mahalleChips.map((m) => <Chip key={m} on={f.district === m} onClick={() => set("district", f.district === m ? "" : m)}>{m}</Chip>)}
          </ChipRow></div>
        </div>

        <Field label="Adres" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Sokak, bina no, daire" />
        <TextArea label="Nasıl bulunur?" hint="Bir dahaki gelişte kolayca bulmak için" value={f.locationNote} onChange={(e) => set("locationNote", e.target.value)} placeholder="Migros'un arkası, mavi bina, 2. kat" rows={2} />

        <div>
          <Label hint="Müşterinin evindeyken bas, yol tarifi buraya götürür">Haritadaki yeri</Label>
          {f.lat != null ? (
            <div className="flex items-center gap-3 rounded-2xl bg-ok-tint px-4 py-3 text-ok">
              <MapPin size={22} />
              <span className="flex-1 font-semibold">Konum kayıtlı</span>
              <Button size="sm" variant="secondary" onClick={() => setF((x) => ({ ...x, lat: null, lng: null }))}>Sil</Button>
            </div>
          ) : (
            <Button variant="secondary" block onClick={locate} disabled={locating}>
              <LocateFixed size={22} />{locating ? "Konum alınıyor…" : "Şu anki konumu kaydet"}
            </Button>
          )}
        </div>

        <TextArea label="Not" hint="Her ziyarette en üstte görünür" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Gelmeden önce ara, bahçede köpek var" rows={2} />
      </div>
    </Sheet>
  );
}
