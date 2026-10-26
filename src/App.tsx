import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import BottomNav from "./components/BottomNav";
import { SheetsProvider } from "./components/Sheets";
import Today from "./screens/Today";
import Customers from "./screens/Customers";
import CustomerDetail from "./screens/CustomerDetail";
import Calendar from "./screens/Calendar";
import Settings from "./screens/Settings";
import JobFlow from "./screens/JobFlow";
import { useEffect } from "react";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <main className="pt-safe mx-auto max-w-lg px-4 pb-36">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <SheetsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="musteriler" element={<Customers />} />
            <Route path="musteri/:id" element={<CustomerDetail />} />
            <Route path="takvim" element={<Calendar />} />
            <Route path="ayarlar" element={<Settings />} />
          </Route>
          <Route path="is" element={<JobFlow />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SheetsProvider>
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{ style: { fontSize: 16, borderRadius: 16, fontFamily: "inherit" } }}
      />
    </HashRouter>
  );
}
