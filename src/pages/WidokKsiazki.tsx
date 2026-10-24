// Strona książki - rout: /ksiazka/:id

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eq } from "drizzle-orm";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import { gatunki, ksiazki, ksiazkiGatunki } from "../db/schemat";

type Ksiazka = typeof ksiazki.$inferSelect;

const klasyPola =
  "rounded-lg border border-slate-200 bg-slate-50 p-4";

function wyswietlWartosc(wartosc: string | number | null): string {
  return wartosc === null || wartosc === "" ? "Brak danych" : String(wartosc);
}

function pobierzDate(data: string | null): Date | null {
  if (!data) return null;

  const dataObiektu = new Date(`${data}T00:00:00`);
  return Number.isNaN(dataObiektu.getTime()) ? null : dataObiektu;
}

function wyswietlMiesiac(data: string | null): string {
  const dataObiektu = pobierzDate(data);
  if (!dataObiektu) return "Brak danych";

  const miesiac = dataObiektu.toLocaleDateString("pl-PL", { month: "long" });
  return miesiac.charAt(0).toUpperCase() + miesiac.slice(1);
}

function wyswietlRok(data: string | null): string {
  const dataObiektu = pobierzDate(data);
  return dataObiektu ? String(dataObiektu.getFullYear()) : "Brak danych";
}

export default function WidokKsiazki() {
  const { id } = useParams<{ id: string }>();
  const nawigacja = useNavigate();
  const [ksiazka, setKsiazka] = useState<Ksiazka | null>(null);
  const [listaGatunkow, setListaGatunkow] = useState<string[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);
  const [pokazPotwierdzenie, setPokazPotwierdzenie] = useState(false);
  const [usuwanie, setUsuwanie] = useState(false);

  async function usunKsiazke() {
    if (!ksiazka) return;

    setUsuwanie(true);
    try {
      await bazaDanych
        .delete(ksiazkiGatunki)
        .where(eq(ksiazkiGatunki.ksiazkaId, ksiazka.id));
      await bazaDanych.delete(ksiazki).where(eq(ksiazki.id, ksiazka.id));
      nawigacja("/");
    } catch (bladUsuwania) {
      console.error("Błąd podczas usuwania książki:", bladUsuwania);
      setBlad("Nie udało się usunąć książki. Spróbuj ponownie.");
      setUsuwanie(false);
      setPokazPotwierdzenie(false);
    }
  }

  useEffect(() => {
    let aktywny = true;

    async function pobierzDane() {
      const idKsiazki = Number(id);
      if (!id || !Number.isInteger(idKsiazki) || idKsiazki <= 0) {
        setBlad("Nieprawidłowy identyfikator książki.");
        setLadowanie(false);
        return;
      }

      try {
        await inicjalizujBazeDanych();

        const [wynikKsiazki, wynikGatunkow] = await Promise.all([
          bazaDanych
            .select()
            .from(ksiazki)
            .where(eq(ksiazki.id, idKsiazki)),
          bazaDanych
            .select({ nazwa: gatunki.nazwa })
            .from(ksiazkiGatunki)
            .innerJoin(gatunki, eq(ksiazkiGatunki.gatunekId, gatunki.id))
            .where(eq(ksiazkiGatunki.ksiazkaId, idKsiazki)),
        ]);

        if (!aktywny) return;
        setKsiazka(wynikKsiazki[0] ?? null);
        setListaGatunkow(wynikGatunkow.map(({ nazwa }) => nazwa));
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania książki:", bladLadowania);
        if (aktywny) {
          setBlad("Nie udało się załadować danych książki. Spróbuj ponownie.");
        }
      } finally {
        if (aktywny) setLadowanie(false);
      }
    }

    void pobierzDane();
    return () => {
      aktywny = false;
    };
  }, [id]);

  if (ladowanie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="font-medium text-slate-500">Ładowanie danych...</p>
      </main>
    );
  }

  if (blad || !ksiazka) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4">
        <p className="text-center text-lg font-medium text-slate-600">
          {blad ?? "Nie znaleziono takiej książki."}
        </p>
        <Link
          to="/"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Powrót do listy
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              {wyswietlWartosc(ksiazka.tytul)}
            </h1>
            {ksiazka.statusDnf && (
              <span className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                DNF
              </span>
            )}
          </div>
          <p className="mt-2 text-lg font-medium text-slate-600">
            Autor:{" "}
            <span className="font-semibold text-slate-900">
              {wyswietlWartosc(ksiazka.autor)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Pole label="Liczba stron" wartosc={ksiazka.strony} />
          <Pole
            label="Miesiąc przeczytania"
            wartosc={wyswietlMiesiac(ksiazka.przeczytano)}
          />
          <Pole
            label="Rok przeczytania"
            wartosc={wyswietlRok(ksiazka.przeczytano)}
          />
          <Pole label="Format" wartosc={ksiazka.format} />
          <Pole
            label="Seria"
            wartosc={ksiazka.jednotomowka ? "───────────────────" : ksiazka.seria}
          />
          <Pole label="Ocena" wartosc={ksiazka.ocena === null ? null : `${ksiazka.ocena}/6 ⭐`} />
          <Pole label="Język" wartosc={ksiazka.jezyk} />
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Gatunki
          </h2>
          <div className="flex flex-wrap gap-2">
            {listaGatunkow.length > 0 ? (
              listaGatunkow.map((gatunek) => (
                <span
                  key={gatunek}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-primary-900"
                >
                  {gatunek}
                </span>
              ))
            ) : (
              <span className="text-sm italic text-slate-500">
                Brak przypisanych gatunków
              </span>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Notatki
          </h2>
          <div className={`${klasyPola} min-h-24 whitespace-pre-wrap text-slate-800`}>
            {wyswietlWartosc(ksiazka.notatki)}
          </div>
        </section>

        <div className="mt-8 flex justify-between border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3">
            <Link to={`/ksiazka/${id}/edytuj`}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
            >
              Edytuj
            </Link>
            <button
              type="button"
              onClick={() => setPokazPotwierdzenie(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Usuń
            </button>
          </div>
          <Link
            to="/"
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Powrót do listy
          </Link>
        </div>

        {pokazPotwierdzenie && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-bold text-slate-900">
                Usunąć książkę?
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                Czy na pewno chcesz usunąć tę książkę? Ta operacja jest
                nieodwracalna.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={usuwanie}
                  onClick={() => setPokazPotwierdzenie(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  disabled={usuwanie}
                  onClick={() => void usunKsiazke()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {usuwanie ? "Usuwanie..." : "Tak, usuń"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface PoleProps {
  label: string;
  wartosc: string | number | null;
}

function Pole({ label, wartosc }: PoleProps) {
  return (
    <div className={klasyPola}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="font-medium text-slate-800">
        {wyswietlWartosc(wartosc)}
      </span>
    </div>
  );
}
