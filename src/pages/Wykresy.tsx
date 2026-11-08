import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { eq } from "drizzle-orm";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import {
  gatunki,
  ksiazki,
  ksiazkiGatunki,
  ksiazkiTagi,
  tagi,
} from "../db/schemat";

const koloryPrimary = [
  "#a5b4fc",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
];

type DaneKsiazki = {
  format: string | null;
  ocena: number | null;
};

type DaneRelacji = {
  ksiazkaId: number;
  nazwa: string;
};

type Statystyka = {
  nazwa: string;
  liczba: number;
};

export default function Wykresy() {
  const [ksiazkiZBazy, setKsiazkiZBazy] = useState<DaneKsiazki[]>([]);
  const [relacjeGatunkow, setRelacjeGatunkow] = useState<DaneRelacji[]>([]);
  const [relacjeTagow, setRelacjeTagow] = useState<DaneRelacji[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    async function zaladujDane() {
      try {
        await inicjalizujBazeDanych();
        const [wynikiKsiazek, wynikiGatunkow, wynikiTagow] = await Promise.all([
          bazaDanych
            .select({ format: ksiazki.format, ocena: ksiazki.ocena })
            .from(ksiazki),
          bazaDanych
            .select({ ksiazkaId: ksiazkiGatunki.ksiazkaId, nazwa: gatunki.nazwa })
            .from(ksiazkiGatunki)
            .innerJoin(gatunki, eq(ksiazkiGatunki.gatunekId, gatunki.id)),
          bazaDanych
            .select({ ksiazkaId: ksiazkiTagi.ksiazkaId, nazwa: tagi.nazwa })
            .from(ksiazkiTagi)
            .innerJoin(tagi, eq(ksiazkiTagi.tagId, tagi.id)),
        ]);

        setKsiazkiZBazy(wynikiKsiazek);
        setRelacjeGatunkow(wynikiGatunkow);
        setRelacjeTagow(wynikiTagow);
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania statystyk:", bladLadowania);
        setBlad("Nie udało się załadować statystyk. Spróbuj ponownie.");
      } finally {
        setLadowanie(false);
      }
    }

    void zaladujDane();
  }, []);

  const formaty = useMemo(
    () => policzWystapienia(ksiazkiZBazy.map(({ format }) => format)),
    [ksiazkiZBazy],
  );
  const oceny = useMemo(
    () =>
      policzWystapienia(
        ksiazkiZBazy.map(({ ocena }) => (ocena ? String(ocena) : null)),
        (a, b) => Number(a) - Number(b),
      ),
    [ksiazkiZBazy],
  );
  const gatunkiStatystyki = useMemo(
    () =>
      policzWystapienia(
        relacjeGatunkow.map(({ nazwa }) => nazwa),
        (a, b) => b.localeCompare(a, "pl"),
      ),
    [relacjeGatunkow],
  );
  const tagiStatystyki = useMemo(
    () =>
      policzWystapienia(
        relacjeTagow.map(({ nazwa }) => nazwa),
        (a, b) => a.localeCompare(b, "pl"),
      ),
    [relacjeTagow],
  );

  if (ladowanie) {
    return <main className="min-h-screen bg-slate-100 p-6 text-slate-500">Ładowanie wykresów...</main>;
  }

  if (blad) {
    return <main className="min-h-screen bg-slate-100 p-6 text-red-600">{blad}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">bookoteka blue</p>
            <h1 className="text-4xl font-bold text-primary-900">Statystyki biblioteki</h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
            Strona główna
          </Link>
        </div>

        {ksiazkiZBazy.length === 0 ? (
          <section className="rounded-xl border border-primary-100 bg-white p-8 text-center text-slate-500 shadow-sm">
            Dodaj książki, aby zobaczyć wykresy.
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <SekcjaWykresu tytul="Formaty książek">
              <WykresKolowy dane={formaty} />
            </SekcjaWykresu>
            <SekcjaWykresu tytul="Oceny">
              <WykresSlupkowyPionowy dane={oceny} />
            </SekcjaWykresu>
            <SekcjaWykresu tytul="Najczęstsze gatunki">
              <WykresPoziomy dane={gatunkiStatystyki} />
            </SekcjaWykresu>
            <SekcjaWykresu tytul="Tagi">
              {tagiStatystyki.length === 0 ? (
                <p className="py-8 text-center text-slate-500">Brak przypisanych tagów.</p>
              ) : (
                <ul className="divide-y divide-primary-100">
                  {tagiStatystyki.map(({ nazwa, liczba }, indeks) => (
                    <li className="flex items-center justify-between py-3" key={nazwa}>
                      <span className="flex items-center gap-3 text-slate-700">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {indeks + 1}
                        </span>
                        {nazwa}
                      </span>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
                        {liczba}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SekcjaWykresu>
          </div>
        )}
      </div>
    </main>
  );
}

function policzWystapienia(
  wartosci: (string | null)[],
  sortowanie: (a: string, b: string) => number = (a, b) => b.localeCompare(a, "pl"),
): Statystyka[] {
  const liczby = new Map<string, number>();
  for (const wartosc of wartosci) {
    const nazwa = wartosc?.trim();
    if (nazwa) liczby.set(nazwa, (liczby.get(nazwa) ?? 0) + 1);
  }

  return [...liczby.entries()]
    .map(([nazwa, liczba]) => ({ nazwa, liczba }))
    .sort((a, b) => b.liczba - a.liczba || sortowanie(a.nazwa, b.nazwa));
}

function SekcjaWykresu({ tytul, children }: { tytul: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-primary-900">{tytul}</h2>
      {children}
    </section>
  );
}

function WykresKolowy({ dane }: { dane: Statystyka[] }) {
  const suma = dane.reduce((wynik, { liczba }) => wynik + liczba, 0);
  let poczatek = 0;
  const gradient = dane
    .map(({ liczba }, indeks) => {
      const koniec = poczatek + (liczba / suma) * 100;
      const fragment = `${koloryPrimary[indeks % koloryPrimary.length]} ${poczatek}% ${koniec}%`;
      poczatek = koniec;
      return fragment;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-44 w-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} aria-label="Wykres kołowy formatów" role="img" />
      <ul className="w-full space-y-3">
        {dane.map(({ nazwa, liczba }, indeks) => (
          <li className="flex items-center justify-between gap-4 text-sm" key={nazwa}>
            <span className="flex items-center gap-2 text-slate-600"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: koloryPrimary[indeks % koloryPrimary.length] }} />{nazwa}</span>
            <strong className="text-primary-800">{liczba}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WykresSlupkowyPionowy({ dane }: { dane: Statystyka[] }) {
  const maksimum = Math.max(...dane.map(({ liczba }) => liczba), 1);
  return (
    <div className="flex h-56 items-end gap-2 border-b border-primary-200 px-2 sm:gap-4">
      {dane.map(({ nazwa, liczba }, indeks) => (
        <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" key={nazwa}>
          <strong className="text-sm text-primary-800">{liczba}</strong>
          <div
            aria-label={`Ocena ${nazwa}: ${liczba} książek`}
            className="w-full max-w-12 rounded-t-lg transition-all"
            role="img"
            style={{
              backgroundColor: koloryPrimary[indeks % koloryPrimary.length],
              height: `${(liczba / maksimum) * 75}%`,
              minHeight: "0.5rem",
            }}
          />
          <span className="text-sm font-bold text-primary-700">{nazwa}/6⭐️</span>
        </div>
      ))}
    </div>
  );
}

function WykresPoziomy({ dane }: { dane: Statystyka[] }) {
  const maksimum = Math.max(...dane.map(({ liczba }) => liczba), 1);
  return (
    <div className="space-y-3">
      {dane.map(({ nazwa, liczba }, indeks) => (
        <div key={nazwa}>
          <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{nazwa}</span><strong className="text-primary-800">{liczba}</strong></div>
          <div className="h-3 overflow-hidden rounded-full bg-primary-50"><div className="h-full rounded-full" style={{ width: `${(liczba / maksimum) * 100}%`, backgroundColor: koloryPrimary[indeks % koloryPrimary.length] }} /></div>
        </div>
      ))}
    </div>
  );
}