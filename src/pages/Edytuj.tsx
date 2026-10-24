// Strona edycji - rout: /ksiazka/:id/edytuj

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eq } from "drizzle-orm";

import { bazaDanych, inicjalizujBazeDanych } from "../db/polaczenie";
import { gatunki, ksiazki, ksiazkiGatunki } from "../db/schemat";

const klasyPola =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

type DaneKsiazki = typeof ksiazki.$inferSelect;

export default function Edytuj() {
  const { id } = useParams<{ id: string }>();
  const nawigacja = useNavigate();
  const [ksiazka, setKsiazka] = useState<DaneKsiazki | null>(null);
  const [jednotomowka, setJednotomowka] = useState(false);
  const [statusDnf, setStatusDnf] = useState(false);
  const [nazwaSerii, setNazwaSerii] = useState("");
  const [listaGatunkow, setListaGatunkow] = useState<
    { id: number; nazwa: string }[]
  >([]);
  const [wybraneGatunki, setWybraneGatunki] = useState<number[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);
  const [zapisywanie, setZapisywanie] = useState(false);

  useEffect(() => {
    let aktywny = true;
    const idKsiazki = Number(id);

    async function zaladujDane() {
      if (!id || !Number.isInteger(idKsiazki) || idKsiazki <= 0) {
        setBlad("Nieprawidłowy identyfikator książki.");
        setLadowanie(false);
        return;
      }

      try {
        await inicjalizujBazeDanych();
        const [wynikiKsiazki, wynikiGatunkow, wszystkieGatunki] =
          await Promise.all([
            bazaDanych
              .select()
              .from(ksiazki)
              .where(eq(ksiazki.id, idKsiazki)),
            bazaDanych
              .select({ gatunekId: ksiazkiGatunki.gatunekId })
              .from(ksiazkiGatunki)
              .where(eq(ksiazkiGatunki.ksiazkaId, idKsiazki)),
            bazaDanych
              .select({ id: gatunki.id, nazwa: gatunki.nazwa })
              .from(gatunki),
          ]);

        const znalezionaKsiazka = wynikiKsiazki[0];
        if (!znalezionaKsiazka) {
          throw new Error("Nie znaleziono książki.");
        }

        if (!aktywny) return;
        setKsiazka(znalezionaKsiazka);
        setJednotomowka(znalezionaKsiazka.jednotomowka);
        setStatusDnf(znalezionaKsiazka.statusDnf);
        setNazwaSerii(znalezionaKsiazka.seria ?? "");
        setWybraneGatunki(wynikiGatunkow.map(({ gatunekId }) => gatunekId));
        setListaGatunkow(wszystkieGatunki);
      } catch (bladLadowania) {
        console.error("Błąd podczas ładowania książki do edycji:", bladLadowania);
        if (aktywny) {
          setBlad("Nie udało się załadować książki. Spróbuj ponownie.");
        }
      } finally {
        if (aktywny) setLadowanie(false);
      }
    }

    void zaladujDane();
    return () => {
      aktywny = false;
    };
  }, [id]);

  async function obsluzZapis(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBlad(null);

    if (!ksiazka) return;

    const daneFormularza = new FormData(e.currentTarget);
    const seria = nazwaSerii.trim();

    if (!jednotomowka && seria.length === 0) {
      setBlad("Podaj nazwę serii albo zaznacz opcję „Jednotomówka”.");
      return;
    }

    if (wybraneGatunki.length === 0) {
      setBlad("Wybierz przynajmniej jeden gatunek.");
      return;
    }

    setZapisywanie(true);

    try {
      await inicjalizujBazeDanych();
      await bazaDanych
        .update(ksiazki)
        .set({
          tytul: String(daneFormularza.get("tytul")).trim(),
          autor: String(daneFormularza.get("autor")).trim(),
          strony: Number(daneFormularza.get("strony")),
          statusDnf,
          format: String(daneFormularza.get("format")),
          seria: jednotomowka ? "" : seria,
          jednotomowka,
          ocena: Number(daneFormularza.get("ocena")),
          jezyk: String(daneFormularza.get("jezyk")),
          notatki: String(daneFormularza.get("notatki") ?? "").trim(),
        })
        .where(eq(ksiazki.id, ksiazka.id));

      await bazaDanych
        .delete(ksiazkiGatunki)
        .where(eq(ksiazkiGatunki.ksiazkaId, ksiazka.id));

      await bazaDanych.insert(ksiazkiGatunki).values(
        wybraneGatunki.map((gatunekId) => ({
          ksiazkaId: ksiazka.id,
          gatunekId,
        })),
      );

      nawigacja(`/ksiazka/${ksiazka.id}`);
    } catch (bladZapisu) {
      console.error("Błąd podczas aktualizowania książki:", bladZapisu);
      setBlad("Nie udało się zapisać zmian. Spróbuj ponownie.");
    } finally {
      setZapisywanie(false);
    }
  }

  if (ladowanie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="font-medium text-slate-500">Ładowanie danych...</p>
      </main>
    );
  }

  if (blad && !ksiazka) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4">
        <p className="text-center text-lg font-medium text-slate-600">{blad}</p>
        <Link
          to="/"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
        >
          Powrót do listy
        </Link>
      </main>
    );
  }

  if (!ksiazka) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl origin-top rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h1 className="mb-6 text-4xl font-bold text-primary-800">
          Edytuj książkę
        </h1>

        <form className="space-y-5" onSubmit={obsluzZapis}>
          <div>
            <label htmlFor="tytul">Tytuł:</label>
            <input className={klasyPola} defaultValue={ksiazka.tytul ?? ""} id="tytul" name="tytul" required type="text" />
          </div>

          <div>
            <label htmlFor="autor">Autor:</label>
            <input className={klasyPola} defaultValue={ksiazka.autor ?? ""} id="autor" name="autor" required type="text" />
          </div>

          <div className="flex items-center gap-2">
            <input
              checked={jednotomowka}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              disabled={zapisywanie}
              id="jednotomowka"
              onChange={(e) => {
                setJednotomowka(e.target.checked);
                if (e.target.checked) setNazwaSerii("");
              }}
              type="checkbox"
            />
            <label htmlFor="jednotomowka">Jednotomówka</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              checked={statusDnf}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              disabled={zapisywanie}
              id="statusDnf"
              onChange={(e) => setStatusDnf(e.target.checked)}
              type="checkbox"
            />
            <label htmlFor="statusDnf">Status DNF (nie ukończono)</label>
          </div>

          <div>
            <label htmlFor="seria">Nazwa serii:</label>
            <input
              className={klasyPola}
              disabled={jednotomowka || zapisywanie}
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
              defaultValue={ksiazka.strony ?? ""}
              id="strony"
              min="1"
              name="strony"
              required
              type="number"
            />
          </div>

          <div>
            <label htmlFor="ocena">Ocena:</label>
            <select className={`${klasyPola} cursor-pointer bg-white`} defaultValue={ksiazka.ocena?.toString() ?? ""} id="ocena" name="ocena" required>
              <option disabled value="">Wybierz ocenę</option>
              {[1, 2, 3, 4, 5, 6].map((ocena) => <option key={ocena} value={ocena}>{ocena}/6 ⭐</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="format">Format książki:</label>
            <select className={`${klasyPola} cursor-pointer bg-white`} defaultValue={ksiazka.format ?? ""} id="format" name="format" required>
              <option disabled value="">Wybierz format</option>
              <option value="Papierowa">Papierowa</option>
              <option value="E-book">E-book</option>
              <option value="Audiobook">Audiobook</option>
              <option value="Synchrobook">Synchrobook</option>
            </select>
          </div>

          <div>
            <label htmlFor="jezyk">Język:</label>
            <select className={`${klasyPola} cursor-pointer bg-white`} defaultValue={ksiazka.jezyk ?? ""} id="jezyk" name="jezyk" required>
              <option disabled value="">Wybierz język</option>
              <option value="Polski">Polski</option>
              <option value="Angielski">Angielski</option>
            </select>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-slate-900">Gatunki:</h2>
            <div className="flex flex-wrap gap-2.5">
              {listaGatunkow.map((gatunek) => {
                const czyWybrany = wybraneGatunki.includes(gatunek.id);
                return (
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${czyWybrany ? "border-primary-600 bg-primary-50/50 text-primary-900" : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    key={gatunek.id}
                  >
                    <input
                      checked={czyWybrany}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      disabled={zapisywanie}
                      onChange={(e) => setWybraneGatunki((poprzednie) => e.target.checked ? [...poprzednie, gatunek.id] : poprzednie.filter((idGatunku) => idGatunku !== gatunek.id))}
                      type="checkbox"
                    />
                    <span>{gatunek.nazwa}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="notatki">Notatki:</label>
            <textarea className={`${klasyPola} min-h-24 resize-y`} defaultValue={ksiazka.notatki ?? ""} id="notatki" name="notatki" rows={3} />
          </div>

          {blad && (
            <p aria-live="polite" className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
              {blad}
            </p>
          )}

          <hr className="border-slate-200" />

          <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row">
            <button className="w-full cursor-pointer rounded-lg bg-primary-600 px-6 py-2.5 text-center font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={zapisywanie} type="submit">
              {zapisywanie ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
            <Link className="w-full rounded-lg bg-slate-100 px-6 py-2.5 text-center font-medium text-slate-700 transition-colors hover:bg-slate-200 sm:w-auto" to={`/ksiazka/${ksiazka.id}`}>
              Anuluj
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
