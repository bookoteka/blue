import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";

import { schematBazyDanych } from "./schemat";

const sciezkaBazyDanych = "sqlite:blue.db";

let polaczenieSqlite: Database | undefined;

async function pobierzPolaczenieSqlite(): Promise<Database> {
  polaczenieSqlite ??= await Database.load(sciezkaBazyDanych);
  return polaczenieSqlite;
}

export const bazaDanych = drizzle(
  async (zapytanie, parametry, metoda) => {
    const baza = await pobierzPolaczenieSqlite();

    if (metoda === "run") {
      await baza.execute(zapytanie, parametry);
      return { rows: [] };
    }

    const wiersze = await baza.select<Record<string, unknown>[]>(
      zapytanie,
      parametry,
    );

    return { rows: wiersze };
  },
  { schema: schematBazyDanych },
);

export async function inicjalizujBazeDanych(): Promise<void> {
  const baza = await pobierzPolaczenieSqlite();

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS ksiazki (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tytul TEXT,
      autor TEXT,
      strony INTEGER,
      przeczytano TEXT NOT NULL DEFAULT (date('now')),
      format TEXT,
      seria TEXT,
      jednotomowka INTEGER NOT NULL DEFAULT 0,
      ocena INTEGER,
      jezyk TEXT,
      notatki TEXT,
      status_dnf INTEGER NOT NULL DEFAULT 0
    )
  `);

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS gatunki (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nazwa TEXT NOT NULL UNIQUE
    )
  `);

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS ksiazki_gatunki (
      ksiazka_id INTEGER NOT NULL,
      gatunek_id INTEGER NOT NULL,
      FOREIGN KEY (ksiazka_id)
        REFERENCES ksiazki(id) ON DELETE CASCADE,
      FOREIGN KEY (gatunek_id)
        REFERENCES gatunki(id) ON DELETE CASCADE
    )
  `);

  const gatunki = await baza.select<{ liczba: number }[]>(
    "SELECT COUNT(*) AS liczba FROM gatunki",
  );

  if (gatunki[0]?.liczba === 0) {
    const domyslneGatunki = [
      "Science-fiction",
      "Fantastyka",
      "Przygodowa",
      "Komedia",
      "Kryminał",
      "Romans",
      "Obyczaj",
      "Fanfik",
      "Inne",
    ];

    for (const nazwa of domyslneGatunki) {
      await baza.execute("INSERT INTO gatunki (nazwa) VALUES (?)", [nazwa]);
    }
  }
}
