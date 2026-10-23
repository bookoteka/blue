// Strona dodawania - rout: /dodaj

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import { ksiazki } from "../db/schemat";

const klasyPola =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function Dodaj() {
  const [jednotomowka, setJednotomowka] = useState(false);
  const [nazwaSerii, setNazwaSerii] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [zapisywanie, setZapisywanie] = useState(false);
  const nawigacja = useNavigate();

  async function obsluzZapis(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBlad(null);

    const daneFormularza = new FormData(e.currentTarget);
    const seria = nazwaSerii.trim();

    if (!jednotomowka && seria.length === 0) {
      setBlad("Podaj nazwę serii albo zaznacz opcję „Jednotomówka”.");
      return;
    }

    setZapisywanie(true);

    try {
      await inicjalizujBazeDanych();
      await bazaDanych.insert(ksiazki).values({
        tytul: String(daneFormularza.get("tytul")).trim(),
        autor: String(daneFormularza.get("autor")).trim(),
        strony: Number(daneFormularza.get("strony")),
        format: String(daneFormularza.get("format")),
        seria: jednotomowka ? "" : seria,
        jednotomowka,
        ocena: Number(daneFormularza.get("ocena")),
        jezyk: String(daneFormularza.get("jezyk")),
        notatki: String(daneFormularza.get("notatki") ?? "").trim(),
      });

      nawigacja("/");
    } catch (bladZapisu) {
      console.error("Błąd podczas zapisywania książki:", bladZapisu);
      setBlad("Nie udało się zapisać książki. Spróbuj ponownie.");
    } finally {
      setZapisywanie(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl origin-top rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h1 className="mb-6 text-4xl font-bold text-primary-800">
          Dodaj nową książkę
        </h1>

        <form className="space-y-5" onSubmit={obsluzZapis}>
          <div>
            <label htmlFor="tytul">Tytuł:</label>
            <input
              className={klasyPola}
              id="tytul"
              name="tytul"
              required
              type="text"
            />
          </div>

          <div>
            <label htmlFor="autor">Autor:</label>
            <input
              className={klasyPola}
              id="autor"
              name="autor"
              required
              type="text"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              checked={jednotomowka}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              id="jednotomowka"
              name="jednotomowka"
              onChange={(e) => {
                setJednotomowka(e.target.checked);
                if (e.target.checked) {
                  setNazwaSerii("");
                }
              }}
              type="checkbox"
            />
            <label htmlFor="jednotomowka">Jednotomówka</label>
          </div>

          <div>
            <label htmlFor="seria">Nazwa serii:</label>
            <input
              className={klasyPola}
              disabled={jednotomowka}
              id="seria"
              name="seria"
              onChange={(e) => setNazwaSerii(e.target.value)}
              required={!jednotomowka}
              type="text"
              value={nazwaSerii}
            />
          </div>

          <div>
            <label htmlFor="strony">Liczba stron:</label>
            <input
              className={`${klasyPola} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              id="strony"
              min="1"
              name="strony"
              required
              type="number"
            />
          </div>

          <div>
            <label htmlFor="ocena">Ocena:</label>
            <select
              className={`${klasyPola} cursor-pointer bg-white`}
              defaultValue=""
              id="ocena"
              name="ocena"
              required
            >
              <option disabled value="">
                Wybierz ocenę
              </option>
              {[1, 2, 3, 4, 5, 6].map((ocena) => (
                <option key={ocena} value={ocena}>
                  {ocena}/6 ⭐
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="format">Format książki:</label>
            <select
              className={`${klasyPola} cursor-pointer bg-white`}
              defaultValue=""
              id="format"
              name="format"
              required
            >
              <option disabled value="">
                Wybierz format
              </option>
              <option value="Papierowa">Papierowa</option>
              <option value="E-book">E-book</option>
              <option value="Audiobook">Audiobook</option>
              <option value="Synchrobook">Synchrobook</option>
            </select>
          </div>

          <div>
            <label htmlFor="jezyk">Język:</label>
            <select
              className={`${klasyPola} cursor-pointer bg-white`}
              defaultValue=""
              id="jezyk"
              name="jezyk"
              required
            >
              <option disabled value="">
                Wybierz język
              </option>
              <option value="Polski">Polski</option>
              <option value="Angielski">Angielski</option>
            </select>
          </div>

          <div>
            <label htmlFor="notatki">Notatki:</label>
            <textarea
              className={`${klasyPola} min-h-24 resize-y`}
              id="notatki"
              name="notatki"
              rows={3}
            />
          </div>

          {blad && (
            <p
              aria-live="polite"
              className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700"
            >
              {blad}
            </p>
          )}

          <hr className="border-slate-200" />

          <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row">
            <button
              className="w-full cursor-pointer rounded-lg bg-primary-600 px-6 py-2.5 text-center font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={zapisywanie}
              type="submit"
            >
              {zapisywanie ? "Zapisywanie..." : "Zapisz książkę"}
            </button>
            <Link
              className="w-full rounded-lg bg-slate-100 px-6 py-2.5 text-center font-medium text-slate-700 transition-colors hover:bg-slate-200 sm:w-auto"
              to="/"
            >
              Anuluj
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
