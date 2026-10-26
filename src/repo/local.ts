import type { Snapshot } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Repo } from "./repo";
import { seed } from "./seed";

const KEY = "klima-servis:v1";

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Snapshot;
      return { ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings } };
    }
  } catch {
    /* storage blocked or corrupt — fall through to seed */
  }
  return seed();
}

/** Demo mode: everything lives in this browser's localStorage. */
export function createLocalRepo(): Repo {
  let db = read();
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* quota or private mode — keep working in memory */
    }
  };
  const upsert = <T extends { id: string }>(list: T[], item: T) => {
    const i = list.findIndex((x) => x.id === item.id);
    return i === -1 ? [...list, item] : list.map((x) => (x.id === item.id ? item : x));
  };

  return {
    mode: "demo",
    async load() {
      return db;
    },
    async saveCustomer(c) { db = { ...db, customers: upsert(db.customers, c) }; write(); },
    async deleteCustomer(id) {
      db = {
        ...db,
        customers: db.customers.filter((c) => c.id !== id),
        units: db.units.filter((u) => u.customerId !== id),
        visits: db.visits.filter((v) => v.customerId !== id),
      };
      write();
    },
    async saveUnit(u) { db = { ...db, units: upsert(db.units, u) }; write(); },
    async deleteUnit(id) {
      db = { ...db, units: db.units.filter((u) => u.id !== id), visits: db.visits.map((v) => (v.unitId === id ? { ...v, unitId: null } : v)) };
      write();
    },
    async saveVisit(v) { db = { ...db, visits: upsert(db.visits, v) }; write(); },
    async deleteVisit(id) { db = { ...db, visits: db.visits.filter((v) => v.id !== id) }; write(); },
    async saveSettings(s) { db = { ...db, settings: s }; write(); },
    async uploadPhoto(blob) {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(blob);
      });
    },
    async photoUrl(path) { return path; },
  };
}

export function resetDemo() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
