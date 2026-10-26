import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { compressImage } from "@/lib/util";

export function Photo({ path, className, onClick }: { path: string; className?: string; onClick?: () => void }) {
  const { repo } = useStore();
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let live = true;
    repo.photoUrl(path).then((u) => live && setSrc(u)).catch(() => {});
    return () => { live = false; };
  }, [path, repo]);
  return (
    <button type="button" onClick={onClick} className={`press overflow-hidden rounded-2xl bg-sunk ${className ?? ""}`}>
      {src && <img src={src} alt="" className="size-full object-cover" loading="lazy" />}
    </button>
  );
}

/** Thumbnails + an "add photo" tile. Lets the phone choose camera or gallery. */
export function PhotoPicker({ value, onChange, label = "Fotoğraf ekle" }: { value: string[]; onChange: (v: string[]) => void; label?: string }) {
  const { repo } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [viewing, setViewing] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    setBusy((b) => b + list.length);
    const paths: string[] = [];
    for (const f of list) {
      try {
        const blob = await compressImage(f, repo.mode === "demo" ? 900 : 1400);
        paths.push(await repo.uploadPhoto(blob));
      } catch {
        toast.error("Fotoğraf yüklenemedi. Tekrar dene.");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    onChange([...value, ...paths]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((p) => (
        <div key={p} className="relative">
          <Photo path={p} className="size-24" onClick={() => setViewing(p)} />
          <button
            type="button"
            aria-label="Fotoğrafı kaldır"
            onClick={() => onChange(value.filter((x) => x !== p))}
            className="press absolute -right-1.5 -top-1.5 grid size-8 place-items-center rounded-full bg-ink text-white"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      ))}
      {Array.from({ length: busy }, (_, i) => (
        <div key={`b${i}`} className="grid size-24 place-items-center rounded-2xl bg-sunk text-sm text-ink-3">Yükleniyor</div>
      ))}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="press flex size-24 flex-col items-center justify-center gap-1 rounded-2xl bg-surface text-sm font-semibold text-cold ring-1 ring-inset ring-line"
      >
        <Camera size={26} />
        {label}
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      {viewing && <Lightbox path={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

export function Lightbox({ path, onClose }: { path: string; onClose: () => void }) {
  const { repo } = useStore();
  const [src, setSrc] = useState("");
  useEffect(() => { repo.photoUrl(path).then(setSrc).catch(() => {}); }, [path, repo]);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/95 p-4 anim-rise" onClick={onClose}>
      {src && <img src={src} alt="" className="max-h-[85dvh] max-w-full rounded-2xl object-contain" />}
      <button aria-label="Kapat" className="press absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid size-12 place-items-center rounded-full bg-white/15 text-white">
        <X size={26} />
      </button>
    </div>
  );
}
