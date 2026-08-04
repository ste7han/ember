-- Schema voor de D1-database. Toepassen met:
--   npx wrangler d1 execute ember --remote --file schema.sql
--   npx wrangler d1 execute ember --local  --file schema.sql   (voor lokaal testen)

-- Reserveringen op kaarten uit de furnace.
--
-- `offer_id` is de primaire sleutel, en dát is het hele slot: twee mensen die
-- op dezelfde seconde reserveren kunnen niet allebei een rij aanmaken. De
-- database garandeert dat, niet onze timing.
--
-- Verlopen reserveringen laten we gewoon staan en ruimen we op bij de volgende
-- poging; een achtergrondtaak zou meer bewegende delen zijn dan het waard is.
create table if not exists reservations (
  offer_id   text primary key,
  wallet     text not null,
  expires_at integer not null   -- unix-tijd in milliseconden
);

create index if not exists reservations_expires on reservations (expires_at);

-- Verzendadressen, gekoppeld aan een wallet.
--
-- `envelope` bevat versleutelde tekst en verder niets. De sleutel om die te
-- openen staat op één laptop en niet hier — ook wij kunnen deze kolom niet
-- lezen zonder dat bestand.
create table if not exists addresses (
  wallet   text primary key,
  envelope text not null,
  saved_at text not null
);
