// Erzeugt die Schaltpläne und Diagramme als SVG-Dateien.
// Aufruf:  node werkzeuge/schaltbilder.mjs
// Ergebnis: src/assets/leistungselektronik/*.svg
//
// Alle Linien verwenden „currentColor“ – dadurch passen die Bilder automatisch
// zum hellen und dunklen Modus der Webseite. Hervorhebungen nutzen die Akzentfarbe.
import { mkdirSync, writeFileSync } from 'node:fs';

const ZIEL = new URL('../src/assets/leistungselektronik/', import.meta.url);
mkdirSync(ZIEL, { recursive: true });

const AKZENT = 'var(--sl-color-accent, #3b82f6)';

// ---------- Grundelemente ----------
const p = (pts) => pts.map((q) => q.join(',')).join(' ');
const draht = (...pts) => `<polyline points="${p(pts)}"/>`;
const punkt = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor" stroke="none"/>`;
const strich = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;

/** Formelzeichen mit Index, z. B. sym('U','e') → U_e (Zeichen kursiv, Index aufrecht) */
const sym = (haupt, index = '', kursiv = true) =>
	`<tspan${kursiv ? ' font-style="italic"' : ''}>${haupt}</tspan>` +
	(index ? `<tspan font-size="0.72em" dy="0.35em">${index}</tspan><tspan dy="-0.35em"></tspan>` : '');

/** Beschriftung */
const text = (x, y, inhalt, anker = 'middle', extra = '') =>
	`<text x="${x}" y="${y}" text-anchor="${anker}"${extra.includes('fill=') ? '' : ' fill="currentColor"'} stroke="none" ${extra}>${inhalt}</text>`;

/** Pfeilspitze bei (x2,y2), Richtung von (x1,y1) */
function spitze(x1, y1, x2, y2, farbe = 'currentColor') {
	const w = Math.atan2(y2 - y1, x2 - x1);
	const l = 9, b = 4;
	const a = [x2 - l * Math.cos(w) + b * Math.sin(w), y2 - l * Math.sin(w) - b * Math.cos(w)];
	const c = [x2 - l * Math.cos(w) - b * Math.sin(w), y2 - l * Math.sin(w) + b * Math.cos(w)];
	return `<polygon points="${p([[x2, y2], a, c])}" fill="${farbe}" stroke="none"/>`;
}
/** Zählpfeil (Spannung, Strom) */
const pfeil = (x1, y1, x2, y2, farbe = 'currentColor') =>
	strich(x1, y1, x2, y2, farbe === 'currentColor' ? '' : `stroke="${farbe}"`) + spitze(x1, y1, x2, y2, farbe);
/** Maßpfeil mit zwei Spitzen */
const mass = (x1, y1, x2, y2) =>
	strich(x1, y1, x2, y2, 'stroke-width="1.5"') + spitze(x2, y2, x1, y1) + spitze(x1, y1, x2, y2);
/** Stromrichtungs-Spitze auf einem Draht */
const stromspitze = (x, y, richtung) => {
	const d = { r: [-1, 0], l: [1, 0], u: [0, -1], o: [0, 1] }[richtung];
	return spitze(x + d[0] * 10, y + d[1] * 10, x, y);
};

/** Zweipol zwischen zwei achsparallelen Punkten. körper(): Zeichnung von x=0..laenge auf y=0 */
function zweipol(x1, y1, x2, y2, laenge, koerper) {
	const L = Math.hypot(x2 - x1, y2 - y1);
	const winkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
	const a = (L - laenge) / 2;
	return (
		`<g transform="translate(${x1},${y1}) rotate(${winkel})">` +
		strich(0, 0, a, 0) +
		strich(a + laenge, 0, L, 0) +
		`<g transform="translate(${a},0)">${koerper}</g></g>`
	);
}
// Bauteile (IEC 60617 / DIN EN 60617)
const widerstand = (x1, y1, x2, y2) => zweipol(x1, y1, x2, y2, 40, `<rect x="0" y="-7" width="40" height="14"/>`);
const spule = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 48, `<path d="M0,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0"/>`);
const kondensator = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 10, strich(0, -14, 0, 14, 'stroke-width="3"') + strich(10, -14, 10, 14, 'stroke-width="3"'));
/** Diode: Anode bei (x1,y1), Kathode bei (x2,y2) */
const diode = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 22, `<polygon points="0,-11 0,11 20,0"/>` + strich(20, -11, 20, 11) + strich(20, 0, 22, 0));
const schalter = (x1, y1, x2, y2) =>
	zweipol(
		x1, y1, x2, y2, 40,
		`<circle cx="0" cy="0" r="2.5"/><circle cx="40" cy="0" r="2.5"/>` + strich(2, -1, 38, -16),
	);
/** Spannungsquelle (Kreis mit Linie in Leitungsrichtung) */
const quelle = (x1, y1, x2, y2) => zweipol(x1, y1, x2, y2, 36, `<circle cx="18" cy="0" r="18"/>` + strich(0, 0, 36, 0));

/** Masse-Symbol */
const masse = (x, y) =>
	strich(x, y, x, y + 8) + strich(x - 12, y + 8, x + 12, y + 8, 'stroke-width="2.5"');

/** Motor (senkrecht), Mittelpunkt (x,y) */
const motor = (x, y) => `<circle cx="${x}" cy="${y}" r="20"/>` + text(x, y + 6, 'M', 'middle', 'font-weight="600"');

/** N-Kanal-MOSFET (Anreicherung) mit Body-Diode. Mitte (x,y): Drain (x,y-30), Source (x,y+30), Gate (x-30,y) */
function nmos(x, y, { bodyDiode = true } = {}) {
	let s = '';
	s += strich(x - 30, y, x - 15, y);
	s += strich(x - 15, y - 12, x - 15, y + 12);
	s += strich(x - 8, y - 14, x - 8, y - 6, 'stroke-width="2.5"');
	s += strich(x - 8, y - 4, x - 8, y + 4, 'stroke-width="2.5"');
	s += strich(x - 8, y + 6, x - 8, y + 14, 'stroke-width="2.5"');
	s += draht([x - 8, y - 10], [x, y - 10], [x, y - 30]);
	s += draht([x - 8, y + 10], [x, y + 10], [x, y + 30]);
	s += draht([x - 8, y], [x, y], [x, y + 10]);
	s += `<polygon points="${p([[x - 8, y], [x - 2, y - 3.5], [x - 2, y + 3.5]])}" fill="currentColor" stroke="none"/>`;
	if (bodyDiode) {
		s += draht([x, y - 22], [x + 16, y - 22], [x + 16, y - 6]);
		s += draht([x, y + 22], [x + 16, y + 22], [x + 16, y + 6]);
		s += `<polygon points="${p([[x + 9, y + 6], [x + 23, y + 6], [x + 16, y - 6]])}"/>`;
		s += strich(x + 9, y - 6, x + 23, y - 6);
		s += punkt(x, y - 22) + punkt(x, y + 22);
	}
	return s;
}

/** SVG-Datei schreiben */
function speichere(name, breite, hoehe, titel, inhalt) {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" ` +
		`fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
		`font-family="inherit" font-size="15" role="img" aria-label="${titel}" class="schaltbild">` +
		`<title>${titel}</title>${inhalt}</svg>\n`;
	// Name ohne Ordner → leistungselektronik/, sonst z. B. 'grundlagen/kirchhoff.svg' → src/assets/grundlagen/
	const ziel = name.includes('/') ? new URL('../src/assets/' + name, import.meta.url) : new URL(name, ZIEL);
	mkdirSync(new URL('.', ziel), { recursive: true });
	writeFileSync(ziel, svg);
	console.log('geschrieben:', name);
}

// ---------- Ausgangsseite (C, R_L, U_a) – von mehreren Wandlern genutzt ----------
function ausgang(xc, xr, oben, unten) {
	return (
		kondensator(xc, oben, xc, unten) + text(xc + 22, (oben + unten) / 2 + 5, sym('C', 'a'), 'start') +
		widerstand(xr, oben, xr, unten) + text(xr + 14, (oben + unten) / 2 + 5, sym('R', 'L'), 'start') +
		pfeil(xr + 52, oben + 20, xr + 52, unten - 20) + text(xr + 60, (oben + unten) / 2 + 5, sym('U', 'a'), 'start') +
		punkt(xc, oben) + punkt(xc, unten)
	);
}
function eingang(x, oben, unten) {
	return (
		quelle(x, unten, x, oben) + text(x + 8, oben + 32, '+', 'start') +
		pfeil(x - 30, oben + 20, x - 30, unten - 20) + text(x - 38, (oben + unten) / 2 + 5, sym('U', 'e'), 'end')
	);
}

// ---------- 1) Tiefsetzsteller ----------
{
	const o = 40, u = 180;
	speichere('buck.svg', 600, 210, 'Schaltplan Tiefsetzsteller (Buck)',
		eingang(70, o, u) +
		draht([70, o], [110, o]) + schalter(110, o, 170, o) + text(140, o - 22, sym('S')) +
		draht([170, o], [230, o]) + punkt(230, o) +
		diode(230, u, 230, o) + text(250, (o + u) / 2 + 5, sym('D'), 'start') +
		spule(230, o, 350, o) + text(290, o - 16, sym('L')) +
		stromspitze(375, o, 'r') + text(372, o - 10, sym('i', 'L')) +
		draht([350, o], [490, o]) + draht([70, u], [490, u]) + punkt(230, u) +
		ausgang(400, 490, o, u),
	);
}

// ---------- 2) Hochsetzsteller ----------
{
	const o = 40, u = 180;
	speichere('boost.svg', 600, 210, 'Schaltplan Hochsetzsteller (Boost)',
		eingang(70, o, u) +
		draht([70, o], [100, o]) + spule(100, o, 200, o) + text(150, o - 16, sym('L')) +
		stromspitze(90, o, 'r') + text(88, o - 10, sym('i', 'L')) +
		draht([200, o], [230, o]) + punkt(230, o) +
		schalter(230, u, 230, o) + text(250, (o + u) / 2 + 5, sym('S'), 'start') +
		diode(230, o, 330, o) + text(280, o - 18, sym('D')) +
		draht([330, o], [490, o]) + draht([70, u], [490, u]) + punkt(230, u) +
		ausgang(400, 490, o, u),
	);
}

// ---------- 3) Invertierender Buck-Boost ----------
{
	const o = 40, u = 180;
	speichere('buck-boost.svg', 600, 210, 'Schaltplan invertierender Buck-Boost-Wandler',
		eingang(70, o, u) +
		draht([70, o], [110, o]) + schalter(110, o, 170, o) + text(140, o - 22, sym('S')) +
		draht([170, o], [230, o]) + punkt(230, o) +
		spule(230, o, 230, u) + text(250, (o + u) / 2 + 5, sym('L'), 'start') +
		diode(340, o, 240, o) + draht([230, o], [240, o]) + text(290, o - 18, sym('D')) +
		draht([340, o], [490, o]) + draht([70, u], [490, u]) + punkt(230, u) +
		ausgang(400, 490, o, u) +
		text(545, u + 25, 'Achtung: U<tspan font-size="0.72em" dy="0.35em">a</tspan><tspan dy="-0.35em"> ist negativ!</tspan>', 'end', 'font-size="13"'),
	);
}

// ---------- 4) Halbbrücke mit Gleichstrommotor ----------
{
	const o = 40, u = 260, x = 220;
	speichere('halbbruecke.svg', 420, 290, 'Halbbrücke aus zwei N-Kanal-MOSFETs mit Gleichstrommotor',
		quelle(40, u, 40, o) + text(48, o + 32, '+', 'start') + text(66, (o + u) / 2 + 5, sym('U', 'B'), 'start') +
		draht([40, o], [x, o], [x, 70]) +
		nmos(x, 100) + text(x + 30, 105, sym('Q', '1'), 'start') +
		draht([x, 130], [x, 170]) + punkt(x, 150) +
		nmos(x, 200) + text(x + 30, 205, sym('Q', '2'), 'start') +
		draht([x, 230], [x, u]) +
		`<rect x="110" y="88" width="64" height="24" rx="3"/>` + text(142, 105, 'Treiber', 'middle', 'font-size="12"') +
		strich(174, 100, 190, 100) +
		`<rect x="110" y="188" width="64" height="24" rx="3"/>` + text(142, 205, 'Treiber', 'middle', 'font-size="12"') +
		strich(174, 200, 190, 200) +
		draht([x, 150], [350, 150], [350, 180]) + text(300, 142, 'SW') +
		motor(350, 200) + draht([350, 220], [350, u]) +
		draht([40, u], [350, u]) + punkt(x, u),
	);
}

// ---------- 5) H-Brücke ----------
{
	const o = 40, u = 260, xl = 150, xr = 330;
	const akzent = `stroke="${AKZENT}" stroke-width="3" stroke-dasharray="7 5"`;
	speichere('h-bruecke.svg', 440, 300, 'H-Brücke (Vollbrücke) mit vier MOSFETs, Strompfad für Vorwärtsbetrieb hervorgehoben',
		quelle(40, u, 40, o) + text(48, o + 32, '+', 'start') + text(66, (o + u) / 2 + 5, sym('U', 'B'), 'start') +
		draht([40, o], [xr, o]) + draht([40, u], [xr, u]) + punkt(xl, o) + punkt(xl, u) +
		draht([xl, o], [xl, 70]) + nmos(xl, 100) + text(xl + 28, 92, sym('S', '1'), 'start') +
		draht([xl, 130], [xl, 170]) + nmos(xl, 200) + text(xl + 28, 192, sym('S', '2'), 'start') + draht([xl, 230], [xl, u]) +
		draht([xr, o], [xr, 70]) + nmos(xr, 100) + text(xr + 28, 92, sym('S', '3'), 'start') +
		draht([xr, 130], [xr, 170]) + nmos(xr, 200) + text(xr + 28, 192, sym('S', '4'), 'start') + draht([xr, 230], [xr, u]) +
		punkt(xl, 150) + punkt(xr, 150) +
		draht([xl, 150], [220, 150]) + `<circle cx="240" cy="150" r="20"/>` + text(240, 156, 'M', 'middle', 'font-weight="600"') +
		draht([260, 150], [xr, 150]) +
		// Strompfad vorwärts: S1 → Motor → S4
		`<polyline points="${p([[60, o + 10], [xl - 40, o + 10], [xl - 40, 140], [xr + 48, 140], [xr + 48, u - 10], [60, u - 10]])}" ${akzent}/>` +
		spitze(220, 140, 228, 140, AKZENT) +
		text(240, 290, 'Vorwärts: S1 und S4 EIN', 'middle', `font-size="13" fill="${AKZENT}"`),
	);
}

// ---------- 6) Zeitverläufe beim Tiefsetzsteller ----------
{
	const x0 = 70, T = 160, tE = 64; // D = 0,4
	const per = [0, 1, 2];
	let uSW = [[x0, 40]];
	for (const k of per) {
		const a = x0 + k * T;
		uSW.push([a + tE, 40], [a + tE, 100], [a + T, 100]);
		if (k < 2) uSW.push([a + T, 40]);
	}
	let iL = [];
	for (const k of per) {
		const a = x0 + k * T;
		iL.push([a, 205], [a + tE, 165]);
	}
	iL.push([x0 + 3 * T, 205]);
	const flaechen = per
		.map((k) => `<rect x="${x0 + k * T}" y="28" width="${tE}" height="202" fill="${AKZENT}" fill-opacity="0.12" stroke="none"/>`)
		.join('');
	speichere('buck-verlaeufe.svg', 640, 270, 'Zeitverläufe Schaltknotenspannung und Drosselstrom beim Tiefsetzsteller',
		flaechen +
		pfeil(x0, 108, x0, 20) + pfeil(x0, 100, x0 + 3 * T + 30, 100) +
		text(x0 - 8, 28, sym('u', 'SW'), 'end') + text(x0 - 8, 45, sym('U', 'e'), 'end', 'font-size="13"') +
		text(x0 - 8, 104, '0', 'end', 'font-size="13"') + text(x0 + 3 * T + 30, 118, sym('t'), 'end') +
		`<polyline points="${p(uSW)}" stroke-width="2.5"/>` +
		pfeil(x0, 235, x0, 140) + pfeil(x0, 230, x0 + 3 * T + 30, 230) +
		text(x0 - 8, 150, sym('i', 'L'), 'end') + text(x0 + 3 * T + 30, 250, sym('t'), 'end') +
		`<polyline points="${p(iL)}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		strich(x0, 185, x0 + 3 * T, 185, 'stroke-dasharray="5 4" stroke-width="1.5"') +
		text(x0 - 8, 189, sym('I', 'a'), 'end', 'font-size="13"') +
		strich(x0 + 2 * T + tE, 165, x0 + 3 * T + 60, 165, 'stroke-dasharray="3 3" stroke-width="1"') +
		strich(x0 + 3 * T, 205, x0 + 3 * T + 60, 205, 'stroke-dasharray="3 3" stroke-width="1"') +
		mass(x0 + 3 * T + 50, 165, x0 + 3 * T + 50, 205) + text(x0 + 3 * T + 60, 190, 'Δ' + sym('I', 'L', true), 'start') +
		mass(x0, 118, x0 + tE, 118) + text(x0 + tE / 2, 135, sym('t', 'ein') + ' = ' + sym('D') + '·' + sym('T'), 'middle', 'font-size="13"') +
		mass(x0 + T, 118, x0 + 2 * T, 118) + text(x0 + 1.5 * T, 135, sym('T') + ' = 1/' + sym('f', 's'), 'middle', 'font-size="13"'),
	);
}

// ---------- 7) Schaltverluste (Dreiecksnäherung) ----------
{
	const b = 170, top = 60;
	const verlauf = [[50, b], [70, b], [110, top], [150, b - 10], [300, b - 10], [350, top], [400, b], [470, b]];
	speichere('schaltverluste.svg', 520, 230, 'Verlustleistung im MOSFET beim Ein- und Ausschalten (Dreiecksnäherung)',
		`<polygon points="${p([[70, b], [110, top], [150, b]])}" fill="${AKZENT}" fill-opacity="0.2" stroke="none"/>` +
		`<polygon points="${p([[300, b], [350, top], [400, b]])}" fill="${AKZENT}" fill-opacity="0.2" stroke="none"/>` +
		pfeil(50, b + 8, 50, 30) + pfeil(50, b, 490, b) + text(42, 38, sym('p') + '(' + sym('t') + ')', 'end') +
		text(490, b + 20, sym('t'), 'end') +
		`<polyline points="${p(verlauf)}" stroke-width="2.5"/>` +
		strich(50, top, 350, top, 'stroke-dasharray="4 4" stroke-width="1"') +
		text(56, top - 14, sym('U', 'DS') + '·' + sym('I', 'D'), 'start', 'font-size="13"') +
		text(110, 140, sym('E', 'ein')) + text(350, 140, sym('E', 'aus')) +
		text(225, b - 18, 'Leitphase: ' + sym('I') + '²·' + sym('R', 'DS(on)'), 'middle', 'font-size="13"') +
		mass(70, b + 18, 150, b + 18) + text(110, b + 38, sym('t', 'ein')) +
		mass(300, b + 18, 400, b + 18) + text(350, b + 38, sym('t', 'aus')),
	);
}

// ---------- 8) Sperrwandler ----------
{
	const o = 40, u = 210, s = 140;
	speichere('sperrwandler.svg', 560, 250, 'Grundschaltung Sperrwandler (Flyback) mit galvanischer Trennung',
		quelle(40, u, 40, o) + text(48, o + 32, '+', 'start') + text(66, (o + u) / 2 + 5, sym('U', 'e'), 'start') +
		draht([40, o], [140, o]) + spule(140, o, 140, 130) + text(128, 90, sym('N', '1'), 'end') +
		draht([140, 130], [140, 150]) + nmos(140, 180, { bodyDiode: false }) + text(100, 196, sym('T'), 'end') +
		draht([140, u], [40, u]) +
		strich(172, 45, 172, 125, 'stroke-width="2.5"') + strich(178, 45, 178, 125, 'stroke-width="2.5"') +
		punkt(156, 50) + punkt(194, 122) +
		spule(210, 130, 210, o) + text(222, 90, sym('N', '2'), 'start') +
		draht([210, o], [240, o]) + diode(240, o, 320, o) + text(280, o - 18, sym('D')) +
		draht([320, o], [450, o]) + draht([210, 130], [450, 130]) +
		ausgang(360, 450, o, 130) +
		strich(175, 140, 175, 240, `stroke-dasharray="6 5" stroke="${AKZENT}"`) +
		text(185, 235, 'galvanische Trennung', 'start', `font-size="12" fill="${AKZENT}"`),
	);
}

// ---------- 9) Kommutierungszelle beim Buck ----------
{
	const o = 40, u = 180;
	speichere('kommutierungszelle.svg', 600, 230, 'Kommutierungszelle (heißer Pfad) beim Tiefsetzsteller',
		eingang(70, o, u) + draht([70, o], [140, o]) + draht([70, u], [490, u]) +
		kondensator(140, o, 140, u) + text(160, (o + u) / 2 + 5, sym('C', 'e'), 'start') + punkt(140, o) + punkt(140, u) +
		draht([140, o], [170, o]) + schalter(170, o, 230, o) + text(200, o - 22, sym('S')) +
		draht([230, o], [270, o]) + punkt(270, o) + punkt(270, u) +
		diode(270, u, 270, o) + text(288, (o + u) / 2 + 5, sym('D'), 'start') +
		spule(270, o, 370, o) + text(320, o - 16, sym('L')) + draht([370, o], [490, o]) +
		ausgang(410, 490, o, u) +
		`<rect x="128" y="28" width="156" height="164" rx="12" fill="${AKZENT}" fill-opacity="0.12" stroke="${AKZENT}" stroke-dasharray="7 5"/>` +
		text(206, 214, 'heißer Pfad: so klein wie möglich!', 'middle', `font-size="13" fill="${AKZENT}"`),
	);
}

// ---------- 10) Ersatzschaltbild Kondensator ----------
{
	const y = 50;
	speichere('kondensator-esb.svg', 380, 100, 'Ersatzschaltbild eines realen Kondensators mit ESR und ESL',
		`<circle cx="30" cy="${y}" r="4"/>` + draht([34, y], [60, y]) +
		widerstand(60, y, 140, y) + text(100, y - 16, 'ESR') +
		spule(140, y, 240, y) + text(190, y - 16, 'ESL') +
		kondensator(240, y, 300, y) + text(270, y - 22, sym('C')) +
		draht([300, y], [346, y]) + `<circle cx="350" cy="${y}" r="4"/>` +
		text(190, 90, 'alle drei wirken in Reihe', 'middle', 'font-size="12"'),
	);
}

// ---------- 11) Linearregler vs. Schaltregler (Blockbild) ----------
{
	const box = (x, y, b, h, inhalt) =>
		`<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="4"/>` + text(x + b / 2, y + h / 2 + 5, inhalt, 'middle', 'font-size="13"');
	speichere('linear-vs-schalt.svg', 560, 215, 'Vergleich Linearregler und Schaltwandler als Blockbild',
		text(20, 30, 'Linearregler', 'start', 'font-weight="600"') +
		text(20, 70, '12 V', 'start') + pfeil(62, 65, 120, 65) + box(120, 45, 110, 40, 'Längsregler') + pfeil(230, 65, 290, 65) +
		text(298, 70, '3,3 V', 'start') +
		pfeil(175, 95, 175, 120, '#ef4444') + text(185, 115, 'Wärme: (12 − 3,3) V · I', 'start', 'font-size="12"') +
		text(20, 150, 'Schaltwandler', 'start', 'font-weight="600"') +
		text(20, 185, '12 V', 'start') + pfeil(62, 180, 110, 180) + box(110, 160, 90, 40, 'Schalter') +
		pfeil(200, 180, 240, 180) + box(240, 160, 90, 40, 'L + C') + pfeil(330, 180, 380, 180) + text(388, 185, '3,3 V', 'start') +
		text(155, 155, 'PWM', 'middle', 'font-size="12"'),
	);
}

// =====================================================================
// GRUNDLAGEN DER ELEKTROTECHNIK  →  src/assets/grundlagen/
// =====================================================================

/** Wechselspannungsquelle (Kreis mit Sinus), senkrecht zwischen oben und unten */
const wquelle = (x, oben, unten) => {
	const m = (oben + unten) / 2;
	return strich(x, oben, x, m - 18) + strich(x, m + 18, x, unten) + `<circle cx="${x}" cy="${m}" r="18"/>` +
		`<path d="M${x - 11},${m} q5.5,-12 11,0 t11,0"/>`;
};
/** Gleichspannungsquelle senkrecht (+ oben) mit Zählpfeil und Beschriftung */
function gquelle(x, oben, unten, name, index, seite = 'links') {
	const m = (oben + unten) / 2;
	const px = seite === 'links' ? x - 32 : x + 32;
	return quelle(x, unten, x, oben) + text(x + 8, oben + 30, '+', 'start') +
		pfeil(px, m - 30, px, m + 30) +
		text(seite === 'links' ? px - 8 : px + 8, m + 5, sym(name, index), seite === 'links' ? 'end' : 'start');
}
/** Bauteil-Beschriftung neben senkrechtem Bauteil */
const neben = (x, y, name, index, seite = 'rechts') =>
	text(seite === 'rechts' ? x + 16 : x - 16, y + 5, sym(name, index), seite === 'rechts' ? 'start' : 'end');
/** Beschriftung über waagrechtem Bauteil */
const ueber = (x, y, name, index) => text(x, y - 14, sym(name, index));

// ---------- G1) Zwei Quellen – Kirchhoff ----------
{
	const o = 40, u = 200;
	speichere('grundlagen/kirchhoff.svg', 520, 240, 'Netzwerk mit zwei Spannungsquellen und drei Widerständen',
		gquelle(70, o, u, 'U', 'q1', 'links') +
		draht([70, o], [100, o]) + widerstand(100, o, 180, o) + ueber(140, o, 'R', '1') +
		draht([180, o], [260, o]) + stromspitze(215, o, 'r') + text(212, o - 10, sym('I', '1')) +
		punkt(260, o) + widerstand(260, o, 260, u) + neben(260, 120, 'R', '3', 'links') +
		stromspitze(260, 75, 'u') + text(272, 80, sym('I', '3'), 'start') +
		pfeil(292, 90, 292, 150) + text(300, 125, sym('U', '3'), 'start') +
		draht([260, o], [340, o]) + stromspitze(305, o, 'l') + text(308, o - 10, sym('I', '2')) +
		widerstand(340, o, 420, o) + ueber(380, o, 'R', '2') + draht([420, o], [450, o]) +
		gquelle(450, o, u, 'U', 'q2', 'rechts') +
		draht([70, u], [450, u]) + punkt(260, u),
	);
}

// ---------- G2) Brückenschaltung ----------
{
	const A = [250, 40], B = [250, 260], C = [150, 150], D = [350, 150];
	speichere('grundlagen/bruecke.svg', 470, 300, 'Brückenschaltung mit fünf Widerständen zwischen den Punkten A, B, C und D',
		gquelle(50, 40, 260, 'U', '', 'rechts') +
		draht([50, 40], A) + draht([50, 260], B) + punkt(...A) + punkt(...B) + punkt(...C) + punkt(...D) +
		widerstand(A[0], A[1], C[0], C[1]) + text(178, 88, sym('R', 'AC'), 'end') +
		widerstand(A[0], A[1], D[0], D[1]) + text(322, 88, sym('R', 'AD'), 'start') +
		widerstand(C[0], C[1], B[0], B[1]) + text(178, 222, sym('R', 'CB'), 'end') +
		widerstand(D[0], D[1], B[0], B[1]) + text(322, 222, sym('R', 'DB'), 'start') +
		widerstand(C[0], C[1], D[0], D[1]) + text(250, 130, sym('R', 'CD')) +
		text(250, 30, 'A') + text(250, 285, 'B') + text(132, 155, 'C', 'end') + text(368, 155, 'D', 'start') +
		stromspitze(150, 40, 'r') + text(150, 30, sym('I')),
	);
}

// ---------- G3) Gemischte Schaltung: R1 + (R2 ∥ (R3 + R4)) ----------
{
	const o = 40, u = 220;
	speichere('grundlagen/gemischt.svg', 520, 250, 'Gemischte Schaltung: R1 in Reihe mit R2 parallel zur Reihenschaltung aus R3 und R4',
		gquelle(60, o, u, 'U', 'q', 'links') +
		draht([60, o], [90, o]) + widerstand(90, o, 170, o) + ueber(130, o, 'R', '1') +
		stromspitze(80, o, 'r') + text(80, o - 10, sym('I')) +
		draht([170, o], [400, o]) + punkt(250, o) + punkt(250, u) +
		widerstand(250, o, 250, u) + neben(250, 130, 'R', '2') + stromspitze(250, 62, 'u') + text(238, 66, sym('I', '2'), 'end') +
		widerstand(400, o, 400, 130) + neben(400, 85, 'R', '3') +
		widerstand(400, 130, 400, u) + neben(400, 175, 'R', '4') + stromspitze(400, 62, 'u') + text(388, 66, sym('I', '3'), 'end') +
		draht([60, u], [400, u]),
	);
}

// ---------- G4) Belasteter Spannungsteiler ----------
{
	const o = 40, u = 220;
	speichere('grundlagen/spannungsteiler.svg', 440, 250, 'Belasteter Spannungsteiler aus R1 und R2 mit Lastwiderstand RL',
		gquelle(60, o, u, 'U', '', 'links') +
		draht([60, o], [200, o]) + widerstand(200, o, 200, 130) + neben(200, 85, 'R', '1', 'links') +
		widerstand(200, 130, 200, u) + neben(200, 175, 'R', '2', 'links') + punkt(200, 130) +
		draht([200, 130], [330, 130]) + `<circle cx="330" cy="130" r="4"/>` +
		widerstand(330, 134, 330, u) + neben(330, 177, 'R', 'L') +
		pfeil(380, 145, 380, 205) + text(388, 180, sym('U', '2'), 'start') +
		draht([60, u], [330, u]) + punkt(200, u),
	);
}

// ---------- G5) Reale Spannungsquelle mit Last ----------
{
	const o = 40, u = 200;
	speichere('grundlagen/reale-quelle.svg', 440, 230, 'Ersatzschaltung einer realen Spannungsquelle mit Innenwiderstand und Lastwiderstand',
		`<rect x="20" y="20" width="200" height="200" rx="8" stroke-dasharray="6 5" stroke-width="1.5"/>` +
		text(120, 215, 'reale Quelle', 'middle', 'font-size="12"') +
		gquelle(80, o, u, 'U', 'q', 'links') +
		draht([80, o], [110, o]) + widerstand(110, o, 190, o) + text(150, o + 28, sym('R', 'i')) +
		draht([190, o], [340, o]) + `<circle cx="240" cy="${o}" r="4" fill="var(--sl-color-bg, #fff)"/>` +
		`<circle cx="240" cy="${u}" r="4" fill="var(--sl-color-bg, #fff)"/>` +
		stromspitze(290, o, 'r') + text(290, o - 10, sym('I')) +
		widerstand(340, o, 340, u) + neben(340, 120, 'R', 'L') +
		pfeil(270, 70, 270, 170) + text(262, 125, sym('U', 'Kl'), 'end') +
		draht([80, u], [340, u]),
	);
}

// ---------- G6) Gemischte Kondensatorschaltung: (C1 ∥ C2) in Reihe mit C3 ----------
{
	const o = 40, u = 200;
	speichere('grundlagen/kondensatoren-gemischt.svg', 460, 230, 'Kondensatoren C1 und C2 parallel, in Reihe mit C3',
		gquelle(60, o, u, 'U', '', 'links') +
		draht([60, o], [140, o]) + punkt(140, o) + punkt(260, o) +
		kondensator(140, o, 260, o) + text(200, o - 20, sym('C', '1')) +
		draht([140, o], [140, 100]) + kondensator(140, 100, 260, 100) + draht([260, 100], [260, o]) + text(200, 132, sym('C', '2')) +
		pfeil(150, 150, 250, 150) + text(200, 170, sym('U', '12')) +
		draht([260, o], [340, o]) + kondensator(340, o, 340, u) + neben(340, 120, 'C', '3') +
		pfeil(385, 80, 385, 160) + text(393, 125, sym('U', '3'), 'start') +
		draht([60, u], [340, u]),
	);
}

// ---------- G7) RC-Glied: Laden über einen Widerstand ----------
{
	const o = 40, u = 190;
	speichere('grundlagen/rc-laden.svg', 440, 220, 'Kondensator wird über einen Widerstand geladen',
		gquelle(60, o, u, 'U', 'q', 'links') +
		draht([60, o], [100, o]) + schalter(100, o, 160, o) + text(130, o - 22, sym('S')) +
		draht([160, o], [190, o]) + widerstand(190, o, 270, o) + ueber(230, o, 'R') +
		draht([270, o], [330, o]) + stromspitze(305, o, 'r') + text(305, o - 10, sym('i') + '(' + sym('t') + ')') +
		kondensator(330, o, 330, u) + neben(330, 115, 'C', '', 'links') +
		pfeil(375, 80, 375, 150) + text(383, 120, sym('u', 'C') + '(' + sym('t') + ')', 'start') +
		draht([60, u], [330, u]),
	);
}

// ---------- G8) Reihenschaltung R, L, C an Wechselspannung ----------
{
	const o = 40, u = 200;
	speichere('grundlagen/rlc-reihe.svg', 560, 240, 'Reihenschaltung aus Widerstand, Spule und Kondensator an Wechselspannung',
		wquelle(60, o, u) + pfeil(28, 90, 28, 150) + text(20, 125, sym('U'), 'end') +
		draht([60, o], [100, o]) + stromspitze(90, o, 'r') + text(88, o - 10, sym('I')) +
		widerstand(100, o, 200, o) + ueber(150, o, 'R') + pfeil(115, o + 28, 185, o + 28) + text(150, o + 48, sym('U', 'R')) +
		draht([200, o], [230, o]) + spule(230, o, 330, o) + text(280, o - 16, sym('L')) +
		pfeil(245, o + 28, 315, o + 28) + text(280, o + 48, sym('U', 'L')) +
		draht([330, o], [400, o], [400, 95]) + kondensator(400, 95, 400, 145) + neben(400, 125, 'C', '', 'rechts') +
		pfeil(440, 100, 440, 150) + text(448, 130, sym('U', 'C'), 'start') +
		draht([400, 145], [400, u], [60, u]),
	);
}

// ---------- G9) Parallelschaltung R, L, C an Wechselspannung ----------
{
	const o = 40, u = 200;
	speichere('grundlagen/rlc-parallel.svg', 520, 240, 'Parallelschaltung aus Widerstand, Spule und Kondensator an Wechselspannung',
		wquelle(60, o, u) + pfeil(28, 90, 28, 150) + text(20, 125, sym('U'), 'end') +
		draht([60, o], [420, o]) + draht([60, u], [420, u]) + stromspitze(110, o, 'r') + text(110, o - 10, sym('I')) +
		punkt(180, o) + punkt(300, o) + punkt(180, u) + punkt(300, u) +
		widerstand(180, o, 180, u) + neben(180, 120, 'R') + stromspitze(180, 64, 'u') + text(168, 68, sym('I', 'R'), 'end') +
		spule(300, o, 300, u) + neben(300, 120, 'L', '', 'links') + stromspitze(300, 64, 'u') + text(312, 68, sym('I', 'L'), 'start') +
		draht([420, o], [420, 95]) + kondensator(420, 95, 420, 145) + draht([420, 145], [420, u]) + neben(420, 120, 'C') +
		stromspitze(420, 64, 'u') + text(432, 68, sym('I', 'C'), 'start'),
	);
}

// ---------- G10) RC-Tiefpass ----------
{
	const o = 40, u = 180;
	speichere('grundlagen/rc-tiefpass.svg', 480, 210, 'RC-Tiefpass: Eingangsspannung über R, Ausgangsspannung am Kondensator',
		`<circle cx="40" cy="${o}" r="4"/><circle cx="40" cy="${u}" r="4"/>` + pfeil(40, o + 20, 40, u - 20) +
		text(30, (o + u) / 2 + 5, sym('U', 'e'), 'end') +
		draht([44, o], [120, o]) + widerstand(120, o, 220, o) + ueber(170, o, 'R') + draht([220, o], [400, o]) + punkt(300, o) +
		kondensator(300, o, 300, u) + neben(300, (o + u) / 2, 'C') + punkt(300, u) +
		`<circle cx="404" cy="${o}" r="4"/><circle cx="404" cy="${u}" r="4"/>` + pfeil(404, o + 20, 404, u - 20) +
		text(414, (o + u) / 2 + 5, sym('U', 'a'), 'start') + draht([44, u], [400, u]),
	);
}

// ---------- G11) Idealer Transformator mit Last ----------
{
	const o = 40, u = 180;
	speichere('grundlagen/transformator.svg', 480, 210, 'Transformator mit Primärwicklung N1, Sekundärwicklung N2 und Lastwiderstand',
		wquelle(50, o, u) + pfeil(20, 80, 20, 140) + text(14, 115, sym('U', '1'), 'end') +
		draht([50, o], [170, o]) + stromspitze(110, o, 'r') + text(110, o - 10, sym('I', '1')) +
		spule(170, o, 170, u) + text(158, 115, sym('N', '1'), 'end') + draht([50, u], [170, u]) +
		strich(202, 45, 202, 175, 'stroke-width="2.5"') + strich(208, 45, 208, 175, 'stroke-width="2.5"') +
		spule(240, u, 240, o) + text(252, 115, sym('N', '2'), 'start') +
		draht([240, o], [380, o]) + stromspitze(320, o, 'r') + text(320, o - 10, sym('I', '2')) +
		widerstand(380, o, 380, u) + neben(380, 110, 'R', 'L') + draht([240, u], [380, u]) +
		pfeil(425, 80, 425, 140) + text(433, 115, sym('U', '2'), 'start'),
	);
}

// ---------- G12) R1 in Reihe mit ((R2 + L) parallel C) an Wechselspannung ----------
{
	const o = 40, u = 220;
	speichere('grundlagen/rlc-gemischt.svg', 520, 250, 'Wechselstromschaltung: R1 in Reihe mit der Parallelschaltung aus (R2 + L) und C',
		wquelle(60, o, u) + pfeil(28, 100, 28, 160) + text(20, 135, sym('U'), 'end') +
		draht([60, o], [90, o]) + widerstand(90, o, 170, o) + ueber(130, o, 'R', '1') + stromspitze(82, o, 'r') + text(80, o - 10, sym('I')) +
		draht([170, o], [400, o]) + punkt(260, o) + punkt(260, u) +
		widerstand(260, o, 260, 130) + neben(260, 85, 'R', '2', 'links') + spule(260, 130, 260, u) + neben(260, 175, 'L', '', 'links') +
		stromspitze(260, 60, 'u') + text(272, 64, sym('I', 'RL'), 'start') +
		draht([400, o], [400, 105]) + kondensator(400, 105, 400, 155) + draht([400, 155], [400, u]) + neben(400, 130, 'C') +
		stromspitze(400, 60, 'u') + text(412, 64, sym('I', 'C'), 'start') +
		draht([60, u], [400, u]),
	);
}

// ---------- G13) Realer Parallelschwingkreis: (R + L) parallel C ----------
{
	const o = 40, u = 220;
	speichere('grundlagen/parallelschwingkreis-real.svg', 420, 250, 'Realer Parallelschwingkreis: Spule mit Wicklungswiderstand R parallel zu C',
		wquelle(60, o, u) + pfeil(28, 100, 28, 160) + text(20, 135, sym('U'), 'end') +
		draht([60, o], [300, o]) + draht([60, u], [300, u]) + punkt(170, o) + punkt(170, u) + stromspitze(110, o, 'r') + text(110, o - 10, sym('I')) +
		widerstand(170, o, 170, 130) + neben(170, 85, 'R', '', 'links') + spule(170, 130, 170, u) + neben(170, 175, 'L', '', 'links') +
		draht([300, o], [300, 105]) + kondensator(300, 105, 300, 155) + draht([300, 155], [300, u]) + neben(300, 130, 'C'),
	);
}
