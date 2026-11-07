import Database from "@tauri-apps/plugin-sql";

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

const domyslneJezyki = ["Polski", "Angielski"];

export async function przeprowadzMigracje(baza: Database): Promise<void> {
  await baza.execute("PRAGMA foreign_keys = ON");

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
      notatki TEXT
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

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS tagi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nazwa TEXT NOT NULL UNIQUE
    )
  `);

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS jezyki (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nazwa TEXT NOT NULL UNIQUE
    )
  `);

  await baza.execute(`
    CREATE TABLE IF NOT EXISTS ksiazki_tagi (
      ksiazka_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (ksiazka_id)
        REFERENCES ksiazki(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id)
        REFERENCES tagi(id) ON DELETE CASCADE
    )
  `);

  const wynik = await baza.select<{ liczba: number }[]>(
    "SELECT COUNT(*) AS liczba FROM gatunki",
  );

  if (wynik[0]?.liczba === 0) {
    for (const nazwa of domyslneGatunki) {
      await baza.execute("INSERT INTO gatunki (nazwa) VALUES (?)", [nazwa]);
    }
  }

  for (const nazwa of domyslneJezyki) {
    await baza.execute("INSERT OR IGNORE INTO jezyki (nazwa) VALUES (?)", [nazwa]);
  }

  const zapisaneJezyki = await baza.select<{ jezyk: string | null }[]>(
    "SELECT DISTINCT jezyk FROM ksiazki WHERE jezyk IS NOT NULL AND TRIM(jezyk) <> ''",
  );

  for (const { jezyk } of zapisaneJezyki) {
    if (jezyk) {
      await baza.execute("INSERT OR IGNORE INTO jezyki (nazwa) VALUES (?)", [
        jezyk,
      ]);
    }
  }
}
