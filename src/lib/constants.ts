import type { Settings, VisitKind } from "./types";

export const MAHALLELER = [
  "Adaköy", "Armutalan", "Bayır", "Beldibi", "Bozburun", "Camiavlu", "Çamdibi", "Çamlı",
  "Çetibeli", "Çıldır", "Gölenye", "Hatipirimi", "Hisarönü", "İçmeler", "Karaca", "Karşıyaka",
  "Kemeraltı", "Orhaniye", "Osmaniye", "Sarıana", "Selimiye", "Sinan", "Siteler", "Söğüt",
  "Taşlıca", "Tepe", "Turgut", "Turunç", "Yeşilbelde", "Yeşilova",
];

export const BRANDS = [
  "Mitsubishi", "Daikin", "Vestel", "Arçelik", "Beko", "LG", "Samsung", "Bosch",
  "Toshiba", "Fujitsu", "Gree", "Baymak", "Airfel", "Sigma",
];

export const BTUS = [9000, 12000, 18000, 24000, 36000];

export const ROOMS = ["Salon", "Yatak odası", "Çocuk odası", "Mutfak", "Dükkan", "Ofis"];

export const KINDS: { id: VisitKind; label: string; hint: string }[] = [
  { id: "bakim", label: "Bakım", hint: "Temizlik, kontrol" },
  { id: "ariza", label: "Arıza", hint: "Çalışmıyor, sorun var" },
  { id: "montaj", label: "Montaj", hint: "Yeni takıldı" },
  { id: "kontrol", label: "Kontrol", hint: "Bakıldı, iş yok" },
];

export const KIND_LABEL: Record<VisitKind, string> = {
  bakim: "Bakım", ariza: "Arıza", montaj: "Montaj", kontrol: "Kontrol",
};

export const INTERVALS: { months: number | null; label: string }[] = [
  { months: 6, label: "6 ay" },
  { months: 12, label: "1 yıl" },
  { months: 24, label: "2 yıl" },
  { months: null, label: "Hatırlatma yok" },
];

export const DEFAULT_SETTINGS: Settings = {
  businessName: "",
  businessPhone: "",
  technicianName: "",
  defaultIntervalMonths: 12,
  remindWindowDays: 30,
  messageTemplate:
    "Merhaba {ad}, klimanızın bakım zamanı geldi ({tarih}). Uygun olduğunuz bir gün yazarsanız randevu verelim. {isletme}",
  tasks: [
    "Filtre temizliği", "İç ünite temizliği", "Dış ünite temizliği", "Gaz basıncı kontrolü",
    "Gaz dolumu", "Drenaj temizliği", "Kumanda kontrolü", "Dezenfeksiyon",
  ],
  parts: ["Kapasitör", "Fan motoru", "Elektronik kart", "Sensör", "R32 gaz", "R410A gaz", "Kumanda", "Drenaj hortumu"],
  faults: [
    { code: "E1", title: "Gaz kaçağı" },
    { code: "F3", title: "Kompresör arızası" },
    { code: "H6", title: "Fan motoru" },
  ],
};
