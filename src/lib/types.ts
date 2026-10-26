export type VisitKind = "bakim" | "ariza" | "montaj" | "kontrol";
export type VisitStatus = "planned" | "done" | "cancelled";
export type UnitStatus = "active" | "removed" | "replaced";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  district: string;
  address: string;
  locationNote: string;
  mapLink: string;
  lat: number | null;
  lng: number | null;
  note: string;
  createdAt: string;
};

export type Unit = {
  id: string;
  customerId: string;
  room: string;
  brand: string;
  model: string;
  btu: number | null;
  serialNumber: string;
  installDate: string | null;
  warrantyUntil: string | null;
  status: UnitStatus;
  intervalMonths: number | null;
  lastServiceDate: string | null;
  nextDueDate: string | null;
  lastRemindedAt: string | null;
  photos: string[];
  createdAt: string;
};

export type Visit = {
  id: string;
  customerId: string;
  unitId: string | null;
  status: VisitStatus;
  date: string; // yyyy-MM-dd
  time: string | null; // HH:mm
  kind: VisitKind;
  complaint: string;
  tasks: string[];
  faults: string[];
  parts: string[];
  note: string;
  photos: string[];
  technician: string;
  createdAt: string;
};

export type Fault = { code: string; title: string };

export type Settings = {
  businessName: string;
  businessPhone: string;
  technicianName: string;
  defaultIntervalMonths: number;
  remindWindowDays: number;
  messageTemplate: string;
  tasks: string[];
  parts: string[];
  faults: Fault[];
};

export type Snapshot = {
  customers: Customer[];
  units: Unit[];
  visits: Visit[];
  settings: Settings;
};
