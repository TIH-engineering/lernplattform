# Lernplattform Elektronik (HTL) – Projektregeln

Öffentliche Lernwebseite für HTL-Schüler:innen (15–19 Jahre) in Hardware-Entwicklung,
Mess- und Regelungstechnik. Gebaut mit **Astro Starlight**. Der Betreiber ist Lehrer und
Anfänger in Webentwicklung: Schritte immer in einfachen Worten erklären.

## Technik

- Framework: Astro + Starlight, Inhalte als `.md`/`.mdx` in `src/content/docs/`.
- Formeln: KaTeX (über `remark-math` + `rehype-katex`). Inline `$U = R \cdot I$`, abgesetzt `$$ … $$`.
- Oberfläche: Deutsch (`defaultLocale: 'root'`, `lang: 'de'`).
- Suche: Starlight-Standardsuche (Pagefind, läuft lokal ohne externe Dienste).
- **Keine Logins, kein Tracking, keine Cookies, keine externen Schriften/CDNs.**
  KaTeX-CSS und Schriften werden lokal mitgebaut. Keine Analytics, keine eingebetteten
  Drittanbieter-Inhalte (YouTube etc. nur als normaler Link).
- Quizzes: eigene Komponente `src/components/Quiz.astro` (reines HTML + kleines Skript,
  nichts wird gespeichert oder gesendet). Fragetypen:
  - Multiple Choice (eine oder mehrere richtige Antworten)
  - Zahleneingabe mit Toleranz (relativ in % oder absolut), Einheit angezeigt,
    Komma **und** Punkt als Dezimaltrennzeichen akzeptieren
  - Nach **jeder** Antwort eine Erklärung anzeigen.

## Notation (DIN EN 60027 / DIN 1304)

- Großbuchstaben für Gleich- und Effektivwerte ($U$, $I$, $P$), Kleinbuchstaben für
  Augenblickswerte ($u(t)$, $i(t)$); Scheitelwerte mit Dach ($\hat{u}$).
- Formelzeichen kursiv, Indizes aufrecht: `U_\mathrm{CE}`, `I_\mathrm{B}`, `U_\mathrm{d}`.
- Einheiten aufrecht mit Abstand zur Zahl: `10\,\mathrm{k\Omega}`, `230\,\mathrm{V}`.
- **Dezimalkomma** im Text und in Formeln (in KaTeX `{,}` schreiben: `3{,}3\,\mathrm{V}`).
- Größengleichungen, Einheiten erst im Ergebnis bzw. bei Zahlenwerten.
- Ansprache: **du**, gendern mit Doppelpunkt (Schüler:innen).

## Jahrgänge

- Keine Jahrgangsangaben auf den Seiten.

## Schwierigkeitsstufen

Drei Stufen für Rechenbeispiele und Quizfragen, als farbiges Abzeichen (Starlight `Badge`):

| Stufe | Badge-Variante | Bedeutung |
| --- | --- | --- |
| Grundlagen | `success` (grün) | Formel direkt anwenden |
| Standard | `caution` (gelb) | mehrere Schritte, typische Prüfungsaufgabe |
| Vertiefung | `danger` (rot) | Transfer, Dimensionierung, Sonderfälle |

## Aufbau eines Themenbereichs

Jeder Themenbereich ist ein Ordner in `src/content/docs/<thema>/` mit eigenen Unterseiten:

1. `index.mdx` – Übersicht: Worum geht's, Lernziele, Wegweiser zu den Teilen
2. `theorie.mdx` – Theorie
3. `rechenbeispiele.mdx` – Rechenbeispiele
4. `praxisbeispiele.mdx` – Praxisbeispiele (Schaltungen, Bauteile, Messungen)
5. `quiz.mdx` – Quiz
6. optional `simulationen.mdx` – Simulationen (z. B. LTspice, Falstad – nur als Link/Download)
7. optional `literatur.mdx` – Weiterführende Literatur und Links

Bei sehr umfangreichen Themen darf Theorie in mehrere Seiten (Unterordner) geteilt werden.
Noch leere Themenbereiche bekommen in der Seitenleiste das Abzeichen **„in Arbeit“**
und eine Platzhalterseite.

### Rechenbeispiele

Schema: **Angabe** (sichtbar) → **Gegeben / Gesucht** → **Lösung** Schritt für Schritt
in einem aufklappbaren `<details>`-Block („Lösung anzeigen“). Schwierigkeits-Badge im Titel.

### Grundlagen der Elektrotechnik (1./2. Jahrgang)

- Nur **Praxisbeispiele** und **Quiz**, jeweils mit Verweis auf das Schulbuch
  (Kapitelangabe). Buchtitel ist noch offen → Platzhalter „Schulbuch, Kapitel …“.
- **Keine Inhalte aus dem Schulbuch übernehmen** (kein Text, keine Abbildungen, keine Aufgaben).

## Grafiken

- Schaltpläne und Diagramme bevorzugt als **eigene SVGs** (DIN-/IEC-Symbole, `currentColor`
  verwenden, damit Hell- und Dunkelmodus funktionieren). Ablage: `src/assets/<thema>/`.
- **Nur eigene SVGs veröffentlichen** (Entscheidung des Lehrers, 21.11.2026). Auch aus den
  Unterlagen in `Quellen/` werden **keine Originalgrafiken** übernommen – weder die Grafiken
  von Prof. März (Genehmigung nur für nichtkommerzielle Nutzung, öffentliche Webseite unklar)
  noch Abbildungen aus Herstellerdatenblättern. Stattdessen selbst nachzeichnen oder
  auf das Datenblatt verlinken.
- Keine Abbildungen aus fremden Büchern oder Webseiten.

## Quellen

- Unterlagen des Lehrers liegen in `Quellen/` (wird **nicht** veröffentlicht).
- Inhalte daraus in eigenen Worten aufbereiten, Notation an obige Regeln anpassen,
  Rechenergebnisse nachrechnen.

## Wo liegt was?

| Was | Wo |
| --- | --- |
| Seiten | `src/content/docs/<thema>/…mdx` |
| Navigation (Seitenleiste) | `astro.config.mjs` → `thema(...)` für fertige, `leer(...)` für „in Arbeit“ |
| Quizfragen | `src/content/quiz/<thema>.yaml` (Aufbau steht oben in der Datei), eingebunden mit `<Quiz id="<thema>" />` |
| Bausteine | `src/components/`: `Quiz`, `Stufe` (Badge), `Loesung` (aufklappbar), `Abbildung` (Bild + Unterschrift) |
| Schaltbilder | `werkzeuge/schaltbilder.mjs` erzeugt `src/assets/<thema>/*.svg` → `node werkzeuge/schaltbilder.mjs` |
| Downloads (z. B. LTspice) | `public/downloads/<thema>/` |
| Deutsche Suchtexte | `src/content/i18n/de.json` |

- YAML-Quiz: Zahlen in `loesung` mit **Punkt** schreiben; Texte mit Formeln in `'…'` oder als `>-`-Block.
- Rechenergebnisse nachrechnen; LTspice-Netzlisten vor der Veröffentlichung simulieren
  (LTspice: `C:\Tools\LTspice_24_HTL_250909\LTspice.exe -b datei.cir`).
- Nach Änderungen an `src/content.config.ts` den Entwicklungsserver neu starten.
- Herstellerlinks: nur verifizierte Produkt-URLs, sonst Herstellerseite + Teilenummer nennen.

## Befehle

- `npm run dev` – lokale Vorschau auf http://localhost:4321
- `npm run build` – fertige Webseite in `dist/` erzeugen (inkl. Suchindex)
- `npm run preview` – gebaute Seite lokal ansehen
