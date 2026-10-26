import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useDueList, useStore } from "@/store";
import { daysUntil, fmt, todayISO } from "@/lib/util";
import { DueCard, PlannedCard } from "@/components/Rows";
import { useSheets } from "@/components/Sheets";
import { Button, Empty, SectionTitle } from "@/components/ui";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
}

export default function Today() {
  const { visits, settings, repo } = useStore();
  const due = useDueList();
  const nav = useNavigate();
  const { openAppointment } = useSheets();
  const [showAll, setShowAll] = useState(false);
  const today = todayISO();

  const { now, soon } = useMemo(() => {
    const planned = visits.filter((v) => v.status === "planned").sort((a, b) => (a.date + (a.time ?? "99")).localeCompare(b.date + (b.time ?? "99")));
    return {
      now: planned.filter((v) => v.date <= today),
      soon: planned.filter((v) => v.date > today && daysUntil(v.date) <= 7),
    };
  }, [visits, today]);

  const name = settings.technicianName;

  return (
    <div className="pt-6">
      {repo.mode === "demo" && (
        <p className="mb-4 rounded-2xl bg-cold-tint px-4 py-3 text-ink">Deneme modu: bilgiler sadece bu telefonda saklanıyor.</p>
      )}
      <h1 className="text-2xl font-bold leading-tight">{greeting()}{name ? `, ${name}` : ""}</h1>
      <p className="mt-1 text-lg text-ink-2 first-letter:uppercase">{fmt(today, "d MMMM EEEE")}</p>

      <button
        onClick={() => nav("/musteriler?ara=1")}
        className="press mt-5 flex h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 text-left text-ink-3 ring-1 ring-inset ring-line"
      >
        <Search size={22} />Müşteri ara
      </button>

      <SectionTitle count={now.length}>Bugünkü işler</SectionTitle>
      {now.length ? (
        <div className="space-y-3">{now.map((v) => <PlannedCard key={v.id} v={v} />)}</div>
      ) : (
        <Empty title="Bugün için randevu yok." action={<Button variant="secondary" size="md" onClick={() => openAppointment({ date: today })}>Randevu ver</Button>}>
          Aşağıdaki bakımı gelen müşterilere hatırlatma gönderebilirsin.
        </Empty>
      )}

      <SectionTitle count={due.length}>Bakımı gelenler</SectionTitle>
      {due.length ? (
        <>
          <div className="space-y-3">
            {(showAll ? due : due.slice(0, 5)).map((d) => <DueCard key={d.customer.id} c={d.customer} units={d.units} due={d.due} />)}
          </div>
          {due.length > 5 && !showAll && (
            <Button variant="ghost" block className="mt-2" onClick={() => setShowAll(true)}>Hepsini göster ({due.length})</Button>
          )}
        </>
      ) : (
        <Empty title="Şu an bakımı gelen müşteri yok.">Bakım tarihi {settings.remindWindowDays} gün içinde olan müşteriler burada çıkar.</Empty>
      )}

      {soon.length > 0 && (
        <>
          <SectionTitle count={soon.length}>Bu hafta</SectionTitle>
          <div className="space-y-3">{soon.map((v) => <PlannedCard key={v.id} v={v} showDate />)}</div>
        </>
      )}
    </div>
  );
}
