// Strona główna - rout: /

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import { ksiazki } from "../db/schemat";

type Ksiazka = typeof ksiazki.$inferSelect;

export default function Glowna() {
  const [czyMenuOtwarte, setCzyMenuOtwarte] = useState(false);
  const [ksiazkiZBazy, setKsiazkiZBazy] = useState<Ksiazka[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    async function zaladujKsiazki() {
      try {
        await inicjalizujBazeDanych();
        const wyniki = await bazaDanych.select().from(ksiazki);
        setKsiazkiZBazy(wyniki);
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania książek:", bladLadowania);
        setBlad("Nie udało się załadować książek. Spróbuj ponownie.");
      } finally {
        setLadowanie(false);
      }
    }

    void zaladujKsiazki();
  }, []);

  const przeczytaneKsiazki = ksiazkiZBazy.filter(
    (ksiazka) => !ksiazka.statusDnf,
  );
  const iloscKsiazek = przeczytaneKsiazki.length;
  const sumaStron = ksiazkiZBazy.reduce(
    (suma, ksiazka) => suma + (ksiazka.strony ?? 0),
    0,
  );

  return (
    <div style={{ padding: "1rem" }} className="relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-bold text-primary-900">
          bookoteka <span className="text-blue-800">blue</span>
        </h1>
        
        {/* Przycisk menu */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setCzyMenuOtwarte(!czyMenuOtwarte)}
            className="p-2.5 text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-xl transition-colors cursor-pointer border border-primary-200 bg-primary-50 shadow-xs flex items-center justify-center"
            title="Menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.75} 
              stroke="currentColor" 
              className="w-7 h-7"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" 
              />
            </svg>
          </button>

          <ModalMenu otwarte={czyMenuOtwarte} onClose={() => setCzyMenuOtwarte(false)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 p-5 rounded-xl border border-primary-100 shadow-sm">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider block">
            Przeczytane pozycje
          </span>
          <span className="text-3xl font-extrabold text-primary-600">
            {iloscKsiazek}
          </span>
        </div>

        <div className="bg-primary-50 p-5 rounded-xl border border-primary-100 shadow-sm">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider block">
            Suma przeczytanych stron
          </span>
          <span className="text-3xl font-extrabold text-primary-600">
            {sumaStron.toLocaleString("pl-PL")}
          </span>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-xl border border-primary-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-100 flex items-center justify-between bg-primary-50/70">
          <h2 className="text-xl font-bold text-primary-900">
            Przeczytane książki
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 text-primary-800 rounded-full">
            Łącznie: {iloscKsiazek}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-primary-100 text-primary-700 bg-primary-50/30">
                <th className="py-3 px-6 font-semibold">Tytuł</th>
                <th className="py-3 px-6 font-semibold">Autor</th>
                <th className="py-3 px-6 font-semibold">Ocena</th>
                <th className="py-3 px-6 font-semibold">Język</th>
                <th className="py-3 px-6 font-semibold text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ladowanie ? (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={5}>
                    Ładowanie książek...
                  </td>
                </tr>
              ) : blad ? (
                <tr>
                  <td className="px-6 py-6 text-center text-red-600" colSpan={5}>
                    {blad}
                  </td>
                </tr>
              ) : ksiazkiZBazy.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={5}>
                    Brak książek w bazie.
                  </td>
                </tr>
              ) : (
                ksiazkiZBazy.map((ksiazka) => (
                <tr key={ksiazka.id} className="transition-colors hover:bg-primary-50/60">
                  <td className="py-3.5 px-6 text-slate-600">{ksiazka.tytul ?? "—"}</td>
                  <td className="py-3.5 px-6 text-slate-600">{ksiazka.autor ?? "—"}</td>
                  <td className="py-3.5 px-6 text-slate-600 font-semibold">{ksiazka.ocena ?? "—"}⭐️</td>
                  <td className="py-3.5 px-6 text-slate-600">{ksiazka.jezyk ?? "—"}</td>
                  <td className="py-3.5 px-6 text-right">
                    <Link to={`/ksiazka/${ksiazka.id}`} className="text-primary-600 hover:text-primary-900 font-medium text-xs cursor-pointer">Pokaż</Link>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Osobna funkcja (komponent) z modalem menu w tym samym pliku
interface ModalMenuProps {
  otwarte: boolean;
  onClose: () => void;
}

function ModalMenu({ otwarte, onClose }: ModalMenuProps) {
  if (!otwarte) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/10" 
        onClick={onClose} 
      />
      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
          Menu
        </div>
        <div className="flex flex-col py-1">
          <Link
            to='/'
            onClick={onClose} 
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            Strona główna
          </Link>
          <Link
            to='/dodaj'
            onClick={onClose} 
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            Dodaj książkę
          </Link>
          <Link
            to='/ustawienia'
            onClick={onClose} 
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            Ustawienia
          </Link>
        </div>
      </div>
    </>
  );
}