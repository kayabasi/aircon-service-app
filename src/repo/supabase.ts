import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Customer, Settings, Unit, Visit } from "@/lib/types";
import { uid } from "@/lib/util";
import type { Repo } from "./repo";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

type Row = Record<string, any>;

const toCustomer = (r: Row): Customer => ({
  id: r.id, name: r.name, phone: r.phone, district: r.district, address: r.address,
  locationNote: r.location_note, mapLink: r.map_link, lat: r.lat, lng: r.lng, note: r.note, createdAt: r.created_at,
});
const fromCustomer = (c: Customer) => ({
  id: c.id, name: c.name, phone: c.phone, district: c.district, address: c.address,
  location_note: c.locationNote, map_link: c.mapLink, lat: c.lat, lng: c.lng, note: c.note,
});

const toUnit = (r: Row): Unit => ({
  id: r.id, customerId: r.customer_id, room: r.room, brand: r.brand, model: r.model, btu: r.btu,
  serialNumber: r.serial_number, installDate: r.install_date, warrantyUntil: r.warranty_until, status: r.status,
  intervalMonths: r.interval_months, lastServiceDate: r.last_service_date, nextDueDate: r.next_due_date,
  lastRemindedAt: r.last_reminded_at, photos: r.photos ?? [], createdAt: r.created_at,
});
const fromUnit = (u: Unit) => ({
  id: u.id, customer_id: u.customerId, room: u.room, brand: u.brand, model: u.model, btu: u.btu,
  serial_number: u.serialNumber, install_date: u.installDate, warranty_until: u.warrantyUntil, status: u.status,
  interval_months: u.intervalMonths, last_service_date: u.lastServiceDate, next_due_date: u.nextDueDate,
  last_reminded_at: u.lastRemindedAt, photos: u.photos,
});

const toVisit = (r: Row): Visit => ({
  id: r.id, customerId: r.customer_id, unitId: r.unit_id, status: r.status, date: r.date, time: r.time, kind: r.kind,
  complaint: r.complaint, tasks: r.tasks ?? [], faults: r.faults ?? [], parts: r.parts ?? [], note: r.note,
  photos: r.photos ?? [], technician: r.technician, createdAt: r.created_at,
});
const fromVisit = (v: Visit) => ({
  id: v.id, customer_id: v.customerId, unit_id: v.unitId, status: v.status, date: v.date, time: v.time, kind: v.kind,
  complaint: v.complaint, tasks: v.tasks, faults: v.faults, parts: v.parts, note: v.note, photos: v.photos, technician: v.technician,
});

const toSettings = (r: Row | null): Settings => r ? {
  businessName: r.business_name, businessPhone: r.business_phone, technicianName: r.technician_name,
  defaultIntervalMonths: r.default_interval_months, remindWindowDays: r.remind_window_days,
  messageTemplate: r.message_template, tasks: r.tasks, parts: r.parts, faults: r.faults,
} : DEFAULT_SETTINGS;

async function ok<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch every row of a table (PostgREST caps a single response at 1000 rows). */
async function all(sb: SupabaseClient, table: string) {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const page = await ok(sb.from(table).select("*").range(from, from + 999));
    out.push(...(page as Row[]));
    if ((page as Row[]).length < 1000) return out;
  }
}

export function createSupabaseRepo(sb: SupabaseClient): Repo {
  const signed = new Map<string, { url: string; at: number }>();
  return {
    mode: "cloud",
    async load() {
      const [customers, units, visits, settings] = await Promise.all([
        all(sb, "customers"), all(sb, "units"), all(sb, "visits"),
        ok(sb.from("settings").select("*").maybeSingle()),
      ]);
      return {
        customers: customers.map(toCustomer),
        units: units.map(toUnit),
        visits: visits.map(toVisit),
        settings: toSettings(settings as Row | null),
      };
    },
    async saveCustomer(c) { await ok(sb.from("customers").upsert(fromCustomer(c))); },
    async deleteCustomer(id) { await ok(sb.from("customers").delete().eq("id", id)); },
    async saveUnit(u) { await ok(sb.from("units").upsert(fromUnit(u))); },
    async deleteUnit(id) { await ok(sb.from("units").delete().eq("id", id)); },
    async saveVisit(v) { await ok(sb.from("visits").upsert(fromVisit(v))); },
    async deleteVisit(id) { await ok(sb.from("visits").delete().eq("id", id)); },
    async saveSettings(s) {
      await ok(sb.from("settings").upsert({
        business_name: s.businessName, business_phone: s.businessPhone, technician_name: s.technicianName,
        default_interval_months: s.defaultIntervalMonths, remind_window_days: s.remindWindowDays,
        message_template: s.messageTemplate, tasks: s.tasks, parts: s.parts, faults: s.faults,
      }));
    },
    async uploadPhoto(blob) {
      const { data } = await sb.auth.getUser();
      const path = `${data.user!.id}/${uid()}.jpg`;
      await ok(sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" }));
      return path;
    },
    async photoUrl(path) {
      const hit = signed.get(path);
      if (hit && Date.now() - hit.at < 50 * 60 * 1000) return hit.url;
      const data = (await ok(sb.storage.from("photos").createSignedUrl(path, 3600)))!;
      signed.set(path, { url: data.signedUrl, at: Date.now() });
      return data.signedUrl;
    },
  };
}
