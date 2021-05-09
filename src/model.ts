export interface Recipe {
  name: string;
  saison: string;
  kosten: string;
  zubereitungszeit: string;
  portionen: number;
  quelle: string;
  herkunftsland: string;
  kategorie: string;
  zutaten: string[];
  vorbereitung: string[];
  zubereitung: string[];
  beilagen: string[];
}