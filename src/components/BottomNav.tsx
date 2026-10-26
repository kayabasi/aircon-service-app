import { NavLink } from "react-router-dom";
import { CalendarDays, House, Plus, Settings, Users } from "lucide-react";
import { useSheets } from "./Sheets";
import { cx } from "./ui";

const items = [
  { to: "/", label: "Bugün", icon: House, end: true },
  { to: "/musteriler", label: "Müşteriler", icon: Users },
  null,
  { to: "/takvim", label: "Takvim", icon: CalendarDays },
  { to: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

export default function BottomNav() {
  const { openNew } = useSheets();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface">
      <ul className="mx-auto grid h-[72px] max-w-lg grid-cols-5 items-center px-1">
        {items.map((it) =>
          it === null ? (
            <li key="new" className="flex justify-center">
              <button
                onClick={openNew}
                aria-label="Yeni"
                className="press -mt-7 grid size-[68px] place-items-center rounded-full bg-cold text-white ring-[6px] ring-paper active:bg-cold-press"
              >
                <Plus size={34} strokeWidth={2.5} />
              </button>
            </li>
          ) : (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={"end" in it ? it.end : false}
                className={({ isActive }) =>
                  cx("press flex h-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-[13px] font-semibold", isActive ? "text-cold" : "text-ink-3")
                }
              >
                {({ isActive }) => (
                  <>
                    <it.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                    {it.label}
                  </>
                )}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
