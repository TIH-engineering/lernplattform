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

### Gliederung der Seitenleiste (Stand 22.11.2026)

- **Grundlagen der Elektrotechnik** – Schulbuchthemen ohne eigene Theorie (siehe unten).
- **Elektronik** – kein Lehrbuch, daher mit ausführlicher Theorieseite: Dioden, Transistoren, Operationsverstärker,
  Filter, Oszillatoren, Thermische Auslegung.
  Als Ergänzung am Ende: **Programmierung in C** (`programmierung`, Theorie in `theorie/`, Seite „Programmieraufgaben“ =
  `rechenbeispiele.mdx`, „Werkzeuge & Links“ = `literatur.mdx`). Nur C-Grundlagen für einfache Mikrocontroller-Programme
  (Beispiele ATmega328P) – laut Lehrer **abgeschlossen, nicht erweitern** (keine weiteren Sprachen/Vertiefungen).
  Auf der Startseite nur ein kurzer Hinweis, keine eigene Karte. Quelle: `Quellen/SOTE2` (Abgaben, WebUntis,
  Leistungsbeurteilung, Zusatzprüfungen nicht verwenden). C-Beispiele vor dem Veröffentlichen kompilieren (Visual Studio `cl`).
- **Energietechnik** – Drehstrom, Leistungselektronik (Theorie in Unterordner `theorie/`).
- **Projektmanagement** – Sonderaufbau: Übersicht, Theorie, **Fallbeispiele**, Quiz (Seite „Diplomarbeit planen“ auf Wunsch entfernt – gehört in den Unterricht)
  (keine Rechenbeispiele; eigener Eintrag in `astro.config.mjs`).
- **Mess- und Regelungstechnik (MTRS)** – kein eigenes Lehrbuch, daher mit Theorie (Quellen: `Quellen/MTRS/MTRS2`,
  Teile auch in GET1/GET2 – im Übersichtstext darauf verweisen): Grundlagen der Messtechnik (`messtechnik`), Messfehler,
  Signalkennwerte, Sensoren, Messwerke und Messbereiche, Messbrücken, Digitale Messtechnik. Ab dem 3. Jahrgang gibt es
  keine Unterlagen – diese Themen sind eigenständig nach `Quellen/MTRS - weitere Themen` (Grobplanung/Lehrplan) erstellt:
  Leistungs- und Impedanzmessung (`leistungsmessung`), Komparator und Frequenzmessung (`frequenzmessung`),
  Messverstärker und Schnittstellen (`messverstaerker`), A/D- und D/A-Umsetzer (`ad-da-umsetzer`), Aktuatoren und
  Regelungstechnik (beide mit Theorie im Unterordner `theorie/`). Was es schon gibt (OPV, Filter/Bode, Leistungselektronik,
  Drehstrom) nicht doppeln, sondern verlinken. Schaltbilder in `src/assets/mtrs/`.
- MTRS-Unterlagen mit Schülernamen (z. B. Referats-/Themenvergaben, Leistungsbeurteilung, WebUntis) nicht verwenden.
- Grenzfall Grundlagen/Elektronik: Was im Schulbuch GET1/GET2 steht → Grundlagen; Bauteile, Schaltungen und
  Auslegung (Halbleiter, OPV, aktive Filter, Oszillatoren, Wärme) → Elektronik. Wechselstrom-Praxisaufgaben aus
  `Quellen/HWE/Wechselstromtechnik` stehen bei den passenden Grundlagen-Themen.
- Testfragen und Fragenkataloge aus `Quellen/HWE/Aufbaulehrgang` sind die Orientierung für Umfang und Niveau der Theorie.

### Grundlagen der Elektrotechnik (1./2. Jahrgang)

- Schulbücher: **Grundlagen der Elektrotechnik 1 und 2** (GET1, GET2), Hans Deimel und Andreas Hasenzagl (digital über digi4school).
  Zusätzlich Übungsbuch **Lindner, Elektro-Aufgaben Bd. 1/2** (nur Aufgabennummern nennen).
- **Keine eigene Theorie** – pro Thema: Übersicht (Schulbuchkapitel, testrelevante Beispiel-/Aufgabennummern,
  „Das solltest du können“, kurze Formeltabelle), **Rechenbeispiele**, **Praxisbeispiele**, **Quiz**.
- 14 Themen in `src/content/docs/grundlagen/<thema>/`, Liste in `astro.config.mjs` (`grundlagenThemen`).
  Quizdateien: `src/content/quiz/grundlagen-<thema>.yaml`.
- GET1/GET2-Kapitel- und Abschnittsnummern sind nach den Inhaltsverzeichnissen eingetragen (22.11.2026), auch als
  „Im Schulbuch“-Kasten bei Messtechnik und Elektronik (GET2 Kap. 5–7). Elektronik bleibt trotzdem mit eigener Theorie.
- **Keine Inhalte aus dem Schulbuch oder dem Lindner übernehmen** (kein Text, keine Abbildungen, keine Aufgaben).
- Quelle für Stoffumfang und Niveau: `Quellen/HWE/` (Tests, Teststofflisten, Jahresplanung).
  Dort liegen auch **Notenlisten und Scans mit Schülerdaten – niemals lesen, verwenden oder veröffentlichen.**
  Aufgaben aus Tests nicht 1:1 übernehmen, sondern mit eigenen Zahlenwerten neu stellen.

### Quizzes

- Antworten werden beim Bauen **automatisch gemischt**; bei Fragen mit genau einer richtigen Antwort wird die
  richtige Position gleichmäßig auf 1./2./3./4. verteilt. In der YAML-Datei darf die richtige Antwort daher
  immer zuerst stehen. `mischen: false` hält die Reihenfolge fest (z. B. bei „alle oben genannten“).

## Grafiken

- Schaltpläne und Diagramme bevorzugt als **eigene SVGs** (DIN-/IEC-Symbole, `currentColor`
  verwenden, damit Hell- und Dunkelmodus funktionieren). Ablage: `src/assets/<thema>/`.
- **Nur eigene SVGs veröffentlichen** (Entscheidung des Lehrers, 21.11.2026). Auch aus den
  Unterlagen in `Quellen/` werden **keine Originalgrafiken** übernommen – weder die Grafiken
  von Prof. März (Genehmigung nur für nichtkommerzielle Nutzung, öffentliche Webseite unklar)
  noch Abbildungen aus Herstellerdatenblättern. Stattdessen selbst nachzeichnen oder
  auf das Datenblatt verlinken.
- Keine Abbildungen aus fremden Büchern oder Webseiten.
- Ausnahme Startseite (22.11.2026): Bilder aus dem Startseitenkonzept des Lehrers (`src/assets/startseite/*.webp`,
  Platzhalter in geringer Auflösung) in `src/components/Startseite.astro` (Hero, fünf Bereichskarten, „So lernst du“).
  Die Karten springen zu den Ankern der Themenliste darunter (`#grundlagen`, `#elektronik` …) – IDs nicht umbenennen.
  Die Themenliste ist kompakt (`ds-raster--kompakt`, ohne Schnelleinstiege); C steht als Leiste `ds-zusatz` unter Elektronik.

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
- In Markdown-Tabellen nie `|` in Formeln verwenden (bricht die Tabelle) → `\vert` bzw. `\lvert … \rvert`.
- Prüfskript nach dem Bauen: `node werkzeuge/pruefen.mjs` (KaTeX-Fehler, Links/Anker auch auf derselben Seite, relative
  Links, srcset, Verteilung der Quiz-Antworten mit Warnung). Quiz-Prüflogik liegt in `src/lib/quiz-pruefung.mjs`,
  Test ohne Build: `node werkzeuge/quiz-test.mjs`.
- Quiz-Schema (`src/content.config.ts`) lehnt leere Texte, doppelte Antwortoptionen und `loesung: 0` mit
  Prozent-Toleranz ab (dann `toleranzArt: absolut`).
- Messfehler-Statistik: 68/95/99,7 % nur für $\mu \pm k\sigma$; $\bar{x} \pm 2s$ heißt „grober Streubereich“ (keine
  95-%-Prognose); Vertrauensbereich nur für den Mittelwert. Theorie, Rechenbeispiele und Quiz gemeinsam ändern.
- GET1/GET2-Kapitelnummern nur mit Quelle eintragen, sonst „Kapitel über …“ ohne Nummer.
- Rechenergebnisse nachrechnen; LTspice-Netzlisten vor der Veröffentlichung simulieren
  (LTspice: `C:\Tools\LTspice_24_HTL_250909\LTspice.exe -b datei.cir`).
- Nach Änderungen an `src/content.config.ts` den Entwicklungsserver neu starten.
- Herstellerlinks: nur verifizierte Produkt-URLs, sonst Herstellerseite + Teilenummer nennen.

## Veröffentlichung

- Online: **https://tih-engineering.github.io/lernplattform/**
- Repository: https://github.com/TIH-engineering/lernplattform (öffentlich, Zweig `main`)
- Jeder Push auf `main` baut und veröffentlicht automatisch (`.github/workflows/veroeffentlichen.yml`,
  GitHub Pages mit Quelle „GitHub Actions“). Dauer ca. 1–2 Minuten.
- Commits mit der GitHub-Ersatzadresse (`246109830+TIH-engineering@users.noreply.github.com`,
  nur in diesem Repository eingestellt) – die private E-Mail-Adresse nie in Commits verwenden.
- Unterordner `/lernplattform`: Links in Inhalten mit `/…` werden automatisch ergänzt
  (`src/lib/basis-links.mjs`). Bei eigener Domain `SITE`/`BASIS` in `astro.config.mjs` anpassen.
- Vor jedem Push `npm run build` lokal ausführen; `Quellen/` bleibt per `.gitignore` draußen.

## Befehle

- `npm run dev` – lokale Vorschau auf http://localhost:4321
- `npm run build` – fertige Webseite in `dist/` erzeugen (inkl. Suchindex)
- `npm run preview` – gebaute Seite lokal ansehen

## Designsystem (seit 22.11.2026 auf der ganzen Seite)

- „Modern Technical Education“: `src/styles/ds.css` (global), Dokumentation `DESIGNSYSTEM.md`.
- Weg + Reiter je Thema kommen automatisch aus `src/components/Seitentitel.astro` (liest die Seitenleiste).
- Bausteine: `Zeichen` (Symbole), `Themenkarte`, `Kasten` (lernziele/merke/formel/achtung), `Rechenbeispiel`,
  `Netzsicherheit`, `Loesung`, `Stufe`, `Quiz`.
- Der Name `Symbol` ist für Komponenten tabu (kollidiert mit JavaScript-`Symbol` in MDX).
- In Bildunterschriften „farbig“ statt „blau“ (Akzentfarbe ist Petrol).

## Erweiterung 22.11.2026 (Transistoren, Kippstufen, Spektren, Magnetkreise, Praxis)

- Theorie von **Transistoren, Oszillatoren und Signalkennwerte** liegt jetzt im Unterordner `theorie/` (`index.mdx` = alte
  Seite, URL unverändert) mit Zusatzseiten: `grundschaltungen`, `differenzverstaerker`, `kippstufen`, `spektren`.
- Interaktive Fourier-Visualisierung: `src/components/FourierLabor.astro` (echte Fourier-Koeffizienten, kein Framework).
- `Kasten` hat einen Bereich `<span slot="gilt">…</span>` für Gültigkeitsangaben mit Formeln (statt `gilt="…"` mit `R_E`).
- Neue Rechenwerte wurden mit Python nachgerechnet, Transistorschaltungen mit LTspice (2N3904) gegengeprüft.
- Texte mit LaTeX nicht per Shell-Heredoc in Python-Strings schreiben (`\a` in `\approx` wird zum Steuerzeichen) –
  besser Datei schreiben und anhängen.
