import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useStore } from "@/store";
import { searchKey } from "@/lib/util";
import { Avatar, Button, Tile } from "./ui";

/** Search-as-you-type customer list. Most recently served customers first when the box is empty. */
export function CustomerPicker({ selected, onPick, onNew }: { selected?: string; onPick: (id: string) => void; onNew: () => void }) {
  const { customers, visits } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const last = new Map<string, string>();
    for (const v of visits) if (!last.get(v.customerId) || v.date > last.get(v.customerId)!) last.set(v.customerId, v.date);
    const key = searchKey(q);
    const digits = q.replace(/\D/g, "");
    return customers
      .filter((c) => !key || searchKey(`${c.name} ${c.district}`).includes(key) || (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)))
      .sort((a, b) => (key ? a.name.localeCompare(b.name, "tr") : (last.get(b.id) ?? "").localeCompare(last.get(a.id) ?? "")))
      .slice(0, 40);
  }, [customers, visits, q]);

  return (
    <div>
      <label className="relative block">
        <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İsim, telefon veya mahalle"
          className="h-14 w-full rounded-2xl bg-surface pl-12 pr-4 text-base ring-1 ring-inset ring-line outline-none focus:ring-2 focus:ring-cold"
          inputMode="search"
          enterKeyHint="search"
        />
      </label>
      <Button variant="secondary" block className="mt-3 text-cold" onClick={onNew}>
        <UserPlus size={22} /> Yeni müşteri ekle
      </Button>
      <div className="mt-4 space-y-2">
        {list.map((c) => (
          <Tile
            key={c.id}
            on={selected === c.id}
            onClick={() => onPick(c.id)}
            title={<span className="flex items-center gap-3"><Avatar name={c.name} />{c.name}</span>}
            sub={undefined}
            right={<span className="shrink-0 text-sm text-ink-2">{c.district}</span>}
          />
        ))}
        {list.length === 0 && <p className="px-1 py-4 text-ink-2">“{q}” ile kayıtlı müşteri yok. Yukarıdan yeni müşteri ekleyebilirsin.</p>}
      </div>
    </div>
  );
}
