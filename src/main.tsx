import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import "./styles.css";
import App from "./App";
import { StoreProvider } from "./store";
import { createLocalRepo } from "./repo/local";
import { createSupabaseRepo, supabase } from "./repo/supabase";
import Login from "./screens/Login";

function Cloud() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const repo = useMemo(() => createSupabaseRepo(supabase!), []);
  if (session === undefined) return null;
  if (!session) return <Login />;
  return (
    <StoreProvider key={session.user.id} repo={repo}>
      <App />
    </StoreProvider>
  );
}

function Demo() {
  const repo = useMemo(() => createLocalRepo(), []);
  return (
    <StoreProvider repo={repo}>
      <App />
    </StoreProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>{supabase ? <Cloud /> : <Demo />}</StrictMode>,
);
