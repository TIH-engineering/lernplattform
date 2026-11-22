# Designsystem „Modern Technical Education“

Stand: 22.11.2026 · Status: **auf der ganzen Webseite aktiv**.

## So funktioniert es

- Alle allgemeinen Regeln stehen in `src/styles/ds.css` (in `astro.config.mjs` unter `customCss` eingebunden).
  Die Quiz-Stile stehen direkt in `src/components/Quiz.astro`.
- Weg und Reiter oben auf jeder Themenseite erzeugt `src/components/Seitentitel.astro` automatisch aus der
  Seitenleiste (Starlight-Einstellung `components.PageTitle`). Neue Themen bekommen die Navigation also von selbst.
- Lernziele auf den Übersichten und die Einleitung der Quizseiten stehen im `Kasten`-Baustein.
- Keine externen Schriften, keine Bibliotheken, keine Animationen außer kurzen Übergängen
  (abgeschaltet bei „Bewegung reduzieren“ im Betriebssystem).

## Farben

Ruhige Palette aus Petrol, Blau und Türkis auf neutralen Flächen. Jede Farbe ist für Hell- und Dunkelmodus
getrennt festgelegt und auf Kontrast geprüft (alle Texte ≥ 4,5 : 1, gemessen ≥ 5,2 : 1).

| Rolle | Variable | Hell | Dunkel | Verwendung |
| --- | --- | --- | --- | --- |
| Akzent | `--ds-petrol` | `#0f6e7a` | `#2bb3c0` | Links, aktive Reiter, Knöpfe, Lernziele |
| Akzent kräftig | `--ds-petrol-stark` | `#0a4650` | `#8fe0e7` | Zwischenüberschriften, Tabellenköpfe |
| Formel | `--ds-blau` | `#1f5fae` | `#7fb2f0` | Formelkästen |
| Merke / richtig | `--ds-tuerkis` | `#0a6b64` | `#3fd0c0` | Merke-Kästen, richtige Antworten |
| Achtung | `--ds-bernstein` | `#8a5a00` | `#f2b84b` | Achtung-Kästen, Hinweis bei leerer Eingabe |
| falsch | `--ds-rot` | `#b42318` | `#ff8a80` | falsche Antworten |
| Fläche | `--ds-flaeche` / `-2` | `#ffffff` / `#f3f7f8` | `#111b20` / `#16232a` | Karten / Unterflächen |
| Linie | `--ds-linie` | `#d7e1e5` | `#2a3a42` | Rahmen, Trennlinien |
| leiser Text | `--ds-text-leise` | `#4d5f68` | `#a9b9c1` | Beschreibungen, Bildunterschriften |
| Signalweg 1 | `--ds-signal-1` | `#0b72c4` | `#4cc3ff` | Schaltbilder: 1. Halbwelle, Hauptsignal |
| Signalweg 2 | `--ds-signal-2` | `#b45a00` | `#f2b84b` | Schaltbilder: 2. Halbwelle, Vergleichssignal |

Getönte Hintergründe (`--ds-ton-…`) sind im Hellmodus sehr helle Volltöne, im Dunkelmodus 12–13 % deckend.
Die Starlight-Akzentfarben (`--sl-color-accent…`) werden auf den Designsystem-Seiten auf Petrol umgestellt.

**Nicht nur Farbe:** Richtig/falsch zeigt zusätzlich „✓ richtig“ / „✗ gewählt“; Schwierigkeitsstufen tragen ihren Namen;
Signalwege in Schaltbildern sind beschriftet („positive Halbwelle: D1 und D4 leiten“).

## Typografie und Abstände

- Systemschrift von Starlight (keine Webfonts), Zeilenhöhe 1,7 im Fließtext.
- h2 1,75 rem, fett, mit Trennlinie und kurzem Petrol-Balken darüber; h3 1,3 rem in Petrol.
- Radien: 0,75 rem (Karten), 0,5 rem (Kästen, Knöpfe); Standardabstand 1,5 rem zwischen Blöcken.
- Tabellen mit gerundetem Rahmen und getönter Kopfzeile; abgesetzte Formeln leicht hinterlegt.
- Sichtbarer Tastaturfokus: 2 px Petrol-Rahmen an allen Links, Knöpfen und Eingaben.

## Bausteine (in `src/components/`)

| Baustein | Zweck | Beispiel |
| --- | --- | --- |
| `Zeichen` | 30 einheitliche technische Symbole (24er-Raster, 1,75 px Linie, `currentColor`) | `<Zeichen name="diode" />` |
| `Themenkarte` | Karte mit Symbol, Titel, Kurztext und Schnelleinstiegen (Theorie · Rechnen · Quiz); ganze Karte anklickbar | `<Themenkarte titel="Dioden" symbol="diode" href="/dioden/" text="…" />` |
| `Seitentitel` | Titel + automatisch Weg (Start › Bereich › Thema) und Reiter aller Teile des Themas | wirkt von selbst auf jeder Themenseite |
| `Kasten` | Lernziele (Häkchenliste), Merke, Formel (mit Gültigkeit, auch als `<span slot="gilt">` mit Formeln), Achtung | `<Kasten typ="formel" titel="…" gilt="…">$$…$$</Kasten>` |
| `Rechenbeispiel` | Kopf mit Stufe · Angabe · Gegeben/Gesucht nebeneinander · aufklappbare Lösung · hervorgehobenes Ergebnis | siehe Dioden-Theorie, Abschnitt Z-Diode |
| `Quiz` | Karten, Antwortkacheln, ✓/✗-Etiketten, Fortschrittsbalken (Desktop mitlaufend, Handy am Ende) | `<Quiz id="dioden" />` |
| `Loesung` | aufklappbare Lösung in allen Rechenbeispielen (Karte mit Pfeil) | `<Loesung> … </Loesung>` |
| `FourierLabor` | interaktive Fourier-Reihe: Zeitbereich und Linienspektrum, Sinus/Rechteck/Dreieck, 1 … 19 Harmonische | `<FourierLabor />` |

CSS-Klassen für freies HTML in MDX: `ds-raster` (Kartenraster), `ds-karte`, `ds-bereich` (Bereichsüberschrift mit Symbol),
`ds-schritte` (nummerierte Schritte), `ds-bildpaar` (zwei Abbildungen nebeneinander, am Handy untereinander), `ds-fuss`.

Starlight-Hinweisboxen (`:::note`, `:::caution`) bleiben nutzbar und werden optisch an die Kästen angeglichen.

## Schaltbilder

- Bestehende SVGs bleiben unverändert. Für die Dioden-Theorie neu (Generator `werkzeuge/schaltbilder.mjs`, Abschnitt
  „DESIGNSYSTEM-ENTWURF“):
  - `bruecke-positiv.svg`, `bruecke-negativ.svg` – Stromweg je Halbwelle farbig mit Richtungspfeilen, sperrende Dioden blass.
  - `glaettung-verlauf.svg` – berechneter Spannungsverlauf (ideale Dioden, τ = 67 ms, 50 Hz) mit Nachladen, Entladen und ΔU.
- Signalfarben über `--ds-signal-1/2`; auf Seiten ohne Designsystem greifen Ersatzfarben.

## Geprüft (22.11.2026)

- Entwurf: Startseite, Dioden-Theorie und -Quiz bei 360–1440 px, Hell/Dunkel, Tastatur.
- Nach dem Ausrollen: 26 Seiten aus allen Bereichen bei 360 px, 8 davon zusätzlich bei 768 und 1440 px – kein
  seitliches Überlaufen, keine Formelfehler; Kontrast aller Elemente in Hell und Dunkel ≥ 5,2 : 1;
  Navigation auf allen Seitentypen (Theorie-Unterordner, Grundlagen ohne Theorie, Fallbeispiele, Simulationen) richtig.
- Build und `node werkzeuge/pruefen.mjs`: 0 Probleme.

## Hinweise für neue Inhalte

- Neue Rechenbeispiele können den Baustein `Rechenbeispiel` (Angabe, Gegeben/Gesucht, Lösung, Ergebnis) verwenden;
  bestehende Beispiele nutzen weiter `<Stufe>` + `<Loesung>` und sehen im neuen Stil einheitlich aus.
- Wichtige Formeln in `<Kasten typ="formel" gilt="…">`, Merksätze in `<Kasten typ="merke">`.
- Lange Kartentitel: In `Themenkarte` stehen weiche Trennstellen für häufige Wortfugen (Operations-, Leistungs- …).
- Farben in Schaltbildern: Akzent (`--sl-color-accent`) ist jetzt Petrol – in Bildunterschriften „farbig“ statt „blau“ schreiben.

## Offene Möglichkeiten

- Startseite: bewusst schlichter Kopfbereich ohne Illustration; eine eigene technische Illustration wäre möglich.
- Seitenleiste: nur der aktive Eintrag ist hervorgehoben. Eine weitere Vereinfachung (z. B. alle Bereiche
  zugeklappt) wäre möglich, falls sie Schüler:innen zu lang erscheint.
- Bestehende Rechenbeispiele könnten schrittweise auf den Baustein `Rechenbeispiel` (mit Gegeben/Gesucht und
  hervorgehobenem Ergebnis) umgestellt werden – das ist inhaltliche Arbeit pro Aufgabe.
