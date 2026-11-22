// Prüflogik des Quiz – reine Funktionen ohne Browser, damit man sie testen kann
// (Test: node werkzeuge/quiz-test.mjs). Verwendet von src/components/Quiz.astro.

/**
 * Liest eine Zahl mit Dezimalkomma oder -punkt, z. B. „2,5“, „2.5“, „4,7e-3“, „−3“, „1 200“.
 * Gibt { wert } zurück oder { grund } mit einem Hinweis, warum die Eingabe nicht gelesen werden kann.
 */
export function leseZahl(text) {
	const roh = String(text).trim();
	if (roh === '') return { grund: 'leer' };
	const t = roh.replace(/\s/g, '').replace(/[−–]/g, '-');
	const komma = (t.match(/,/g) || []).length;
	const punkt = (t.match(/\./g) || []).length;
	if (komma + punkt > 1) return { grund: 'trenner' };
	if (/[a-df-zµΩ%°]/i.test(t.replace(/e[-+]?\d+$/i, ''))) return { grund: 'einheit' };
	const n = t.replace(',', '.');
	if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(n)) return { grund: 'format' };
	return { wert: Number(n) };
}

/** Hilfetext zu einem Lesefehler von leseZahl. */
export function hinweisZuGrund(grund) {
	switch (grund) {
		case 'leer':
			return 'Bitte gib zuerst eine Zahl ein (z. B. 2,5).';
		case 'trenner':
			return 'Bitte nur ein Dezimalzeichen und keine Tausenderpunkte verwenden – z. B. 1234,5 statt 1.234,5.';
		case 'einheit':
			return 'Bitte nur die Zahl eingeben – die Einheit steht schon neben dem Feld. Zehnerpotenzen gehen so: 4,7e-3.';
		default:
			return 'Diese Eingabe ist keine Zahl. Beispiele: 2,5 oder 2.5 oder 4,7e-3.';
	}
}

/** Erlaubte Abweichung: relativ in % vom Sollwert oder absolut. */
export function erlaubteAbweichung(loesung, toleranz, art) {
	return art === 'absolut' ? toleranz : (Math.abs(loesung) * toleranz) / 100;
}

/** true, wenn der eingegebene Wert innerhalb der Toleranz liegt. */
export function zahlRichtig(wert, loesung, toleranz, art) {
	const erlaubt = erlaubteAbweichung(loesung, toleranz, art);
	// kleiner Zuschlag gegen Rundungsfehler der Gleitkommarechnung
	return Math.abs(wert - loesung) <= erlaubt * (1 + 1e-9) + 1e-12;
}

/** Multiple Choice: nur genau die richtige Auswahl zählt. null = noch nichts gewählt. */
export function auswahlRichtig(gewaehlt, richtig) {
	if (gewaehlt.length === 0) return null;
	return gewaehlt.length === richtig.length && gewaehlt.every((g) => richtig.includes(g));
}
