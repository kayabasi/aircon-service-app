import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarPlus, ChevronLeft, ClipboardCheck, MapPin, MessageCircle, Navigation, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { mapsLink, prettyPhone, telLink, waLink } from "@/lib/util";
import { PlannedCard, UnitCard, VisitRow } from "@/components/Rows";
import { useSheets } from "@/components/Sheets";
import { Button, Empty, LinkButton, SectionTitle } from "@/components/ui";

export default function CustomerDetail() {
  const { id } = useParams();
  const { customers, units, visits, deleteCustomer } = useStore();
  const { openCustomer, openUnit, openAppointment } = useSheets();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const c = customers.find((x) => x.id === id);

  const cUnits = useMemo(() => units.filter((u) => u.customerId === id).sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active")), [units, id]);
  const planned = visits.filter((v) => v.customerId === id && v.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  const history = visits.filter((v) => v.customerId === id && v.status === "done").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  if (!c) {
    return (
      <div className="pt-10">
        <Empty title="Bu müşteri bulunamadı." action={<Button variant="secondary" onClick={() => nav("/musteriler")}>Müşterilere dön</Button>} />
      </div>
    );
  }

  const map = mapsLink(c);
  const where = [c.address, c.district].filter(Boolean).join(", ");

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between pt-3">
        <button onClick={() => (window.history.length > 1 ? nav(-1) : nav("/musteriler"))} className="press -ml-2 flex h-12 items-center gap-1 rounded-2xl pl-1 pr-3 font-semibold text-cold">
          <ChevronLeft size={26} />Geri
        </button>
        <Button size="md" variant="quiet" onClick={() => openCustomer(c)}><Pencil size={18} />Düzenle</Button>
      </div>

      <h1 className="mt-3 text-2xl font-bold leading-tight">{c.name}</h1>
      {c.phone && <a href={telLink(c.phone)} className="num mt-1 block text-lg text-ink-2">{prettyPhone(c.phone)}</a>}

      <div className="mt-5 grid grid-cols-3 gap-2">
        {c.phone ? <LinkButton href={telLink(c.phone)} size="lg" className="flex-col gap-0.5 !h-[72px] text-sm"><Phone size={24} />Ara</LinkButton> : <Disabled>Telefon yok</Disabled>}
        {c.phone ? <LinkButton href={waLink(c.phone)} newTab variant="wa" size="lg" className="flex-col gap-0.5 !h-[72px] text-sm"><MessageCircle size={24} />WhatsApp</LinkButton> : <Disabled>WhatsApp</Disabled>}
        {map ? <LinkButton href={map} newTab size="lg" className="flex-col gap-0.5 !h-[72px] text-sm"><Navigation size={24} />Yol tarifi</LinkButton> : <Disabled>Adres yok</Disabled>}
      </div>

      {(where || c.locationNote) && (
        <div className="mt-4 flex gap-3 rounded-3xl bg-surface p-4">
          <MapPin size={22} className="mt-0.5 shrink-0 text-ink-2" />
          <div>
            {where && <p>{where}</p>}
            {c.locationNote && <p className="mt-1 text-ink-2">{c.locationNote}</p>}
          </div>
        </div>
      )}
      {c.note && <p className="mt-3 rounded-3xl bg-warm-tint px-4 py-3.5 text-ink">{c.note}</p>}

      {planned.length > 0 && (
        <>
          <SectionTitle count={planned.length}>Randevular</SectionTitle>
          <div className="space-y-3">{planned.map((v) => <PlannedCard key={v.id} v={v} showDate />)}</div>
        </>
      )}

      <SectionTitle
        count={cUnits.length}
        action={<Button size="sm" variant="ghost" onClick={() => openUnit(c.id)}><Plus size={20} />Klima ekle</Button>}
      >
        Klimalar
      </SectionTitle>
      {cUnits.length ? (
        <div className="space-y-3">{cUnits.map((u) => <UnitCard key={u.id} u={u} />)}</div>
      ) : (
        <Empty title="Bu müşteriye klima eklenmemiş." action={<Button variant="secondary" size="md" onClick={() => openUnit(c.id)}><Plus size={20} />Klima ekle</Button>} />
      )}

      <SectionTitle count={history.length}>Servis geçmişi</SectionTitle>
      {history.length ? (
        <div className="space-y-2">{history.map((v) => <VisitRow key={v.id} v={v} />)}</div>
      ) : (
        <Empty title="Henüz servis kaydı yok." />
      )}

      <div className="mt-10">
        {confirm ? (
          <div className="rounded-3xl bg-hot-tint p-4">
            <p className="font-semibold text-hot">{c.name} silinsin mi?</p>
            <p className="mt-1 text-ink-2">Klimaları, randevuları ve tüm servis geçmişi de silinir. Geri alınamaz.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>Vazgeç</Button>
              <Button className="bg-hot text-white" onClick={async () => { await deleteCustomer(c.id); toast.success("Müşteri silindi"); nav("/musteriler", { replace: true }); }}>Sil</Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" block onClick={() => setConfirm(true)}><Trash2 size={20} />Müşteriyi sil</Button>
        )}
      </div>

      {/* Primary actions stay in thumb reach above the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-paper">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_auto] gap-2 px-4 pb-5 pt-3">
          <Link to={`/is?musteri=${c.id}`} className="press flex h-14 items-center justify-center gap-2 rounded-2xl bg-cold text-base font-semibold text-white active:bg-cold-press">
            <ClipboardCheck size={22} />Servis kaydı ekle
          </Link>
          <Button variant="secondary" onClick={() => openAppointment({ customerId: c.id })} aria-label="Randevu ver" className="px-4"><CalendarPlus size={22} />Randevu</Button>
        </div>
      </div>
    </div>
  );
}

function Disabled({ children }: { children: React.ReactNode }) {
  return <span className="grid h-[72px] place-items-center rounded-2xl bg-sunk text-center text-sm text-ink-3">{children}</span>;
}
