import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, LogOut, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { INTERVALS } from "@/lib/constants";
import type { Customer, Settings as S } from "@/lib/types";
import { addMonthsISO, reminderMessage, todayISO } from "@/lib/util";
import { resetDemo } from "@/repo/local";
import { supabase } from "@/repo/supabase";
import { Button, Chip, ChipRow, Field, Label, TextArea } from "@/components/ui";

export default function Settings() {
  const store = useStore();
  const [s, setS] = useState<S>(store.settings);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const first = useRef(true);

  // Autosave shortly after the last change — nothing to forget to press.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved("saving");
    const t = setTimeout(async () => {
      try { await store.saveSettings(s); setSaved("saved"); } catch { setSaved("idle"); }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const set = <K extends keyof S>(k: K, v: S[K]) => setS((x) => ({ ...x, [k]: v }));
  const sample: Customer = { id: "", name: "Ahmet Yılmaz", phone: "", district: "", address: "", locationNote: "", mapLink: "", lat: null, lng: null, note: "", createdAt: "" };
  const preview = reminderMessage(s, sample, { nextDueDate: addMonthsISO(todayISO(), 0) } as never);

  function exportBackup() {
    const data = JSON.stringify({ exportedAt: new Date().toISOString(), customers: store.customers, units: store.units, visits: store.visits, settings: store.settings }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = `klima-servis-yedek-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <span className="text-sm text-ink-2" aria-live="polite">{saved === "saving" ? "Kaydediliyor…" : saved === "saved" ? "Kaydedildi" : ""}</span>
      </div>

      <Group title="İşletme">
        <Field label="İşletme adı" hint="Müşteriye giden mesajların sonunda yazar" value={s.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Atilla Klima" />
        <Field label="İşletme telefonu" type="tel" inputMode="tel" value={s.businessPhone} onChange={(e) => set("businessPhone", e.target.value)} />
        <Field label="Senin adın" hint="Servis kayıtlarında ve karşılamada görünür" value={s.technicianName} onChange={(e) => set("technicianName", e.target.value)} />
      </Group>

      <Group title="Bakım hatırlatması">
        <div>
          <Label hint="Yeni klimalar için seçili gelir">Varsayılan bakım aralığı</Label>
          <ChipRow>
            {INTERVALS.filter((i) => i.months).map((i) => <Chip key={i.label} on={s.defaultIntervalMonths === i.months} onClick={() => set("defaultIntervalMonths", i.months!)}>{i.label}</Chip>)}
          </ChipRow>
        </div>
        <div>
          <Label hint="Bakım tarihine bu kadar gün kala müşteri Bugün ekranında çıkar">Ne kadar önce hatırlatılsın?</Label>
          <ChipRow>
            {[7, 15, 30, 45, 60].map((d) => <Chip key={d} on={s.remindWindowDays === d} onClick={() => set("remindWindowDays", d)}>{d} gün</Chip>)}
          </ChipRow>
        </div>
        <div>
          <TextArea label="Hatırlatma mesajı" value={s.messageTemplate} onChange={(e) => set("messageTemplate", e.target.value)} rows={4} />
          <p className="mt-2 text-sm text-ink-2">Mesaja otomatik eklemek için dokun:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["{ad}", "Müşteri adı"], ["{tarih}", "Bakım tarihi"], ["{isletme}", "İşletme adı"]].map(([tok, label]) => (
              <Button key={tok} size="sm" variant="quiet" onClick={() => set("messageTemplate", `${s.messageTemplate.trimEnd()} ${tok}`)}><Plus size={16} />{label}</Button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-ok-tint px-4 py-3">
            <p className="text-sm font-semibold text-ok">Müşteri böyle görecek</p>
            <p className="mt-1">{preview}</p>
          </div>
        </div>
      </Group>

      <Group title="Hızlı seçim listeleri" hint="Servis kaydederken dokunarak seçtiğin maddeler">
        <ListEditor label="Yapılanlar" items={s.tasks} onChange={(v) => set("tasks", v)} placeholder="Örn. Kondenser temizliği" />
        <ListEditor label="Parçalar" items={s.parts} onChange={(v) => set("parts", v)} placeholder="Örn. Kompresör" />
        <FaultEditor items={s.faults} onChange={(v) => set("faults", v)} />
      </Group>

      <Group title="Veriler">
        <Button variant="secondary" block onClick={exportBackup}><Download size={22} />Yedeği indir</Button>
        {store.repo.mode === "demo" ? (
          <Button variant="danger" block onClick={() => { resetDemo(); location.reload(); }}><RotateCcw size={20} />Deneme verilerini sıfırla</Button>
        ) : (
          <Button variant="secondary" block onClick={async () => { await supabase?.auth.signOut(); toast.success("Çıkış yapıldı"); }}><LogOut size={20} />Çıkış yap</Button>
        )}
      </Group>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="text-ink-2">{hint}</p>}
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (t && !items.includes(t)) onChange([...items, t]);
    setV("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <ChipRow>
        {items.map((it) => (
          <span key={it} className="inline-flex min-h-12 items-center gap-1 rounded-full bg-surface pl-4 pr-1 ring-1 ring-inset ring-line">
            {it}
            <button aria-label={`${it} sil`} onClick={() => onChange(items.filter((x) => x !== it))} className="press grid size-10 place-items-center rounded-full text-ink-2"><X size={18} /></button>
          </span>
        ))}
      </ChipRow>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Field value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} enterKeyHint="done" />
        <Button type="submit" variant="secondary" className="shrink-0" aria-label="Ekle"><Plus size={22} /></Button>
      </form>
    </div>
  );
}

function FaultEditor({ items, onChange }: { items: S["faults"]; onChange: (v: S["faults"]) => void }) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  return (
    <div>
      <Label>Arıza kodları</Label>
      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.code} className="flex items-center gap-3 rounded-2xl bg-surface py-1 pl-4 pr-1 ring-1 ring-inset ring-line">
            <b className="w-12">{f.code}</b>
            <span className="flex-1">{f.title}</span>
            <button aria-label={`${f.code} sil`} onClick={() => onChange(items.filter((x) => x.code !== f.code))} className="press grid size-11 place-items-center rounded-full text-ink-2"><X size={18} /></button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 grid grid-cols-[5.5rem_1fr_auto] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toLocaleUpperCase("tr");
          if (!c || items.some((x) => x.code === c)) return;
          onChange([...items, { code: c, title: title.trim() }]);
          setCode(""); setTitle("");
        }}
      >
        <Field value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kod" autoCapitalize="characters" />
        <Field value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ne demek?" />
        <Button type="submit" variant="secondary" aria-label="Ekle"><Plus size={22} /></Button>
      </form>
    </div>
  );
}
