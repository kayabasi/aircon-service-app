import { addMonths, differenceInCalendarDays, format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { Customer, Settings, Unit } from "./types";

export const uid = () => crypto.randomUUID();

export const todayISO = () => format(new Date(), "yyyy-MM-dd");
export const toISO = (d: Date) => format(d, "yyyy-MM-dd");
export const parse = (iso: string) => parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso);

export const fmt = (iso: string | null | undefined, pattern = "d MMMM yyyy") =>
  iso ? format(parse(iso), pattern, { locale: tr }) : "";

export const addMonthsISO = (iso: string, months: number) => toISO(addMonths(parse(iso), months));

export const daysUntil = (iso: string) => differenceInCalendarDays(parse(iso), new Date());

/** Human phrase for a due date: "12 gün geçti", "Bugün", "5 gün kaldı", "3 ay kaldı" */
export function dueText(iso: string) {
  const d = daysUntil(iso);
  if (d === 0) return "Bugün";
  if (d === 1) return "Yarın";
  if (d < 0) {
    const a = -d;
    return a < 45 ? `${a} gün geçti` : `${Math.round(a / 30)} ay geçti`;
  }
  return d < 45 ? `${d} gün kaldı` : `${Math.round(d / 30)} ay kaldı`;
}

export type DueState = "late" | "soon" | "ok" | "none";
export function dueState(unit: Pick<Unit, "nextDueDate" | "status">, windowDays: number): DueState {
  if (!unit.nextDueDate || unit.status !== "active") return "none";
  const d = daysUntil(unit.nextDueDate);
  if (d < 0) return "late";
  if (d <= windowDays) return "soon";
  return "ok";
}

/** Normalise a Turkish phone number to 90XXXXXXXXXX for wa.me / tel links. */
export function intlPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.startsWith("0")) d = "90" + d.slice(1);
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d;
}

export function prettyPhone(raw: string) {
  const d = intlPhone(raw);
  if (d.length === 12 && d.startsWith("90")) {
    const n = d.slice(2);
    return `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
  }
  return raw;
}

export const telLink = (phone: string) => `tel:+${intlPhone(phone)}`;
export const waLink = (phone: string, text = "") =>
  `https://wa.me/${intlPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export function mapsLink(c: Customer) {
  if (c.lat != null && c.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  if (c.mapLink) return c.mapLink;
  const q = [c.address, c.district, "Marmaris"].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toLocaleUpperCase("tr");
}

export function reminderMessage(s: Settings, c: Customer, unit?: Unit) {
  return s.messageTemplate
    .replaceAll("{ad}", firstName(c.name))
    .replaceAll("{tarih}", unit?.nextDueDate ? fmt(unit.nextDueDate, "d MMMM") : "")
    .replaceAll("{isletme}", s.businessName)
    .replace(/\(\)\s?/g, "")
    .trim();
}

export function unitTitle(u: Unit) {
  const parts = [u.brand || "Klima", u.btu ? `${u.btu.toLocaleString("tr-TR")} BTU` : ""].filter(Boolean);
  return parts.join(" ");
}

/** Accent/diacritic-insensitive search key for Turkish text. */
export function searchKey(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

/** Downscale a photo to keep uploads small (phones produce 4-12MB images). */
export async function compressImage(file: File, max = 1400, quality = 0.78): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}
