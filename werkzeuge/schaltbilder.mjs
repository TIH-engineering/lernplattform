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
	writeFileSync(new URL(name, ZIEL), svg);
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
