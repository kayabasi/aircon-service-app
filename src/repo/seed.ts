import { addDays, subDays } from "date-fns";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Customer, Snapshot, Unit, Visit } from "@/lib/types";
import { addMonthsISO, toISO } from "@/lib/util";

/** Demo data. Dates are relative to today so the demo always has something due. */
export function seed(): Snapshot {
  const now = new Date();
  const d = (days: number) => toISO(addDays(now, days));
  const ago = (months: number) => toISO(subDays(now, Math.round(months * 30.44)));
  const created = now.toISOString();

  const c = (id: string, name: string, phone: string, district: string, address: string, extra: Partial<Customer> = {}): Customer => ({
    id, name, phone, district, address, locationNote: "", mapLink: "", lat: null, lng: null, note: "", createdAt: created, ...extra,
  });

  const customers: Customer[] = [
    c("c1", "Ahmet Yılmaz", "0532 442 18 62", "Armutalan", "Atatürk Caddesi No: 24", {
      locationNote: "Migros'un arkasındaki mavi bina, 2. kat.",
      note: "Gelmeden önce mutlaka ara. Bahçede köpek var.",
    }),
    c("c2", "Zeynep Kaya", "0536 221 44 09", "İçmeler", "İnönü Sokak No: 8", { locationNote: "Site girişinden sonra sağdaki blok." }),
    c("c3", "Mehmet Özkan", "0542 880 31 77", "Siteler", "Sahil Yolu Caddesi No: 102"),
    c("c4", "Selin Demir", "0533 102 90 43", "Çıldır", "145. Sokak No: 3"),
    c("c5", "Hasan Çelik", "0544 610 22 18", "Orhaniye", "Köy içi, cami karşısı", { note: "Pansiyon. Yazın 4 oda dolu, sabah 10'dan önce gelme." }),
    c("c6", "Ayşe Arslan", "0535 377 51 90", "Turunç", "Plaj yolu No: 41"),
    c("c7", "Murat Şahin", "0507 918 64 25", "Kemeraltı", "Ulusal Egemenlik Bulvarı No: 15", { locationNote: "Dükkan. Arka kapıdan gir." }),
    c("c8", "Elif Aydın", "0538 249 07 66", "Beldibi", "Kenan Evren Bulvarı No: 77, D: 6"),
  ];

  const u = (id: string, customerId: string, brand: string, btu: number, lastMonthsAgo: number | null, extra: Partial<Unit> = {}): Unit => {
    const last = lastMonthsAgo == null ? null : ago(lastMonthsAgo);
    const interval = extra.intervalMonths === undefined ? 12 : extra.intervalMonths;
    return {
      id, customerId, room: "", brand, model: "", btu, serialNumber: "", installDate: null, warrantyUntil: null,
      status: "active", intervalMonths: interval, lastServiceDate: last,
      nextDueDate: last && interval ? addMonthsISO(last, interval) : null,
      lastRemindedAt: null, photos: [], createdAt: created, ...extra,
    };
  };

  const units: Unit[] = [
    u("u1", "c1", "Mitsubishi", 18000, 12.4, { room: "Salon", model: "MSZ-HR50VF", serialNumber: "MSZ20210582", installDate: "2021-06-12", warrantyUntil: "2024-06-12" }),
    u("u2", "c1", "Mitsubishi", 9000, 12.4, { room: "Yatak odası" }),
    u("u3", "c2", "Daikin", 12000, 11.4, { room: "Salon", model: "FTXF35E" }),
    u("u4", "c3", "Vestel", 24000, 13, { room: "Salon", model: "Nova Plus" }),
    u("u5", "c4", "LG", 12000, 4, { room: "Salon", model: "DualCool" }),
    u("u6", "c5", "Arçelik", 12000, 5.5, { room: "Oda 1", intervalMonths: 6 }),
    u("u7", "c5", "Arçelik", 12000, 5.5, { room: "Oda 2", intervalMonths: 6 }),
    u("u8", "c6", "Samsung", 18000, 2, { room: "Salon" }),
    u("u9", "c7", "Daikin", 24000, 9, { room: "Dükkan" }),
    u("u10", "c8", "Gree", 12000, null, { room: "Yatak odası", intervalMonths: 12 }),
  ];

  const v = (id: string, customerId: string, unitId: string | null, date: string, extra: Partial<Visit> = {}): Visit => ({
    id, customerId, unitId, status: "done", date, time: null, kind: "bakim", complaint: "", tasks: [], faults: [], parts: [],
    note: "", photos: [], technician: "", createdAt: created, ...extra,
  });

  const visits: Visit[] = [
    v("v1", "c1", "u1", units[0].lastServiceDate!, { tasks: ["Filtre temizliği", "İç ünite temizliği", "Gaz basıncı kontrolü"], note: "Filtreler çok tozluydu." }),
    v("v2", "c1", "u2", units[1].lastServiceDate!, { tasks: ["Filtre temizliği", "İç ünite temizliği"] }),
    v("v3", "c2", "u3", units[2].lastServiceDate!, { tasks: ["Filtre temizliği", "Dış ünite temizliği"] }),
    v("v4", "c3", "u4", units[3].lastServiceDate!, { kind: "ariza", complaint: "Soğutmuyor", faults: ["E1"], parts: ["R32 gaz"], tasks: ["Gaz dolumu"], note: "Kaçak bulunup kaynak yapıldı." }),
    v("v5", "c4", "u5", units[4].lastServiceDate!, { tasks: ["Filtre temizliği", "Dezenfeksiyon"] }),
    v("v6", "c5", "u6", units[5].lastServiceDate!, { tasks: ["Filtre temizliği"] }),
    v("v7", "c6", "u8", units[7].lastServiceDate!, { kind: "ariza", complaint: "Su damlatıyor", tasks: ["Drenaj temizliği"] }),
    v("v8", "c7", "u9", units[8].lastServiceDate!, { tasks: ["Filtre temizliği", "Dış ünite temizliği"] }),
    // planned
    v("p1", "c2", "u3", d(0), { status: "planned", time: "10:00", complaint: "Yıllık bakım" }),
    v("p2", "c7", "u9", d(0), { status: "planned", time: "14:30", kind: "ariza", complaint: "Kumanda çalışmıyor" }),
    v("p3", "c8", null, d(2), { status: "planned", time: "11:00", kind: "montaj", complaint: "Yatak odasına 12.000 BTU montaj" }),
    v("p4", "c5", "u6", d(5), { status: "planned", time: null, complaint: "6 aylık bakım, iki oda" }),
  ];

  return {
    customers,
    units,
    visits,
    settings: { ...DEFAULT_SETTINGS, businessName: "Atilla Klima", businessPhone: "0532 000 00 00", technicianName: "Atilla" },
  };
}
