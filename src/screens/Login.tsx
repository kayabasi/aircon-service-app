import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { supabase } from "@/repo/supabase";
import { Button, Field } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message.includes("Invalid") ? "E-posta veya şifre yanlış. Tekrar dene." : "Giriş yapılamadı. İnternet bağlantını kontrol et.");
    setBusy(false);
  }

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <img src="icon.svg" alt="" className="size-16 rounded-2xl" />
      <h1 className="mt-6 text-2xl font-bold">Klima Servis</h1>
      <p className="mt-1 text-lg text-ink-2">Bir kere giriş yap, telefon seni hatırlar.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="E-posta" type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Şifre" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="rounded-2xl bg-hot-tint px-4 py-3 text-hot">{error}</p>}
        <Button type="submit" block disabled={busy}><LogIn size={22} />{busy ? "Giriş yapılıyor…" : "Giriş yap"}</Button>
      </form>
    </main>
  );
}
