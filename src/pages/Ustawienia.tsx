// Strona ustawień - rout: /ustawienia

import { useEffect, useState, type FormEvent } from "react";
import { asc, eq } from "drizzle-orm";
import { Link } from "react-router-dom";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import {
  gatunki,
  jezyki,
  ksiazki,
  ksiazkiGatunki,
  ksiazkiTagi,
  tagi,
} from "../db/schemat";

export default function Ustawienia() {
  const [aktywnaZakladka, setAktywnaZakladka] = useState<
    "aplikacja" | "gatunki" | "tagi" | "jezyki"
  >("aplikacja");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="mb-8 text-4xl font-bold text-primary-900">
          Ustawienia
        </h1>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
          to="/"
        >
          <svg
            className="h-4 w-4 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
          </svg>
          Strona główna
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="flex flex-col space-y-2 md:col-span-1">
          <button
            className={`rounded-lg px-4 py-2 text-left text-lg font-medium transition-colors ${
              aktywnaZakladka === "aplikacja"
                ? "bg-primary-600 text-white"
                : "text-slate-700 hover:bg-primary-100"
            }`}
            onClick={() => setAktywnaZakladka("aplikacja")}
            type="button"
          >
            O aplikacji
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-left text-lg font-medium transition-colors ${
              aktywnaZakladka === "gatunki"
                ? "bg-primary-600 text-white"
                : "text-slate-700 hover:bg-primary-100"
            }`}
            onClick={() => setAktywnaZakladka("gatunki")}
            type="button"
          >
            Gatunki
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-left text-lg font-medium transition-colors ${
              aktywnaZakladka === "tagi"
                ? "bg-primary-600 text-white"
                : "text-slate-700 hover:bg-primary-100"
            }`}
            onClick={() => setAktywnaZakladka("tagi")}
            type="button"
          >
            Tagi
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-left text-lg font-medium transition-colors ${
              aktywnaZakladka === "jezyki"
                ? "bg-primary-600 text-white"
                : "text-slate-700 hover:bg-primary-100"
            }`}
            onClick={() => setAktywnaZakladka("jezyki")}
            type="button"
          >
            Języki
          </button>
        </aside>

        <section className="min-h-75 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:col-span-3">
          {aktywnaZakladka === "aplikacja" ? (
            <OAplikacji />
          ) : aktywnaZakladka === "gatunki" ? (
            <Gatunki />
          ) : aktywnaZakladka === "tagi" ? (
            <Tagi />
          ) : (
            <Jezyki />
          )}
        </section>
      </div>
    </main>
  );
}

function Gatunki() {
  const [listaGatunkow, setListaGatunkow] = useState<
    { id: number; nazwa: string }[]
  >([]);
  const [nazwaGatunku, setNazwaGatunku] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [usuwanyGatunekId, setUsuwanyGatunekId] = useState<number | null>(null);

  async function odswiezGatunki() {
    const wyniki = await bazaDanych
      .select({ id: gatunki.id, nazwa: gatunki.nazwa })
      .from(gatunki)
      .orderBy(asc(gatunki.nazwa));
    setListaGatunkow(wyniki);
  }

  useEffect(() => {
    async function zaladujGatunki() {
      try {
        await inicjalizujBazeDanych();
        await odswiezGatunki();
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania gatunków:", bladLadowania);
        setBlad("Nie udało się załadować gatunków. Spróbuj ponownie.");
      } finally {
        setLadowanie(false);
      }
    }

    void zaladujGatunki();
  }, []);

  async function obsluzDodanie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const oczyszczonaNazwa = nazwaGatunku.trim();
    setBlad(null);
    setKomunikat(null);

    if (oczyszczonaNazwa.length === 0) {
      setBlad("Podaj nazwę gatunku.");
      return;
    }

    if (
      listaGatunkow.some(
        (gatunek) => gatunek.nazwa.toLocaleLowerCase() === oczyszczonaNazwa.toLocaleLowerCase(),
      )
    ) {
      setBlad("Taki gatunek już istnieje.");
      return;
    }

    setZapisywanie(true);

    try {
      await bazaDanych.insert(gatunki).values({ nazwa: oczyszczonaNazwa });
      setNazwaGatunku("");
      await odswiezGatunki();
      setKomunikat("Gatunek został dodany.");
    } catch (bladZapisu) {
      console.error("Błąd podczas dodawania gatunku:", bladZapisu);
      setBlad("Nie udało się dodać gatunku. Sprawdź, czy nazwa jest unikalna.");
    } finally {
      setZapisywanie(false);
    }
  }

  async function obsluzUsuwanie(idGatunku: number) {
    setBlad(null);
    setKomunikat(null);
    setUsuwanyGatunekId(idGatunku);

    try {
      const przypisania = await bazaDanych
        .select({ ksiazkaId: ksiazkiGatunki.ksiazkaId })
        .from(ksiazkiGatunki)
        .where(eq(ksiazkiGatunki.gatunekId, idGatunku));

      if (przypisania.length > 0) {
        setBlad("Nie można usunąć gatunku przypisanego do książek.");
        return;
      }

      await bazaDanych.delete(gatunki).where(eq(gatunki.id, idGatunku));
      await odswiezGatunki();
      setKomunikat("Gatunek został usunięty.");
    } catch (bladUsuwania) {
      console.error("Błąd podczas usuwania gatunku:", bladUsuwania);
      setBlad("Nie udało się usunąć gatunku. Spróbuj ponownie.");
    } finally {
      setUsuwanyGatunekId(null);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-primary-900">Gatunki</h2>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={obsluzDodanie}>
        <label className="sr-only" htmlFor="nazwa-gatunku">
          Nazwa gatunku
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          id="nazwa-gatunku"
          onChange={(e) => setNazwaGatunku(e.target.value)}
          placeholder="Nazwa nowego gatunku"
          type="text"
          value={nazwaGatunku}
        />
        <button
          className="rounded-lg bg-primary-600 px-5 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={zapisywanie}
          type="submit"
        >
          {zapisywanie ? "Dodawanie..." : "Dodaj gatunek"}
        </button>
      </form>

      {blad && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          {blad}
        </p>
      )}
      {komunikat && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-green-300 bg-green-100 p-3 text-sm text-green-700">
          {komunikat}
        </p>
      )}

      {ladowanie ? (
        <p className="text-slate-500">Ładowanie gatunków...</p>
      ) : listaGatunkow.length === 0 ? (
        <p className="text-slate-500">Brak gatunków.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {listaGatunkow.map((gatunek) => (
            <li className="flex items-center justify-between gap-4 px-4 py-3" key={gatunek.id}>
              <span className="text-slate-700">{gatunek.nazwa}</span>
              <button
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={usuwanyGatunekId === gatunek.id}
                onClick={() => void obsluzUsuwanie(gatunek.id)}
                type="button"
              >
                {usuwanyGatunekId === gatunek.id ? "Usuwanie..." : "Usuń"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tagi() {
  const [listaTagow, setListaTagow] = useState<
    { id: number; nazwa: string }[]
  >([]);
  const [nazwaTagu, setNazwaTagu] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [usuwanyTagId, setUsuwanyTagId] = useState<number | null>(null);

  async function odswiezTagi() {
    const wyniki = await bazaDanych
      .select({ id: tagi.id, nazwa: tagi.nazwa })
      .from(tagi)
      .orderBy(asc(tagi.nazwa));
    setListaTagow(wyniki);
  }

  useEffect(() => {
    async function zaladujTagi() {
      try {
        await inicjalizujBazeDanych();
        await odswiezTagi();
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania tagów:", bladLadowania);
        setBlad("Nie udało się załadować tagów. Spróbuj ponownie.");
      } finally {
        setLadowanie(false);
      }
    }

    void zaladujTagi();
  }, []);

  async function obsluzDodanie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const oczyszczonaNazwa = nazwaTagu.trim();
    setBlad(null);
    setKomunikat(null);

    if (oczyszczonaNazwa.length === 0) {
      setBlad("Podaj nazwę tagu.");
      return;
    }

    if (
      listaTagow.some(
        (tag) =>
          tag.nazwa.toLocaleLowerCase() ===
          oczyszczonaNazwa.toLocaleLowerCase(),
      )
    ) {
      setBlad("Taki tag już istnieje.");
      return;
    }

    setZapisywanie(true);

    try {
      await bazaDanych.insert(tagi).values({ nazwa: oczyszczonaNazwa });
      setNazwaTagu("");
      await odswiezTagi();
      setKomunikat("Tag został dodany.");
    } catch (bladZapisu) {
      console.error("Błąd podczas dodawania tagu:", bladZapisu);
      setBlad("Nie udało się dodać tagu. Sprawdź, czy nazwa jest unikalna.");
    } finally {
      setZapisywanie(false);
    }
  }

  async function obsluzUsuwanie(idTagu: number) {
    setBlad(null);
    setKomunikat(null);
    setUsuwanyTagId(idTagu);

    try {
      const przypisania = await bazaDanych
        .select({ ksiazkaId: ksiazkiTagi.ksiazkaId })
        .from(ksiazkiTagi)
        .where(eq(ksiazkiTagi.tagId, idTagu));

      if (przypisania.length > 0) {
        setBlad("Nie można usunąć tagu przypisanego do książek.");
        return;
      }

      await bazaDanych.delete(tagi).where(eq(tagi.id, idTagu));
      await odswiezTagi();
      setKomunikat("Tag został usunięty.");
    } catch (bladUsuwania) {
      console.error("Błąd podczas usuwania tagu:", bladUsuwania);
      setBlad("Nie udało się usunąć tagu. Spróbuj ponownie.");
    } finally {
      setUsuwanyTagId(null);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-primary-900">Tagi</h2>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={obsluzDodanie}>
        <label className="sr-only" htmlFor="nazwa-tagu">
          Nazwa tagu
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          id="nazwa-tagu"
          onChange={(e) => setNazwaTagu(e.target.value)}
          placeholder="Nazwa nowego tagu"
          type="text"
          value={nazwaTagu}
        />
        <button
          className="rounded-lg bg-primary-600 px-5 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={zapisywanie}
          type="submit"
        >
          {zapisywanie ? "Dodawanie..." : "Dodaj tag"}
        </button>
      </form>

      {blad && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          {blad}
        </p>
      )}
      {komunikat && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-green-300 bg-green-100 p-3 text-sm text-green-700">
          {komunikat}
        </p>
      )}

      {ladowanie ? (
        <p className="text-slate-500">Ładowanie tagów...</p>
      ) : listaTagow.length === 0 ? (
        <p className="text-slate-500">Brak tagów.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {listaTagow.map((tag) => (
            <li className="flex items-center justify-between gap-4 px-4 py-3" key={tag.id}>
              <span className="text-slate-700">{tag.nazwa}</span>
              <button
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={usuwanyTagId === tag.id}
                onClick={() => void obsluzUsuwanie(tag.id)}
                type="button"
              >
                {usuwanyTagId === tag.id ? "Usuwanie..." : "Usuń"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Jezyki() {
  const [listaJezykow, setListaJezykow] = useState<
    { id: number; nazwa: string }[]
  >([]);
  const [nazwaJezyka, setNazwaJezyka] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [usuwanyJezykId, setUsuwanyJezykId] = useState<number | null>(null);

  async function odswiezJezyki() {
    const wyniki = await bazaDanych
      .select({ id: jezyki.id, nazwa: jezyki.nazwa })
      .from(jezyki)
      .orderBy(asc(jezyki.nazwa));
    setListaJezykow(wyniki);
  }

  useEffect(() => {
    async function zaladujJezyki() {
      try {
        await inicjalizujBazeDanych();
        await odswiezJezyki();
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania języków:", bladLadowania);
        setBlad("Nie udało się załadować języków. Spróbuj ponownie.");
      } finally {
        setLadowanie(false);
      }
    }

    void zaladujJezyki();
  }, []);

  async function obsluzDodanie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const oczyszczonaNazwa = nazwaJezyka.trim();
    setBlad(null);
    setKomunikat(null);

    if (oczyszczonaNazwa.length === 0) {
      setBlad("Podaj nazwę języka.");
      return;
    }

    if (
      listaJezykow.some(
        (jezyk) =>
          jezyk.nazwa.toLocaleLowerCase() ===
          oczyszczonaNazwa.toLocaleLowerCase(),
      )
    ) {
      setBlad("Taki język już istnieje.");
      return;
    }

    setZapisywanie(true);
    try {
      await bazaDanych.insert(jezyki).values({ nazwa: oczyszczonaNazwa });
      setNazwaJezyka("");
      await odswiezJezyki();
      setKomunikat("Język został dodany.");
    } catch (bladZapisu) {
      console.error("Błąd podczas dodawania języka:", bladZapisu);
      setBlad("Nie udało się dodać języka. Sprawdź, czy nazwa jest unikalna.");
    } finally {
      setZapisywanie(false);
    }
  }

  async function obsluzUsuwanie(idJezyka: number, nazwaJezykaDoUsuniecia: string) {
    setBlad(null);
    setKomunikat(null);
    setUsuwanyJezykId(idJezyka);

    try {
      const przypisania = await bazaDanych
        .select({ id: ksiazki.id })
        .from(ksiazki)
        .where(eq(ksiazki.jezyk, nazwaJezykaDoUsuniecia));

      if (przypisania.length > 0) {
        setBlad("Nie można usunąć języka przypisanego do książek.");
        return;
      }

      await bazaDanych.delete(jezyki).where(eq(jezyki.id, idJezyka));
      await odswiezJezyki();
      setKomunikat("Język został usunięty.");
    } catch (bladUsuwania) {
      console.error("Błąd podczas usuwania języka:", bladUsuwania);
      setBlad("Nie udało się usunąć języka. Spróbuj ponownie.");
    } finally {
      setUsuwanyJezykId(null);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-primary-900">Języki</h2>
      <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={obsluzDodanie}>
        <label className="sr-only" htmlFor="nazwa-jezyka">
          Nazwa języka
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          id="nazwa-jezyka"
          onChange={(e) => setNazwaJezyka(e.target.value)}
          placeholder="Nazwa nowego języka"
          type="text"
          value={nazwaJezyka}
        />
        <button
          className="rounded-lg bg-primary-600 px-5 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={zapisywanie}
          type="submit"
        >
          {zapisywanie ? "Dodawanie..." : "Dodaj język"}
        </button>
      </form>

      {blad && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          {blad}
        </p>
      )}
      {komunikat && (
        <p aria-live="polite" className="mb-4 rounded-lg border border-green-300 bg-green-100 p-3 text-sm text-green-700">
          {komunikat}
        </p>
      )}

      {ladowanie ? (
        <p className="text-slate-500">Ładowanie języków...</p>
      ) : listaJezykow.length === 0 ? (
        <p className="text-slate-500">Brak języków.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {listaJezykow.map((jezyk) => (
            <li className="flex items-center justify-between gap-4 px-4 py-3" key={jezyk.id}>
              <span className="text-slate-700">{jezyk.nazwa}</span>
              <button
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={usuwanyJezykId === jezyk.id}
                onClick={() => void obsluzUsuwanie(jezyk.id, jezyk.nazwa)}
                type="button"
              >
                {usuwanyJezykId === jezyk.id ? "Usuwanie..." : "Usuń"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OAplikacji() {
  return (
    <div>
      <h1 className="text-4xl text-primary-800">bookoteka <span className="text-blue-600">blue</span></h1>
      <h2 className="text-lg">
        Autor:{" "}
        <a
          className="text-primary-600 hover:underline"
          href="https://github.com/bookoteka"
          rel="noopener noreferrer"
          target="_blank"
        >
          Bookoteka Apps
        </a>{" "}
        by Karl Evans
      </h2>
      <hr className="my-4 border-slate-200" />
      <h3 className="leading-relaxed">
        Copyright (c) 2026 Karl Evans. Wszelkie prawa zastrzeżone.
        <br />
        <br />
        Niniejsze oprogramowanie jest udostępniane wyłącznie do użytku
        (uruchamiania i korzystania z aplikacji). Wszelkie prawa do kodu
        źródłowego, architektury oraz zasobów projektu pozostają wyłączną
        własnością autora.
        <br />
        <br />
        Zabrania się:
        <br />
        1. Kopiowania, powielania oraz rozpowszechniania kodu źródłowego w
        całości lub w części.
        <br />
        2. Modyfikowania, tworzenia dzieł pochodnych oraz dekompilacji kodu.
        <br />
        3. Wykorzystywania kodu źródłowego w innych projektach bez wyraźnej,
        pisemnej zgody autora.
      </h3>
    </div>
  );
}
