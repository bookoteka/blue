import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";

import { przeprowadzMigracje } from "./migracje";
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

    return { rows: wiersze.map((wiersz) => Object.values(wiersz)) };
  },
  { schema: schematBazyDanych },
);

export async function inicjalizujBazeDanych(): Promise<void> {
  const baza = await pobierzPolaczenieSqlite();
  await przeprowadzMigracje(baza);
}
