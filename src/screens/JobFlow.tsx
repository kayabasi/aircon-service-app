import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, MessageCircle, Plus, X } from "lucide-react";
import { useStore } from "@/store";
import { INTERVALS, KINDS } from "@/lib/constants";
import type { VisitKind } from "@/lib/types";
import { addMonthsISO, firstName, fmt, todayISO, unitTitle, waLink } from "@/lib/util";
import { CustomerPicker } from "@/components/CustomerPicker";
import { PhotoPicker } from "@/components/Photos";
import { useSheets } from "@/components/Sheets";
import { Button, Chip, ChipRow, Field, Label, TextArea, Tile, cx } from "@/components/ui";

type Step = "who" | "unit" | "what" | "next";

export default function JobFlow() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const store = useStore();
  const { customers, units, visits, settings, recordService } = store;
  const { openCustomer, openUnit } = useSheets();

  const planned = visits.find((v) => v.id === params.get("randevu") && v.status === "planned");
  const [customerId, setCustomerId] = useState(params.get("musteri") ?? planned?.customerId ?? "");
  const customer = customers.find((c) => c.id === customerId);
  const cUnits = useMemo(() => units.filter((u) => u.customerId === customerId && u.status === "active"), [units, customerId]);

  const steps: Step[] = params.get("musteri") ? ["unit", "what", "next"] : ["who", "unit", "what", "next"];
  const [step, setStep] = useState<Step>(steps[0]);
  const idx = steps.indexOf(step);

  const [unitIds, setUnitIds] = useState<string[]>(() => {
    if (planned?.unitId) return [planned.unitId];
    const own = units.filter((u) => u.customerId === customerId && u.status === "active");
    return own.length === 1 ? [own[0].id] : planned ? own.map((u) => u.id) : [];
  });
  const [kind, setKind] = useState<VisitKind>(planned?.kind ?? "bakim");
  const [date, setDate] = useState(todayISO());
  const [complaint, setComplaint] = useState(planned?.complaint ?? "");
  const [tasks, setTasks] = useState<string[]>([]);
  const [faults, setFaults] = useState<string[]>([]);
  const [parts, setParts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const firstUnit = units.find((u) => u.id === unitIds[0]);
  const [interval, setIntervalMonths] = useState<number | null | undefined>(undefined);
  const effectiveInterval = interval === undefined ? (firstUnit?.intervalMonths ?? settings.defaultIntervalMonths) : interval;
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const go = (d: 1 | -1) => {
    const n = steps[idx + d];
    if (n) { setStep(n); window.scrollTo(0, 0); } else if (d === -1) nav(-1);
  };

  function pickCustomer(id: string) {
    setCustomerId(id);
    const own = units.filter((u) => u.customerId === id && u.status === "active");
    setUnitIds(own.length === 1 ? [own[0].id] : []);
    setIntervalMonths(undefined);
    setStep("unit");
    window.scrollTo(0, 0);
  }

  async function save() {
    setSaving(true);
    try {
      await recordService({
        customerId, unitIds, date, kind, complaint: complaint.trim(), tasks, faults, parts, note: note.trim(), photos,
        intervalMonths: effectiveInterval, plannedVisitId: planned?.id,
      });
      setDone(true);
    } catch {
      setSaving(false);
    }
  }

  const nextDate = effectiveInterval ? addMonthsISO(date, effectiveInterval) : null;

  if (done && customer) {
    const msg = `Merhaba ${firstName(customer.name)}, klimanızın ${kindWord(kind)} ${fmt(date, "d MMMM")} tarihinde yapıldı.${nextDate ? ` Bir sonraki bakım zamanı ${fmt(nextDate, "MMMM yyyy")}; zamanı gelince size haber vereceğiz.` : ""} ${settings.businessName}`.trim();
    return (
      <div className="pt-safe mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="anim-stamp rounded-[28px] border-[3px] border-ok px-8 py-6 text-ok">
            <Check size={52} strokeWidth={3} className="mx-auto" />
            <p className="mt-2 text-2xl font-bold">Kaydedildi</p>
          </div>
          <div className="anim-rise mt-8" style={{ animationDelay: "180ms" }}>
            <p className="text-lg font-semibold">{customer.name}</p>
            {nextDate ? (
              <p className="mt-1 text-lg text-ink-2">Sonraki bakım <b className="text-ink">{fmt(nextDate, "MMMM yyyy")}</b>. Zamanı gelince Bugün ekranında hatırlatılacak.</p>
            ) : (
              <p className="mt-1 text-lg text-ink-2">Bu klima için bakım hatırlatması kapalı.</p>
            )}
          </div>
        </div>
        <div className="anim-rise space-y-2" style={{ animationDelay: "260ms" }}>
          {customer.phone && (
            <a href={waLink(customer.phone, msg)} target="_blank" rel="noreferrer" className="press flex h-14 items-center justify-center gap-2 rounded-2xl bg-wa text-base font-semibold text-white active:bg-wa-press">
              <MessageCircle size={22} />Müşteriye WhatsApp'tan bildir
            </a>
          )}
          <Button variant="secondary" block onClick={() => nav(`/musteri/${customer.id}`, { replace: true })}>Müşteriye git</Button>
          <Button variant="ghost" block onClick={() => nav("/", { replace: true })}>Ana ekrana dön</Button>
        </div>
      </div>
    );
  }

  const canNext =
    step === "who" ? !!customer :
    step === "unit" ? true :
    step === "what" ? true : !saving;

  const titles: Record<Step, string> = {
    who: "Kimin işi?",
    unit: "Hangi klima?",
    what: "Ne yapıldı?",
    next: "Sonraki bakım",
  };

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="pt-safe sticky top-0 z-20 bg-paper px-4">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => go(-1)} className="press -ml-2 flex h-12 items-center gap-1 rounded-2xl px-2 font-semibold text-cold">
            <ArrowLeft size={24} />{idx === 0 ? "Vazgeç" : "Geri"}
          </button>
          <span className="num text-ink-2">Adım {idx + 1} / {steps.length}</span>
          <button onClick={() => nav(-1)} aria-label="Kapat" className="press grid size-12 place-items-center rounded-full bg-sunk"><X size={22} /></button>
        </div>
        <div className="flex gap-1.5 pb-3">
          {steps.map((s, i) => <span key={s} className={cx("h-1.5 flex-1 rounded-full transition-colors", i <= idx ? "bg-cold" : "bg-line")} />)}
        </div>
      </header>

      <div className="px-4 pb-40 pt-3">
        <h1 className="text-2xl font-bold">{titles[step]}</h1>
        {customer && step !== "who" && <p className="mt-1 text-lg text-ink-2">{customer.name}{customer.district ? `, ${customer.district}` : ""}</p>}

        <div key={step} className="anim-rise mt-6">
          {step === "who" && (
            <CustomerPicker selected={customerId} onPick={pickCustomer} onNew={() => openCustomer(undefined, (c) => pickCustomer(c.id))} />
          )}

          {step === "unit" && (
            <div className="space-y-2">
              {cUnits.length > 1 && (
                <Button variant="ghost" size="md" onClick={() => setUnitIds(unitIds.length === cUnits.length ? [] : cUnits.map((u) => u.id))}>
                  {unitIds.length === cUnits.length ? "Seçimi kaldır" : "Hepsini seç"}
                </Button>
              )}
              {cUnits.map((u) => (
                <Tile
                  key={u.id}
                  on={unitIds.includes(u.id)}
                  onClick={() => toggle(unitIds, setUnitIds, u.id)}
                  title={u.room || unitTitle(u)}
                  sub={u.room ? unitTitle(u) : u.model}
                />
              ))}
              <Button
                variant="secondary"
                block
                className="text-cold"
                onClick={() => openUnit(customerId, undefined, (u) => setUnitIds((x) => [...x, u.id]))}
              >
                <Plus size={22} />Yeni klima ekle
              </Button>
              {cUnits.length === 0 && <p className="px-1 pt-2 text-ink-2">Klima eklersen bakım zamanı gelince hatırlatılır. İstersen klima seçmeden de devam edebilirsin.</p>}
            </div>
          )}

          {step === "what" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setKind(k.id)}
                    aria-pressed={kind === k.id}
                    className={cx(
                      "press rounded-2xl px-4 py-4 text-left",
                      kind === k.id ? "bg-ink text-white" : "bg-surface ring-1 ring-inset ring-line active:bg-sunk",
                    )}
                  >
                    <span className="block text-lg font-bold">{k.label}</span>
                    <span className={cx("block text-sm", kind === k.id ? "text-white/75" : "text-ink-2")}>{k.hint}</span>
                  </button>
                ))}
              </div>

              {(kind === "ariza" || complaint) && (
                <TextArea label="Şikayet" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Müşteri ne dedi?" rows={2} />
              )}

              <div>
                <Label hint="Birden fazla seçebilirsin">Yapılanlar</Label>
                <ChipRow>{settings.tasks.map((t) => <Chip key={t} on={tasks.includes(t)} onClick={() => toggle(tasks, setTasks, t)}>{t}</Chip>)}</ChipRow>
              </div>

              {(kind === "ariza" || faults.length > 0) && settings.faults.length > 0 && (
                <div>
                  <Label>Arıza kodu</Label>
                  <ChipRow>
                    {settings.faults.map((f) => (
                      <Chip key={f.code} on={faults.includes(f.code)} onClick={() => toggle(faults, setFaults, f.code)}>
                        <b>{f.code}</b> {f.title}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
              )}

              <div>
                <Label>Değişen parça</Label>
                <ChipRow>{settings.parts.map((p) => <Chip key={p} on={parts.includes(p)} onClick={() => toggle(parts, setParts, p)}>{p}</Chip>)}</ChipRow>
              </div>

              <TextArea label="Not" hint="Klavyedeki mikrofona basıp konuşarak da yazabilirsin" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ek bilgi" rows={3} />

              <div>
                <Label>Fotoğraf</Label>
                <PhotoPicker value={photos} onChange={setPhotos} />
              </div>

              <div>
                <Label>Tarih</Label>
                <ChipRow>
                  <Chip on={date === todayISO()} onClick={() => setDate(todayISO())}>Bugün</Chip>
                </ChipRow>
                <Field className="mt-3" type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Başka bir tarih" />
              </div>
            </div>
          )}

          {step === "next" && (
            <div className="space-y-8">
              {unitIds.length === 0 ? (
                <p className="rounded-3xl bg-sunk px-5 py-4 text-ink-2">Klima seçilmediği için bakım hatırlatması kurulmayacak. Hatırlatma için geri dönüp klima seçebilir ya da ekleyebilirsin.</p>
              ) : (
                <div>
                  <Label hint="Bu süre dolmadan önce müşteri Bugün ekranında çıkar">Bir sonraki bakım ne zaman?</Label>
                  <ChipRow>
                    {INTERVALS.map((i) => <Chip key={i.label} on={effectiveInterval === i.months} onClick={() => setIntervalMonths(i.months)}>{i.label}</Chip>)}
                  </ChipRow>
                  <div className="mt-5 rounded-3xl bg-surface p-5">
                    {nextDate ? (
                      <>
                        <p className="text-ink-2">Hatırlatma tarihi</p>
                        <p className="text-2xl font-bold first-letter:uppercase">{fmt(nextDate, "MMMM yyyy")}</p>
                      </>
                    ) : (
                      <p className="text-lg text-ink-2">Bu klima için hatırlatma yapılmayacak.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-surface p-5">
                <p className="text-lg font-bold">Özet</p>
                <dl className="mt-3 space-y-2">
                  <Summary k="Müşteri" v={customer?.name} />
                  <Summary k="Klima" v={unitIds.map((id) => { const u = units.find((x) => x.id === id); return u ? (u.room || unitTitle(u)) : ""; }).join(", ") || "Seçilmedi"} />
                  <Summary k="İş" v={KINDS.find((k) => k.id === kind)?.label} />
                  {tasks.length > 0 && <Summary k="Yapılanlar" v={tasks.join(", ")} />}
                  {parts.length > 0 && <Summary k="Parça" v={parts.join(", ")} />}
                  {faults.length > 0 && <Summary k="Arıza kodu" v={faults.join(", ")} />}
                  {photos.length > 0 && <Summary k="Fotoğraf" v={`${photos.length} adet`} />}
                  <Summary k="Tarih" v={fmt(date)} />
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      {step !== "who" && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper">
          <div className="mx-auto max-w-lg px-4 py-3">
            {step === "next" ? (
              <Button block onClick={save} disabled={!canNext}><Check size={24} />{saving ? "Kaydediliyor…" : "Kaydet"}</Button>
            ) : (
              <Button block onClick={() => go(1)} disabled={!canNext}>
                {step === "unit" && unitIds.length === 0 ? "Klima seçmeden devam et" : "Devam"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-ink-2">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function kindWord(k: VisitKind) {
  return k === "bakim" ? "bakımı" : k === "ariza" ? "arıza onarımı" : k === "montaj" ? "montajı" : "kontrolü";
}
