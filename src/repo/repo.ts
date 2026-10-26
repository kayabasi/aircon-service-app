import type { Customer, Settings, Snapshot, Unit, Visit } from "@/lib/types";

export interface Repo {
  mode: "demo" | "cloud";
  load(): Promise<Snapshot>;
  saveCustomer(c: Customer): Promise<void>;
  deleteCustomer(id: string): Promise<void>;
  saveUnit(u: Unit): Promise<void>;
  deleteUnit(id: string): Promise<void>;
  saveVisit(v: Visit): Promise<void>;
  deleteVisit(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  uploadPhoto(blob: Blob): Promise<string>;
  photoUrl(path: string): Promise<string>;
}
