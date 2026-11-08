import { MemoryRouter, Route, Routes } from "react-router-dom";

// Importy stron
import Glowna from "./pages/Glowna";
import Dodaj from "./pages/Dodaj";
import Ustawienia from "./pages/Ustawienia";
import WidokKsiazki from "./pages/WidokKsiazki";
import Edytuj from "./pages/Edytuj";
import Wykresy from "./pages/Wykresy";

export default function App () {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <Routes>
          <Route path="/" element={<Glowna/>} />
          <Route path="/dodaj" element={<Dodaj/>} />
          <Route path="/ustawienia" element={<Ustawienia/>} />
          <Route path="/ksiazka/:id" element={<WidokKsiazki/>} />
          <Route path="/ksiazka/:id/edytuj" element={<Edytuj/>} />
          <Route path="/wykresy" element={<Wykresy/>} />
        </Routes>
      </div>
    </MemoryRouter>
  )
}