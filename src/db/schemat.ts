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

export const tagi = sqliteTable("tagi", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nazwa: text("nazwa").notNull().unique(),
});

export const jezyki = sqliteTable("jezyki", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nazwa: text("nazwa").notNull().unique(),
});

export const ksiazkiTagi = sqliteTable("ksiazki_tagi", {
  ksiazkaId: integer("ksiazka_id")
    .notNull()
    .references(() => ksiazki.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tagi.id, { onDelete: "cascade" }),
});

export const schematBazyDanych = {
  ksiazki,
  gatunki,
  ksiazkiGatunki,
  tagi,
  jezyki,
  ksiazkiTagi,
};
