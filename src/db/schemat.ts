import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ksiazki = sqliteTable("ksiazki", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tytul: text("tytul"),
  autor: text("autor"),
  strony: integer("strony"),
  przeczytano: text("przeczytano")
    .notNull()
    .$defaultFn(() => new Date().toISOString().slice(0, 10)),
  format: text("format"),
  seria: text("seria"),
  jednotomowka: integer("jednotomowka", { mode: "boolean" })
    .notNull()
    .default(false),
  ocena: integer("ocena"),
  jezyk: text("jezyk"),
  notatki: text("notatki"),
  statusDnf: integer("status_dnf", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const gatunki = sqliteTable("gatunki", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nazwa: text("nazwa").notNull().unique(),
});

export const ksiazkiGatunki = sqliteTable("ksiazki_gatunki", {
  ksiazkaId: integer("ksiazka_id")
    .notNull()
    .references(() => ksiazki.id, { onDelete: "cascade" }),
  gatunekId: integer("gatunek_id")
    .notNull()
    .references(() => gatunki.id, { onDelete: "cascade" }),
});

export const schematBazyDanych = {
  ksiazki,
  gatunki,
  ksiazkiGatunki,
};
