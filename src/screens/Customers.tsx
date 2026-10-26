import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, UserPlus, X } from "lucide-react";
import { useStore } from "@/store";
import { dueState, searchKey } from "@/lib/util";
import { CustomerRow } from "@/components/Rows";
import { useSheets } from "@/components/Sheets";
import { Button, Chip, Empty } from "@/components/ui";

export default function Customers() {
  const { customers, units, settings } = useStore();
  const { openCustomer } = useSheets();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const filter = params.get("f") ?? "all";
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("ara")) {
      input.current?.focus();
      params.delete("ara");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const unitsBy = useMemo(() => {
    const m = new Map<string, typeof units>();
    for (const u of units) if (u.status === "active") m.set(u.customerId, [...(m.get(u.customerId) ?? []), u]);
    return m;
  }, [units]);

  const districts = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of customers) if (c.district) count.set(c.district, (count.get(c.district) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  }, [customers]);

  const list = useMemo(() => {
    const key = searchKey(q.trim());
    const digits = q.replace(/\D/g, "");
    return customers
      .filter((c) => {
        if (key && !(searchKey(`${c.name} ${c.district} ${c.address}`).includes(key) || (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)))) return false;
        if (filter === "due") return (unitsBy.get(c.id) ?? []).some((u) => ["late", "soon"].includes(dueState(u, settings.remindWindowDays)));
        if (filter !== "all") return c.district === filter;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [customers, q, filter, unitsBy, settings.remindWindowDays]);

  const setFilter = (f: string) => setParams(f === "all" ? {} : { f }, { replace: true });

  return (
    <div>
      <div className="pt-safe sticky top-0 z-20 -mx-4 bg-paper px-4 pb-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <Button size="md" variant="secondary" className="text-cold" onClick={() => openCustomer(undefined, (c) => nav(`/musteri/${c.id}`))}>
            <UserPlus size={20} />Ekle
          </Button>
        </div>
        <label className="relative mt-4 block">
          <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim, telefon veya mahalle"
            inputMode="search"
            enterKeyHint="search"
            className="h-14 w-full rounded-2xl bg-surface pl-12 pr-12 text-base ring-1 ring-inset ring-line outline-none focus:ring-2 focus:ring-cold"
          />
          {q && (
            <button aria-label="Aramayı temizle" onClick={() => setQ("")} className="press absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-2">
              <X size={20} />
            </button>
          )}
        </label>
        <div className="scroll-contain -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip on={filter === "all"} onClick={() => setFilter("all")} className="shrink-0">Hepsi</Chip>
          <Chip on={filter === "due"} onClick={() => setFilter("due")} className="shrink-0">Bakımı gelen</Chip>
          {districts.map((d) => <Chip key={d} on={filter === d} onClick={() => setFilter(d)} className="shrink-0">{d}</Chip>)}
        </div>
      </div>

      <p className="num mb-2 mt-1 px-1 text-ink-2">{list.length} müşteri</p>
      <div className="space-y-2">
        {list.map((c) => <CustomerRow key={c.id} c={c} units={unitsBy.get(c.id) ?? []} />)}
      </div>
      {list.length === 0 && (
        customers.length === 0 ? (
          <Empty title="Henüz müşteri yok." action={<Button onClick={() => openCustomer()}><UserPlus size={22} />İlk müşteriyi ekle</Button>}>
            Müşteri ekleyince klimalarını ve bakım tarihlerini buradan takip edersin.
          </Empty>
        ) : (
          <Empty title="Bu aramaya uyan müşteri yok." action={<Button variant="secondary" onClick={() => { setQ(""); setFilter("all"); }}>Aramayı temizle</Button>} />
        )
      )}
    </div>
  );
}
