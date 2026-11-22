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

// =====================================================================
// ELEKTRONIK  →  src/assets/elektronik/
// =====================================================================

/** NPN-Transistor. Mitte (x,y): Basis (x-32,y), Kollektor (x,y-32), Emitter (x,y+32) */
function npn(x, y) {
	let s = `<circle cx="${x - 6}" cy="${y}" r="22"/>`;
	s += strich(x - 32, y, x - 13, y);
	s += strich(x - 13, y - 14, x - 13, y + 14, 'stroke-width="3"');
	s += draht([x - 13, y - 6], [x, y - 17], [x, y - 32]);
	s += draht([x - 13, y + 6], [x, y + 17], [x, y + 32]);
	s += spitze(x - 7, y + 11, x, y + 17);
	return s;
}
/** Z-Diode: Anode (x1,y1), Kathode (x2,y2) */
const zdiode = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 22, `<polygon points="0,-11 0,11 20,0"/>` + draht([24, -14], [20, -11], [20, 11], [16, 14]) + strich(20, 0, 22, 0));
/** LED: Anode (x1,y1), Kathode (x2,y2) – Pfeile zeigen nach außen */
const led = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 22, `<polygon points="0,-11 0,11 20,0"/>` + strich(20, -11, 20, 11) + strich(20, 0, 22, 0) +
		strich(8, -14, 16, -24) + `<polygon points="16,-24 10,-21 14,-18" fill="currentColor" stroke="none"/>` +
		strich(15, -12, 23, -22) + `<polygon points="23,-22 17,-19 21,-16" fill="currentColor" stroke="none"/>`);
/** Anschlusspunkt (offener Kreis) */
const klemme = (x, y) => `<circle cx="${x}" cy="${y}" r="4"/>`;

// ---------- E1) Diodenkennlinie ----------
{
	const x = (U) => (U >= 0 ? 330 + U * 150 : 330 + U * 40);
	const y = (I) => 150 - I * 3;
	const pkt = [];
	for (let U = 0; U <= 0.735; U += 0.005) pkt.push([x(U), y(Math.min(40, 8.9e-9 * (Math.exp(U / 0.0466) - 1) * 1000))]);
	const z = [];
	for (let U = -5.4; U <= 0; U += 0.02) z.push([x(U), y(-Math.min(40, 0.002 + 40 * Math.exp((-U - 5.25) / 0.06) * 0) - (U < -5.1 ? Math.min(40, (-U - 5.1) * 133) : 0))]);
	speichere('elektronik/diodenkennlinie.svg', 520, 300, 'Kennlinie einer Siliziumdiode und einer Z-Diode',
		pfeil(30, 150, 500, 150) + pfeil(330, 290, 330, 15) + text(500, 170, sym('U'), 'end') + text(340, 25, sym('I'), 'start') +
		`<polyline points="${p(pkt)}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		`<polyline points="${p(z)}" stroke-width="2.5" stroke-dasharray="7 4"/>` +
		strich(x(0.7), 145, x(0.7), 155) + text(x(0.7), 172, '≈ 0,7 V', 'middle', 'font-size="12"') +
		strich(x(-5.1), 145, x(-5.1), 155) + text(x(-5.1), 140, sym('U', 'Z'), 'middle', 'font-size="13"') +
		text(470, 60, 'Durchlassbereich', 'end', `font-size="12" fill="${AKZENT}"`) +
		text(200, 135, 'Sperrbereich', 'middle', 'font-size="12"') +
		text(115, 260, 'Durchbruch (Z-Diode)', 'start', 'font-size="12"') +
		text(470, 290, 'U > 0: andere Skalierung', 'end', 'font-size="11"'),
	);
}

// ---------- E2) Einweggleichrichter mit Glättung ----------
{
	const o = 40, u = 180;
	speichere('elektronik/einweggleichrichter.svg', 520, 210, 'Einweggleichrichter mit Ladekondensator und Last',
		wquelle(50, o, u) + pfeil(18, 80, 18, 140) + text(12, 115, sym('U', '~'), 'end') +
		draht([50, o], [110, o]) + diode(110, o, 190, o) + text(150, o - 18, sym('D')) + draht([190, o], [380, o]) +
		kondensator(260, o, 260, u) + neben(260, 110, 'C', 'L') + punkt(260, o) + punkt(260, u) +
		widerstand(380, o, 380, u) + neben(380, 110, 'R', 'L') +
		pfeil(440, 70, 440, 150) + text(448, 115, sym('U', 'a'), 'start') + draht([50, u], [380, u]),
	);
}

// ---------- E3) Brückengleichrichter mit Glättung ----------
{
	const o = 40, u = 220, xl = 140, xr = 260, m = 130;
	const hq = (x1, x2, y) => {
		const xm = (x1 + x2) / 2;
		return strich(x1, y, xm - 18, y) + strich(xm + 18, y, x2, y) + `<circle cx="${xm}" cy="${y}" r="18"/>` +
			`<path d="M${xm - 11},${y} q5.5,-12 11,0 t11,0"/>`;
	};
	speichere('elektronik/brueckengleichrichter.svg', 560, 250, 'Brückengleichrichter mit Ladekondensator und Last',
		diode(xl, m, xl, o) + diode(xr, m, xr, o) + diode(xl, u, xl, m) + diode(xr, u, xr, m) +
		text(xl - 18, 88, sym('D', '1'), 'end') + text(xr + 18, 88, sym('D', '2'), 'start') +
		text(xl - 18, 178, sym('D', '3'), 'end') + text(xr + 18, 178, sym('D', '4'), 'start') +
		punkt(xl, m) + punkt(xr, m) + hq(xl, xr, m) + text(200, m + 36, sym('U', '~')) +
		draht([xl, o], [440, o]) + draht([xl, u], [440, u]) + punkt(xr, o) + punkt(xr, u) +
		kondensator(340, o, 340, u) + neben(340, 130, 'C', 'L') + punkt(340, o) + punkt(340, u) +
		widerstand(440, o, 440, u) + neben(440, 130, 'R', 'L') +
		pfeil(500, 90, 500, 170) + text(508, 135, sym('U', 'a'), 'start') + text(452, o - 8, '+', 'start') + text(452, u + 18, '−', 'start'),
	);
}

// ---------- E4) Stabilisierung mit Z-Diode ----------
{
	const o = 40, u = 200;
	speichere('elektronik/z-stabilisierung.svg', 520, 230, 'Spannungsstabilisierung mit Vorwiderstand und Z-Diode',
		klemme(40, o) + klemme(40, u) + pfeil(40, 70, 40, 170) + text(32, 125, sym('U', 'e'), 'end') +
		draht([44, o], [90, o]) + widerstand(90, o, 190, o) + ueber(140, o, 'R', 'V') + stromspitze(210, o, 'r') + text(210, o - 10, sym('I', 'ges')) +
		draht([190, o], [400, o]) + punkt(270, o) + punkt(270, u) +
		zdiode(270, u, 270, o) + neben(270, 120, 'Z', '', 'links') + stromspitze(270, 70, 'u') + text(282, 74, sym('I', 'Z'), 'start') +
		widerstand(400, o, 400, u) + neben(400, 120, 'R', 'L') + stromspitze(400, 70, 'u') + text(388, 74, sym('I', 'L'), 'end') +
		pfeil(460, 80, 460, 160) + text(468, 125, sym('U', 'a') + ' = ' + sym('U', 'Z'), 'start') + draht([44, u], [400, u]),
	);
}

// ---------- E5) NPN-Transistor als Schalter ----------
{
	speichere('elektronik/npn-schalter.svg', 460, 260, 'NPN-Transistor als Low-Side-Schalter für eine LED',
		text(300, 22, '+' + sym('U', 'B')) + draht([300, 30], [300, 50]) + widerstand(300, 50, 300, 110) + neben(300, 80, 'R', 'C') +
		led(300, 110, 300, 158) + text(336, 139, 'LED', 'start', 'font-size="13"') +
		npn(300, 190) + draht([300, 222], [300, 245]) + masse(300, 245) +
		klemme(90, 190) + text(80, 195, 'µC', 'end') + draht([94, 190], [150, 190]) + widerstand(150, 190, 230, 190) + ueber(190, 190, 'R', 'B') +
		draht([230, 190], [268, 190]) + stromspitze(250, 190, 'r') + text(250, 180, sym('I', 'B')) +
		stromspitze(300, 44, 'u') + text(312, 46, sym('I', 'C'), 'start') +
		pfeil(350, 170, 350, 215) + text(358, 198, sym('U', 'CE'), 'start'),
	);
}

// ---------- E6) Längsregler: Transistor + Z-Diode ----------
{
	const o = 40, u = 230;
	speichere('elektronik/laengsregler.svg', 540, 260, 'Spannungsstabilisierung mit Transistor und Z-Diode (Längsregler)',
		klemme(40, o) + klemme(40, u) + pfeil(40, 70, 40, 200) + text(32, 135, sym('U', 'bb'), 'end') +
		draht([44, o], [300, o], [300, 98]) + punkt(140, o) +
		widerstand(140, o, 140, 130) + neben(140, 85, 'R', 'V', 'links') + punkt(140, 130) +
		zdiode(140, u, 140, 130) + neben(140, 180, 'Z', '', 'links') +
		draht([140, 130], [268, 130]) + npn(300, 130) + text(325, 108, sym('T'), 'start') +
		draht([300, 162], [300, 175], [440, 175]) + punkt(440, 175) + widerstand(440, 175, 440, u) + neben(440, 202, 'R', 'L') +
		klemme(480, 175) + draht([440, 175], [476, 175]) +
		pfeil(500, 185, 500, 225) + text(508, 210, sym('U', 'a'), 'start') +
		pfeil(170, 140, 170, 220) + text(178, 185, sym('U', 'Z'), 'start') +
		draht([44, u], [440, u]) + punkt(140, u),
	);
}

// ---------- E7) Konstantstromquelle mit Transistor ----------
{
	const o = 40, u = 240;
	speichere('elektronik/stromquelle.svg', 460, 270, 'Konstantstromquelle mit NPN-Transistor, Z-Diode als Referenz und Emitterwiderstand',
		text(250, 22, '+' + sym('U', 'bb')) + draht([120, 30], [320, 30]) + punkt(250, 30) +
		draht([120, 30], [120, 50]) + widerstand(120, 50, 120, 135) + neben(120, 92, 'R', 'V', 'links') + punkt(120, 150) +
		draht([120, 135], [120, 150]) + zdiode(120, u, 120, 150) + neben(120, 200, 'Z', '', 'links') +
		draht([120, 150], [288, 150]) +
		draht([320, 30], [320, 50]) + widerstand(320, 50, 320, 118) + neben(320, 84, 'R', 'L') + stromspitze(320, 46, 'u') + text(332, 48, sym('I', 'L'), 'start') +
		npn(320, 150) + widerstand(320, 182, 320, u) + neben(320, 212, 'R', 'E') +
		pfeil(380, 190, 380, 232) + text(388, 215, sym('U', 'RE'), 'start') +
		draht([120, u], [320, u]) + punkt(120, u) + masse(220, u),
	);
}

// ---------- E8) MOSFET als Low-Side-Schalter für ein Relais ----------
{
	speichere('elektronik/mosfet-relais.svg', 460, 280, 'N-Kanal-MOSFET schaltet eine Relaisspule mit Freilaufdiode',
		text(300, 22, '+12 V') + draht([300, 30], [300, 50]) + punkt(300, 50) +
		spule(300, 50, 300, 140) + neben(300, 95, 'Relais', '', 'links').replace('font-style="italic"', '') +
		draht([300, 50], [370, 50], [370, 70]) + diode(370, 140, 370, 70) + draht([370, 140], [300, 140]) + punkt(300, 140) +
		text(386, 110, sym('D', 'F'), 'start') +
		draht([300, 140], [300, 170]) + nmos(300, 200, { bodyDiode: false }) + draht([300, 230], [300, 255]) + masse(300, 255) +
		klemme(70, 200) + text(60, 205, 'µC', 'end') + draht([74, 200], [120, 200]) + widerstand(120, 200, 200, 200) + ueber(160, 200, 'R', 'G') +
		draht([200, 200], [270, 200]) + punkt(230, 200) + widerstand(230, 200, 230, 255) + neben(230, 228, 'R', 'GS', 'links') + draht([230, 255], [300, 255]) + punkt(300, 255),
	);
}

// ---------- Operationsverstärker ----------
/** OPV-Symbol. Mitte (x,y): − Eingang (x-30,y-16), + Eingang (x-30,y+16), Ausgang (x+42,y). tausch: + oben */
function opv(x, y, tausch = false) {
	const oben = tausch ? '+' : '−', unten = tausch ? '−' : '+';
	return `<polygon points="${p([[x - 30, y - 38], [x - 30, y + 38], [x + 42, y]])}"/>` +
		text(x - 22, y - 11, oben, 'start', 'font-size="16"') + text(x - 22, y + 21, unten, 'start', 'font-size="16"');
}
const OBEN = 40, UNTEN = 230;
/** Ein- und Ausgangsklemmen mit Spannungspfeilen gegen die Masseleitung */
const eingangsklemme = (x, y, name = 'U', idx = 'e') =>
	klemme(x, y) + pfeil(x, y + 14, x, UNTEN - 14) + text(x - 8, (y + UNTEN) / 2 + 5, sym(name, idx), 'end') + klemme(x, UNTEN);
const ausgangsklemme = (x, y, name = 'U', idx = 'a') =>
	klemme(x, y) + pfeil(x, y + 14, x, UNTEN - 14) + text(x + 8, (y + UNTEN) / 2 + 5, sym(name, idx), 'start') + klemme(x, UNTEN);

// O1) Invertierender Verstärker
speichere('elektronik/opv-invertierend.svg', 520, 260, 'Invertierender Verstärker mit Operationsverstärker',
	eingangsklemme(50, 124) + draht([54, 124], [90, 124]) + widerstand(90, 124, 190, 124) + ueber(140, 124, 'R', '1') +
	draht([190, 124], [270, 124]) + punkt(230, 124) + draht([230, 124], [230, 60], [270, 60]) + widerstand(270, 60, 350, 60) + ueber(310, 60, 'R', 'f') +
	draht([350, 60], [400, 60], [400, 140]) + opv(300, 140) + draht([342, 140], [456, 140]) + punkt(400, 140) +
	draht([270, 156], [250, 156], [250, UNTEN]) + punkt(250, UNTEN) + ausgangsklemme(460, 140) + draht([54, UNTEN], [456, UNTEN]) + masse(250, UNTEN));

// O2) Nichtinvertierender Verstärker
speichere('elektronik/opv-nichtinvertierend.svg', 520, 260, 'Nichtinvertierender Verstärker mit Operationsverstärker',
	eingangsklemme(50, 156) + draht([54, 156], [270, 156]) + opv(300, 140) +
	draht([270, 124], [250, 124], [250, 60], [270, 60]) + punkt(250, 60) + widerstand(270, 60, 350, 60) + ueber(310, 60, 'R', 'f') +
	draht([350, 60], [400, 60], [400, 140]) + draht([342, 140], [456, 140]) + punkt(400, 140) +
	widerstand(250, 60, 170, 60) + ueber(210, 60, 'R', 'g') + masse(170, 60) +
	ausgangsklemme(460, 140) + draht([54, UNTEN], [456, UNTEN]) + masse(300, UNTEN));

// O3) Spannungsfolger (Impedanzwandler)
speichere('elektronik/opv-folger.svg', 480, 260, 'Spannungsfolger (Impedanzwandler) mit Operationsverstärker',
	eingangsklemme(50, 156) + draht([54, 156], [270, 156]) + opv(300, 140) +
	draht([270, 124], [240, 124], [240, 70], [380, 70], [380, 140]) + draht([342, 140], [416, 140]) + punkt(380, 140) +
	ausgangsklemme(420, 140) + draht([54, UNTEN], [416, UNTEN]) + masse(250, UNTEN));

// O4) Invertierender Schmitt-Trigger
speichere('elektronik/opv-schmitt-trigger.svg', 520, 260, 'Invertierender Schmitt-Trigger: Mitkopplung über R1 und R2 auf den Plus-Eingang',
	eingangsklemme(50, 124) + draht([54, 124], [270, 124]) + opv(300, 140) +
	draht([270, 156], [250, 156], [250, 180]) + punkt(250, 180) + draht([250, 180], [290, 180]) + widerstand(290, 180, 370, 180) + text(330, 202, sym('R', '1')) +
	draht([370, 180], [400, 180], [400, 140]) + draht([342, 140], [456, 140]) + punkt(400, 140) +
	widerstand(250, 180, 250, UNTEN) + neben(250, 205, 'R', '2', 'links') + punkt(250, UNTEN) +
	ausgangsklemme(460, 140) + draht([54, UNTEN], [456, UNTEN]) + masse(300, UNTEN));

// O5) Umkehraddierer
speichere('elektronik/opv-addierer.svg', 540, 270, 'Umkehraddierer mit drei Eingängen',
	klemme(40, 60) + klemme(40, 110) + klemme(40, 160) + text(30, 65, sym('U', '1'), 'end') + text(30, 115, sym('U', '2'), 'end') + text(30, 165, sym('U', '3'), 'end') +
	draht([44, 60], [80, 60]) + widerstand(80, 60, 160, 60) + ueber(120, 60, 'R', '1') + draht([160, 60], [230, 60], [230, 160]) +
	draht([44, 110], [80, 110]) + widerstand(80, 110, 160, 110) + ueber(120, 110, 'R', '2') + draht([160, 110], [230, 110]) + punkt(230, 110) +
	draht([44, 160], [80, 160]) + widerstand(80, 160, 160, 160) + ueber(120, 160, 'R', '3') + draht([160, 160], [230, 160]) + punkt(230, 160) +
	draht([230, 160], [300, 160]) + opv(330, 176) + draht([300, 192], [280, 192], [280, UNTEN + 10]) + masse(280, UNTEN + 10) +
	draht([230, 60], [230, 30], [300, 30]) + widerstand(300, 30, 380, 30) + ueber(340, 30, 'R', 'f') + draht([380, 30], [430, 30], [430, 176]) +
	draht([372, 176], [486, 176]) + punkt(430, 176) + klemme(490, 176) + text(500, 181, sym('U', 'a'), 'start'));

// O6) Differenzverstärker (Subtrahierer)
speichere('elektronik/opv-differenz.svg', 540, 270, 'Differenzverstärker (Subtrahierer)',
	klemme(40, 124) + text(30, 129, sym('U', '1'), 'end') + klemme(40, 180) + text(30, 185, sym('U', '2'), 'end') +
	draht([44, 124], [90, 124]) + widerstand(90, 124, 190, 124) + ueber(140, 124, 'R', '1') + draht([190, 124], [270, 124]) + punkt(230, 124) +
	draht([230, 124], [230, 60], [270, 60]) + widerstand(270, 60, 350, 60) + ueber(310, 60, 'R', '2') + draht([350, 60], [400, 60], [400, 140]) +
	draht([44, 180], [90, 180]) + widerstand(90, 180, 190, 180) + text(140, 202, sym('R', '3')) + draht([190, 180], [250, 180], [250, 156], [270, 156]) + punkt(250, 180) +
	widerstand(250, 180, 250, 250) + neben(250, 215, 'R', '4') + masse(250, 250) +
	opv(300, 140) + draht([342, 140], [476, 140]) + punkt(400, 140) + klemme(480, 140) + text(490, 145, sym('U', 'a'), 'start'));

// O7) Integrator
speichere('elektronik/opv-integrator.svg', 520, 260, 'Integrator mit Operationsverstärker',
	eingangsklemme(50, 124) + draht([54, 124], [90, 124]) + widerstand(90, 124, 190, 124) + ueber(140, 124, 'R') +
	draht([190, 124], [270, 124]) + punkt(230, 124) + draht([230, 124], [230, 60], [290, 60]) + kondensator(290, 60, 330, 60) + text(310, 36, sym('C')) +
	draht([330, 60], [400, 60], [400, 140]) + opv(300, 140) + draht([342, 140], [456, 140]) + punkt(400, 140) +
	draht([270, 156], [250, 156], [250, UNTEN]) + punkt(250, UNTEN) + ausgangsklemme(460, 140) + draht([54, UNTEN], [456, UNTEN]) + masse(250, UNTEN));

// O8) Transimpedanzverstärker mit Fotodiode
speichere('elektronik/opv-transimpedanz.svg', 500, 260, 'Transimpedanzverstärker: Fotodiode am invertierenden Eingang',
	diode(160, 124, 160, UNTEN) + text(108, 180, 'Foto-', 'end', 'font-size="12"') + text(108, 195, 'diode', 'end', 'font-size="12"') +
	strich(120, 150, 140, 165) + spitze(120, 150, 140, 165) + strich(116, 166, 136, 181) + spitze(116, 166, 136, 181) +
	draht([160, 124], [270, 124]) + punkt(230, 124) + stromspitze(200, 124, 'r') + text(200, 114, sym('I', 'P')) +
	draht([230, 124], [230, 60], [270, 60]) + widerstand(270, 60, 350, 60) + ueber(310, 60, 'R', 'f') +
	draht([350, 60], [400, 60], [400, 140]) + opv(300, 140) + draht([342, 140], [436, 140]) + punkt(400, 140) +
	draht([270, 156], [250, 156], [250, UNTEN]) + punkt(250, UNTEN) + ausgangsklemme(440, 140) + draht([160, UNTEN], [436, UNTEN]) + masse(300, UNTEN));

// ---------- Filter ----------
// F1) RC-Hochpass
speichere('elektronik/rc-hochpass.svg', 480, 260, 'RC-Hochpass 1. Ordnung',
	eingangsklemme(50, 80) + draht([54, 80], [150, 80]) + kondensator(150, 80, 230, 80) + text(190, 56, sym('C')) +
	draht([230, 80], [380, 80]) + punkt(300, 80) + widerstand(300, 80, 300, UNTEN) + neben(300, 155, 'R') + punkt(300, UNTEN) +
	ausgangsklemme(384, 80) + draht([54, UNTEN], [380, UNTEN]));

// F2) RLC-Tiefpass 2. Ordnung
speichere('elektronik/rlc-tiefpass.svg', 520, 260, 'Passiver RLC-Tiefpass 2. Ordnung',
	eingangsklemme(50, 80) + draht([54, 80], [90, 80]) + widerstand(90, 80, 170, 80) + ueber(130, 80, 'R') +
	spule(170, 80, 270, 80) + text(220, 64, sym('L')) + draht([270, 80], [420, 80]) + punkt(340, 80) +
	kondensator(340, 80, 340, UNTEN) + neben(340, 155, 'C') + punkt(340, UNTEN) +
	ausgangsklemme(424, 80) + draht([54, UNTEN], [420, UNTEN]));

// F3) Sallen-Key-Tiefpass 2. Ordnung
speichere('elektronik/sallen-key-tiefpass.svg', 600, 280, 'Aktiver Sallen-Key-Tiefpass 2. Ordnung mit nichtinvertierendem Verstärker',
	eingangsklemme(40, 156) + draht([44, 156], [70, 156]) + widerstand(70, 156, 140, 156) + text(105, 180, sym('R', '1')) +
	draht([140, 156], [170, 156]) + punkt(170, 156) + widerstand(170, 156, 240, 156) + text(205, 180, sym('R', '2')) +
	draht([240, 156], [330, 156]) + punkt(270, 156) + kondensator(270, 156, 270, UNTEN) + neben(270, 200, 'C', '2', 'links') + punkt(270, UNTEN) +
	draht([170, 156], [170, 110]) + kondensator(170, 110, 170, 70) + text(156, 95, sym('C', '1'), 'end') +
	draht([170, 70], [170, 40], [470, 40], [470, 140]) +
	opv(360, 140) + draht([402, 140], [536, 140]) + punkt(470, 140) +
	draht([330, 124], [310, 124], [310, 90]) + punkt(310, 90) + draht([310, 90], [330, 90]) + widerstand(330, 90, 430, 90) + ueber(380, 90, 'R', 'f') + draht([430, 90], [470, 90]) + punkt(470, 90) +
	widerstand(310, 90, 230, 90) + ueber(270, 90, 'R', 'g') + masse(230, 90) +
	ausgangsklemme(540, 140) + draht([44, UNTEN], [536, UNTEN]) + masse(400, UNTEN));

// F4) Bode-Diagramm Tiefpass 1. und 2. Ordnung
{
	const x0 = 80, y0 = 40, b = 440, h = 200; // f von 10 Hz bis 100 kHz (4 Dekaden), dB von +10 bis -70
	const X = (f) => x0 + (Math.log10(f) - 1) * (b / 4);
	const Y = (db) => y0 + (10 - db) * (h / 80);
	const kurve = (ordnung) => {
		const pts = [];
		for (let e = 1; e <= 5.0001; e += 0.02) {
			const f = 10 ** e, x = f / 1000;
			const db = ordnung === 1 ? -10 * Math.log10(1 + x * x) : -10 * Math.log10(1 + x ** 4);
			pts.push([X(f), Y(Math.max(db, -70))]);
		}
		return pts;
	};
	let gitter = '';
	for (const f of [10, 100, 1000, 10000, 100000]) gitter += strich(X(f), y0, X(f), y0 + h, 'stroke-width="0.5" stroke-dasharray="3 3"') +
		text(X(f), y0 + h + 18, f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`, 'middle', 'font-size="11"');
	for (const db of [0, -20, -40, -60]) gitter += strich(x0, Y(db), x0 + b, Y(db), 'stroke-width="0.5" stroke-dasharray="3 3"') +
		text(x0 - 6, Y(db) + 4, `${db} dB`, 'end', 'font-size="11"');
	speichere('elektronik/bode-tiefpass.svg', 560, 280, 'Bode-Diagramm: Betragsgang eines Tiefpasses 1. und 2. Ordnung mit Grenzfrequenz 1 kHz',
		gitter + `<rect x="${x0}" y="${y0}" width="${b}" height="${h}" stroke-width="1"/>` +
		`<polyline points="${p(kurve(1))}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		`<polyline points="${p(kurve(2))}" stroke-width="2.5" stroke-dasharray="7 4"/>` +
		strich(X(1000), Y(-3) - 8, X(1000), Y(-3) + 8, 'stroke-width="1.5"') + text(X(1000) + 6, Y(-3) - 8, '−3 dB bei f', 'start', 'font-size="11"') +
		text(X(1000) + 46, Y(-3) - 4, 'g', 'start', 'font-size="8"') +
		text(X(20000), Y(-22), '1. Ordnung: −20 dB/Dekade', 'middle', `font-size="11" fill="${AKZENT}"`) +
		text(X(9000), Y(-58), '2. Ordnung: −40 dB/Dekade', 'middle', 'font-size="11"') +
		text(x0 + b, y0 + h + 34, sym('f') + ' (logarithmisch)', 'end', 'font-size="12"') + text(x0 - 6, y0 - 10, '|H| in dB', 'end', 'font-size="12"'));
}

// ---------- Oszillatoren ----------
/** Quarz: zwei Platten mit Kristall dazwischen (waagrecht oder senkrecht) */
const quarz = (x1, y1, x2, y2) =>
	zweipol(x1, y1, x2, y2, 28, strich(0, -13, 0, 13, 'stroke-width="2.5"') + `<rect x="7" y="-15" width="14" height="30"/>` + strich(28, -13, 28, 13, 'stroke-width="2.5"'));
/** Stromquelle (Kreis mit Querstrich), Strom fließt von (x1,y1) nach (x2,y2) */
const squelle = (x1, y1, x2, y2) => zweipol(x1, y1, x2, y2, 36, `<circle cx="18" cy="0" r="18"/>` + strich(18, -18, 18, 18));

// Os1) Rückkopplungsschleife (Barkhausen)
speichere('elektronik/osz-rueckkopplung.svg', 520, 230, 'Oszillator als Verstärker A mit Rückkopplungsnetzwerk beta',
	`<rect x="190" y="40" width="120" height="50"/>` + text(250, 71, 'Verstärker ' + sym('A')) +
	`<rect x="190" y="150" width="120" height="50"/>` + text(250, 181, 'Netzwerk ' + sym('β')) +
	draht([310, 65], [430, 65]) + punkt(370, 65) + klemme(434, 65) + text(444, 70, sym('U', 'a'), 'start') +
	draht([370, 65], [370, 175]) + pfeil(370, 175, 310, 175) +
	draht([190, 175], [110, 175], [110, 65]) + pfeil(110, 65, 190, 65) +
	text(100, 125, sym('U', 'r'), 'end') + text(250, 125, 'Schleifenverstärkung ' + sym('A') + ' · ' + sym('β'), 'middle', `font-size="13" fill="${AKZENT}"`));

// Os2) RC-Phasenschieber-Oszillator
speichere('elektronik/rc-phasenschieber.svg', 620, 280, 'RC-Phasenschieber-Oszillator: drei CR-Glieder und invertierender Verstärker',
	draht([510, 150], [570, 150], [570, 30], [40, 30], [40, 134]) + punkt(570, 150) + punkt(570, 90) +
	kondensator(40, 134, 110, 134) + text(75, 112, sym('C')) + punkt(130, 134) + draht([110, 134], [150, 134]) +
	widerstand(130, 134, 130, 240) + neben(130, 190, 'R', '', 'links') +
	kondensator(150, 134, 210, 134) + text(180, 112, sym('C')) + draht([210, 134], [250, 134]) + punkt(230, 134) +
	widerstand(230, 134, 230, 240) + neben(230, 190, 'R', '', 'links') +
	kondensator(250, 134, 310, 134) + text(280, 112, sym('C')) +
	widerstand(310, 134, 390, 134) + text(350, 158, sym('R')) + draht([390, 134], [440, 134]) + punkt(410, 134) +
	draht([410, 134], [410, 90], [430, 90]) + widerstand(430, 90, 530, 90) + ueber(480, 90, 'R', 'f') + draht([530, 90], [570, 90]) +
	opv(470, 150) + draht([440, 166], [420, 166], [420, 240]) + draht([130, 240], [420, 240]) + masse(330, 240) +
	text(565, 170, sym('U', 'a'), 'end') + text(395, 270, 'Phasendrehung: Verstärker 180° + RC-Kette 180° = 360°', 'middle', 'font-size="12"'));

// Os3) Wien-Brücken-Oszillator
speichere('elektronik/wien-oszillator.svg', 580, 290, 'Wien-Brücken-Oszillator: RC-Reihen- und Parallelglied am Plus-Eingang, Verstärkung 3 über R1 und R2',
	opv(380, 150, true) + draht([422, 150], [526, 150]) + punkt(480, 150) + klemme(530, 150) + text(540, 155, sym('U', 'a'), 'start') +
	draht([480, 150], [480, 40], [420, 40]) + widerstand(420, 40, 330, 40) + ueber(375, 40, 'R') + draht([330, 40], [290, 40]) +
	kondensator(290, 40, 230, 40) + text(260, 18, sym('C')) + draht([230, 40], [100, 40], [100, 134], [350, 134]) + punkt(100, 134) + punkt(170, 134) +
	widerstand(100, 134, 100, 250) + neben(100, 192, 'R', '', 'links') +
	kondensator(170, 134, 170, 250) + neben(170, 192, 'C') + draht([100, 250], [170, 250]) + masse(135, 250) +
	draht([350, 166], [310, 166], [310, 210], [340, 210]) + punkt(310, 210) + widerstand(340, 210, 440, 210) + text(390, 234, sym('R', '1')) +
	draht([440, 210], [480, 210], [480, 150]) + widerstand(310, 210, 310, 262) + neben(310, 236, 'R', '2', 'links') + masse(310, 262) +
	text(260, 110, sym('β') + ' = 1/3 bei ' + sym('f', '0'), 'middle', `font-size="12" fill="${AKZENT}"`));

// Os4) Relaxationsoszillator mit OPV
speichere('elektronik/relaxationsoszillator.svg', 540, 300, 'Relaxationsoszillator: Schmitt-Trigger mit RC-Glied am Minus-Eingang',
	opv(340, 150) + draht([382, 150], [476, 150]) + punkt(430, 150) + klemme(480, 150) + text(490, 155, sym('U', 'a'), 'start') +
	draht([310, 134], [160, 134]) + punkt(210, 134) + draht([210, 134], [210, 60], [250, 60]) + widerstand(250, 60, 350, 60) + ueber(300, 60, 'R', '1') +
	draht([350, 60], [430, 60], [430, 150]) +
	kondensator(160, 134, 160, 260) + neben(160, 197, 'C', '', 'links') + pfeil(120, 150, 120, 245) + text(112, 230, sym('u', 'C'), 'end') +
	draht([310, 166], [290, 166], [290, 200]) + punkt(290, 200) + draht([290, 200], [310, 200]) + widerstand(310, 200, 390, 200) + text(350, 224, sym('R', '2')) +
	draht([390, 200], [430, 200], [430, 150]) + widerstand(290, 200, 290, 260) + neben(290, 232, 'R', '3', 'links') +
	draht([160, 260], [290, 260]) + masse(225, 260));

// Os5) Signale des Relaxationsoszillators
{
	const x0 = 60, y0 = 130, s = 7, tau = 70, th = tau * Math.log(3), k = 0.5, Us = 10;
	const Y = (u) => y0 - u * s;
	const uc = [], ua = [];
	let t = 0, u = -k * Us, ziel = Us;
	ua.push([x0, Y(Us)]);
	for (let n = 0; n < 5; n++) {
		for (let dt = 0; dt <= th + 0.01; dt += 2) uc.push([x0 + t + dt, Y(ziel - (ziel - u) * Math.exp(-dt / tau))]);
		t += th; u = -u; ua.push([x0 + t, Y(ziel)]); ziel = -ziel; ua.push([x0 + t, Y(ziel)]);
	}
	const ende = x0 + t;
	speichere('elektronik/relaxation-signale.svg', 640, 260, 'Signale am Relaxationsoszillator: Rechteck am Ausgang, Lade- und Entladekurve am Kondensator',
		pfeil(x0, 230, x0, 25) + pfeil(x0, y0, ende + 30, y0) + text(ende + 30, y0 + 20, sym('t'), 'end') +
		[Us, k * Us, -k * Us, -Us].map((w) => strich(x0, Y(w), ende, Y(w), 'stroke-width="0.6" stroke-dasharray="3 3"')).join('') +
		text(x0 - 6, Y(Us) + 4, '+' + sym('U', 'sat'), 'end', 'font-size="12"') + text(x0 - 6, Y(-Us) + 4, '−' + sym('U', 'sat'), 'end', 'font-size="12"') +
		text(x0 - 6, Y(k * Us) + 4, '+' + sym('k') + sym('U', 'sat'), 'end', 'font-size="12"') + text(x0 - 6, Y(-k * Us) + 4, '−' + sym('k') + sym('U', 'sat'), 'end', 'font-size="12"') +
		`<polyline points="${p(ua)}" stroke-width="2"/>` + `<polyline points="${p(uc)}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		text(ende - 10, Y(Us) - 8, sym('u', 'a'), 'end') + text(x0 + th * 0.6, Y(0) - 6, sym('u', 'C'), 'middle', `fill="${AKZENT}"`) +
		mass(x0 + th, 245, x0 + 3 * th, 245) + text(x0 + 2 * th, 240, sym('T')));
}

// Os6) Quarz: Schaltzeichen und Ersatzschaltbild
speichere('elektronik/quarz-ersatzschaltbild.svg', 560, 220, 'Quarz: Schaltzeichen und elektrisches Ersatzschaltbild',
	quarz(30, 110, 110, 110) + klemme(30, 110) + klemme(110, 110) + text(70, 160, 'Schaltzeichen', 'middle', 'font-size="12"') +
	text(160, 116, '≙', 'middle', 'font-size="22"') +
	klemme(200, 110) + klemme(530, 110) + draht([204, 110], [240, 110]) + draht([490, 110], [526, 110]) + punkt(240, 110) + punkt(490, 110) +
	draht([240, 110], [240, 50], [260, 50]) + spule(260, 50, 330, 50) + text(295, 32, sym('L', '1')) +
	kondensator(330, 50, 380, 50) + text(355, 28, sym('C', '1')) + widerstand(380, 50, 470, 50) + ueber(425, 50, 'R', '1') + draht([470, 50], [490, 50], [490, 110]) +
	draht([240, 110], [240, 170], [340, 170]) + kondensator(340, 170, 390, 170) + text(365, 200, sym('C', '0')) + draht([390, 170], [490, 170], [490, 110]) +
	text(365, 94, 'mechanische Schwingung', 'middle', `font-size="11" fill="${AKZENT}"`) + text(365, 146, 'Elektroden + Gehäuse', 'middle', 'font-size="11"'));

// Os7) Pierce-Oszillator (Mikrocontroller)
speichere('elektronik/pierce-oszillator.svg', 560, 300, 'Pierce-Oszillator: Inverter mit Rückkopplungswiderstand im Mikrocontroller, außen Quarz und zwei Lastkondensatoren',
	`<rect x="130" y="20" width="230" height="120" stroke-dasharray="6 4" stroke-width="1.2"/>` + text(355, 36, 'im Mikrocontroller', 'end', 'font-size="11"') +
	`<polygon points="${p([[210, 78], [210, 122], [256, 100]])}"/><circle cx="261" cy="100" r="5"/>` +
	draht([160, 100], [210, 100]) + draht([266, 100], [330, 100]) + punkt(160, 100) + punkt(310, 100) +
	draht([160, 100], [160, 55], [190, 55]) + widerstand(190, 55, 290, 55) + ueber(240, 55, 'R', 'F') + draht([290, 55], [310, 55], [310, 100]) +
	text(166, 160, 'OSC_IN', 'start', 'font-size="11"') + text(366, 128, 'OSC_OUT', 'start', 'font-size="11"') +
	draht([330, 100], [350, 100]) + widerstand(350, 100, 440, 100) + ueber(395, 100, 'R', 'D') + draht([440, 100], [470, 100], [470, 200]) +
	draht([160, 100], [160, 200]) + punkt(160, 200) + punkt(470, 200) + quarz(160, 200, 470, 200) + text(315, 180, 'Quarz') +
	kondensator(160, 200, 160, 270) + neben(160, 235, 'C', '1', 'links') + kondensator(470, 200, 470, 270) + neben(470, 235, 'C', '2') +
	draht([160, 270], [470, 270]) + masse(315, 270));

// ---------- Thermische Auslegung ----------
function waermepfad(dynamisch) {
	const y = 70, u = 210, xs = 50, knoten = [130, 270, 410], xq = 530;
	let s = squelle(xs, u, xs, y) + text(xs - 26, 145, sym('P', 'V'), 'end') + draht([xs, y], [knoten[0], y]);
	const namen = [['th,jc', 'j'], ['th,ch', 'c'], ['th,ha', 'h']];
	for (let i = 0; i < 3; i++) {
		const a = knoten[i], b = i < 2 ? knoten[i + 1] : xq;
		s += widerstand(a, y, b, y) + ueber((a + b) / 2, y, 'R', namen[i][0]) + punkt(a, y) +
			text(a - 8, y - 10, sym('ϑ', namen[i][1]), 'end', `fill="${AKZENT}"`);
		if (dynamisch) s += kondensator(a, y, a, u) + neben(a, 160, 'C', 'th,' + namen[i][1]) + punkt(a, u);
	}
	s += quelle(xq, u, xq, y) + text(xq + 26, 145, sym('ϑ', 'a'), 'start') + draht([xs, u], [xq, u]) + masse(290, u) + text(290, u + 34, '0 °C (Bezug)', 'middle', 'font-size="11"');
	return s;
}
speichere('elektronik/waerme-statisch.svg', 600, 260, 'Statisches thermisches Ersatzschaltbild: Verlustleistung als Stromquelle, Wärmewiderstände in Reihe, Umgebungstemperatur als Spannungsquelle',
	waermepfad(false));
speichere('elektronik/waerme-dynamisch.svg', 600, 260, 'Dynamisches thermisches Ersatzschaltbild mit Wärmekapazitäten von Chip, Gehäuse und Kühlkörper',
	waermepfad(true));

// W3) Erwärmungskurve
{
	const x0 = 70, y0 = 210, b = 440, tau = 80;
	const Y = (d) => y0 - d * 3; // 1 K = 3 px, Endwert 50 K
	const pts = [];
	for (let t = 0; t <= b; t += 4) pts.push([x0 + t, Y(50 * (1 - Math.exp(-t / tau)))]);
	speichere('elektronik/erwaermungskurve.svg', 560, 260, 'Erwärmungskurve: Temperatur steigt exponentiell mit der thermischen Zeitkonstante tau an',
		pfeil(x0, y0, x0 + b + 20, y0) + pfeil(x0, y0, x0, 25) + text(x0 + b + 20, y0 + 20, sym('t'), 'end') + text(x0 + 8, 32, sym('ϑ'), 'start') +
		strich(x0, Y(50), x0 + b, Y(50), 'stroke-width="0.8" stroke-dasharray="5 4"') + text(x0 - 6, Y(50) + 4, sym('ϑ', 'end'), 'end', 'font-size="13"') +
		text(x0 - 6, y0 + 4, sym('ϑ', 'a'), 'end', 'font-size="13"') +
		strich(x0, y0, x0 + tau, Y(50), `stroke-width="1.2" stroke="${AKZENT}" stroke-dasharray="4 3"`) +
		strich(x0 + tau, Y(31.6), x0 + tau, y0, 'stroke-width="0.8" stroke-dasharray="3 3"') + strich(x0, Y(31.6), x0 + tau, Y(31.6), 'stroke-width="0.8" stroke-dasharray="3 3"') +
		text(x0 + tau, y0 + 18, sym('τ'), 'middle') + text(x0 - 6, Y(31.6) + 4, '63 %', 'end', 'font-size="12"') +
		strich(x0 + 5 * tau, Y(49.7), x0 + 5 * tau, y0, 'stroke-width="0.8" stroke-dasharray="3 3"') + text(x0 + 5 * tau, y0 + 18, '5' + sym('τ'), 'middle') +
		`<polyline points="${p(pts)}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		text(x0 + 3 * tau, Y(50) - 10, 'stationärer Endwert: ' + sym('ϑ', 'a') + ' + ' + sym('P', 'V') + ' · ' + sym('R', 'th'), 'middle', 'font-size="12"'));
}

// =====================================================================
// PROJEKTMANAGEMENT  →  src/assets/projektmanagement/
// =====================================================================

// P1) Magisches Dreieck
speichere('projektmanagement/magisches-dreieck.svg', 460, 300, 'Magisches Dreieck: Zeit, Kosten und Leistung beziehungsweise Qualität hängen zusammen',
	`<polygon points="${p([[230, 40], [60, 250], [400, 250]])}" stroke-width="2.5"/>` +
	`<circle cx="230" cy="180" r="44" stroke="${AKZENT}" stroke-width="2"/>` + text(230, 177, 'Projekt-', 'middle', `font-size="13" fill="${AKZENT}"`) + text(230, 194, 'ziel', 'middle', `font-size="13" fill="${AKZENT}"`) +
	text(230, 28, 'LEISTUNG / QUALITÄT', 'middle', 'font-weight="600" font-size="14"') +
	text(52, 275, 'ZEIT', 'start', 'font-weight="600" font-size="14"') + text(408, 275, 'KOSTEN', 'end', 'font-weight="600" font-size="14"') +
	text(110, 140, 'Termin', 'end', 'font-size="12"') + text(350, 140, 'Budget', 'start', 'font-size="12"') + text(230, 268, 'Ressourcen', 'middle', 'font-size="12"'));

// P2) Gantt-Diagramm mit kritischem Pfad
{
	const pakete = [
		['A  Anforderungen', 0, 1, true], ['B  Schaltplan', 1, 2, true], ['C  Gehäusekonzept', 1, 2, false],
		['D  PCB-Layout', 3, 1, true], ['E  Fertigung + Bestückung', 4, 3, true], ['F  Firmware', 3, 3, false],
		['G  Inbetriebnahme', 7, 1, true],
	];
	const x0 = 190, w = 42, y0 = 40, h = 30;
	let s = '';
	for (let k = 0; k <= 8; k++) s += strich(x0 + k * w, y0 - 8, x0 + k * w, y0 + pakete.length * h, 'stroke-width="0.5" stroke-dasharray="3 3"') +
		(k < 8 ? text(x0 + k * w + w / 2, y0 - 14, `KW ${k + 1}`, 'middle', 'font-size="11"') : '');
	pakete.forEach(([name, start, dauer, krit], i) => {
		const y = y0 + i * h;
		s += text(x0 - 10, y + 19, name, 'end', 'font-size="12"') +
			`<rect x="${x0 + start * w + 2}" y="${y + 6}" width="${dauer * w - 4}" height="${h - 12}" rx="3" ` +
			(krit ? `fill="${AKZENT}" stroke="${AKZENT}"` : 'fill="none" stroke-dasharray="5 3"') + '/>';
	});
	// Puffer bei C und F
	s += strich(x0 + 3 * w, y0 + 2 * h + 15, x0 + 7 * w, y0 + 2 * h + 15, 'stroke-width="1" stroke-dasharray="1 4"') + text(x0 + 5 * w, y0 + 2 * h + 11, 'Puffer 4 Wo', 'middle', 'font-size="10"') +
		strich(x0 + 6 * w, y0 + 5 * h + 15, x0 + 7 * w, y0 + 5 * h + 15, 'stroke-width="1" stroke-dasharray="1 4"') + text(x0 + 6.5 * w + 20, y0 + 5 * h + 11, 'Puffer 1 Wo', 'start', 'font-size="10"');
	// Meilenstein
	const xm = x0 + 8 * w;
	s += `<polygon points="${p([[xm, y0 + 6 * h + 4], [xm + 9, y0 + 6 * h + 15], [xm, y0 + 6 * h + 26], [xm - 9, y0 + 6 * h + 15]])}" fill="currentColor"/>` +
		text(xm + 14, y0 + 6 * h + 19, 'Prototyp läuft', 'start', 'font-size="11"');
	s += `<rect x="190" y="${y0 + 7 * h + 14}" width="22" height="12" rx="2" fill="${AKZENT}" stroke="${AKZENT}"/>` + text(218, y0 + 7 * h + 24, 'kritischer Pfad (kein Puffer)', 'start', 'font-size="11"') +
		`<rect x="400" y="${y0 + 7 * h + 14}" width="22" height="12" rx="2" stroke-dasharray="5 3"/>` + text(428, y0 + 7 * h + 24, 'mit Puffer', 'start', 'font-size="11"');
	speichere('projektmanagement/gantt.svg', 650, 300, 'Gantt-Diagramm eines Leiterplattenprojekts mit kritischem Pfad A, B, D, E, G', s);
}

// =====================================================================
// DREHSTROM  →  src/assets/drehstrom/
// =====================================================================
const FARBEN = ['currentColor', AKZENT, '#d97706'];

// DS1) Liniendiagramm der drei Strangspannungen
{
	const x0 = 60, b = 420, y0 = 120, a = 75;
	let s = pfeil(x0, y0, x0 + b + 40, y0) + pfeil(x0, 215, x0, 25) + text(x0 + b + 40, y0 + 20, sym('ωt'), 'end') + text(x0 + 8, 32, sym('u'), 'start');
	for (let k = 0; k < 3; k++) {
		const pts = [];
		for (let g = 0; g <= 360; g += 3) pts.push([x0 + (g / 360) * b, y0 - a * Math.sin(((g - 120 * k) * Math.PI) / 180)]);
		s += `<polyline points="${p(pts)}" stroke-width="2.3" stroke="${FARBEN[k]}"${k === 2 ? ' stroke-dasharray="7 4"' : ''}/>`;
		const gx = 90 + 120 * k; // Maximum
		s += text(x0 + (gx / 360) * b, y0 - a - 8, sym('u', `${k + 1}N`), 'middle', k ? `fill="${FARBEN[k]}"` : '');
	}
	for (const g of [120, 240, 360]) s += strich(x0 + (g / 360) * b, y0 - 4, x0 + (g / 360) * b, y0 + 4) + text(x0 + (g / 360) * b, y0 + 18, `${g}°`, 'middle', 'font-size="11"');
	s += text(x0 - 6, y0 - a + 4, sym('û'), 'end', 'font-size="13"') + strich(x0 - 3, y0 - a, x0 + 3, y0 - a);
	speichere('drehstrom/liniendiagramm.svg', 540, 230, 'Drei sinusförmige Strangspannungen, jeweils um 120 Grad verschoben', s);
}

// DS2) Zeigerdiagramm
{
	const cx = 190, cy = 160, r = 100;
	const pkt = (w, l = r) => [cx + l * Math.cos((w * Math.PI) / 180), cy - l * Math.sin((w * Math.PI) / 180)];
	const [u1, u2, u3] = [pkt(0), pkt(-120), pkt(120)];
	let s = '';
	[u1, u2, u3].forEach((q, k) => { s += pfeil(cx, cy, q[0], q[1], FARBEN[k] === 'currentColor' ? 'currentColor' : FARBEN[k]); });
	s += text(u1[0] + 8, u1[1] + 5, sym('U', '1N'), 'start') + text(u2[0] - 6, u2[1] + 18, sym('U', '2N'), 'end', `fill="${FARBEN[1]}"`) +
		text(u3[0] - 6, u3[1] - 6, sym('U', '3N'), 'end', `fill="${FARBEN[2]}"`);
	s += strich(u2[0], u2[1], u1[0], u1[1], 'stroke-width="2.5" stroke-dasharray="6 3"') + spitze(u2[0], u2[1], u1[0], u1[1]) +
		text((u1[0] + u2[0]) / 2 + 14, (u1[1] + u2[1]) / 2 + 12, sym('U', '12') + ' = ' + sym('U', '1N') + ' − ' + sym('U', '2N'), 'start', 'font-size="13"');
	s += `<path d="M${cx + 30},${cy} A30,30 0 0 0 ${cx + 30 * Math.cos(2 * Math.PI / 3)},${cy - 30 * Math.sin(2 * Math.PI / 3)}" stroke-width="1"/>` +
		text(cx + 26, cy - 30, '120°', 'start', 'font-size="11"') + punkt(cx, cy) + text(cx - 10, cy - 6, 'N', 'end', 'font-size="12"');
	speichere('drehstrom/zeigerdiagramm.svg', 460, 300, 'Zeigerdiagramm der Strangspannungen und der Außenleiterspannung U12', s);
}

// DS3) Sternschaltung
{
	const yL = [50, 90, 130], yN = 290, xZ = [420, 340, 260], ys = 250;
	let s = '';
	yL.forEach((y, k) => {
		s += text(30, y + 5, `L${k + 1}`, 'end', 'font-size="13"') + klemme(40, y) + draht([44, y], [xZ[k], y], [xZ[k], 150]) + punkt(xZ[k], y) +
			widerstand(xZ[k], 150, xZ[k], ys) + text(xZ[k] + 14, 205, sym('Z', String(k + 1)), 'start');
	});
	s += draht([260, ys], [420, ys]) + punkt(340, ys) + draht([340, ys], [340, yN], [44, yN]) + klemme(40, yN) + text(30, yN + 5, 'N', 'end', 'font-size="13"') +
		punkt(340, ys) + text(352, ys + 18, 'Sternpunkt', 'start', 'font-size="11"') +
		stromspitze(150, 50, 'r') + text(150, 40, sym('I', '1')) + stromspitze(150, yN, 'l') + text(150, yN - 10, sym('I', 'N')) +
		pfeil(90, 56, 90, 84, AKZENT) + text(98, 76, sym('U', '12'), 'start', `fill="${AKZENT}" font-size="13"`) +
		pfeil(460, 160, 460, 240, AKZENT) + text(468, 205, sym('U', 'Str') + ' = ' + sym('U', '1N'), 'start', `fill="${AKZENT}" font-size="13"`) +
		stromspitze(420, 140, 'u') + text(430, 140, sym('I', 'Str') + ' = ' + sym('I', '1'), 'start', 'font-size="13"');
	speichere('drehstrom/sternschaltung.svg', 600, 310, 'Sternschaltung: drei Impedanzen zwischen Außenleitern und Sternpunkt, Sternpunkt mit dem Neutralleiter verbunden', s);
}

// DS4) Dreieckschaltung
{
	const A = [400, 60], B = [320, 220], C = [480, 220];
	let s = text(30, 65, 'L1', 'end', 'font-size="13"') + klemme(40, 60) + draht([44, 60], A) + punkt(...A) +
		text(30, 115, 'L2', 'end', 'font-size="13"') + klemme(40, 110) + draht([44, 110], [320, 110], B) + punkt(...B) +
		text(30, 275, 'L3', 'end', 'font-size="13"') + klemme(40, 270) + draht([44, 270], [480, 270], C) + punkt(...C);
	s += widerstand(A[0], A[1], B[0], B[1]) + widerstand(B[0], B[1], C[0], C[1]) + widerstand(C[0], C[1], A[0], A[1]);
	s += text(372, 178, sym('Z', '12'), 'start') + text(400, 248, sym('Z', '23')) + text(462, 135, sym('Z', '31'), 'start');
	s += stromspitze(150, 60, 'r') + text(150, 50, sym('I', '1')) + pfeil(100, 66, 100, 104, AKZENT) + text(108, 92, sym('U', '12') + ' = ' + sym('U', 'Str'), 'start', `fill="${AKZENT}" font-size="13"`) +
		spitze(A[0] - 0.18 * (A[0] - B[0]), A[1] - 0.18 * (A[1] - B[1]), A[0] - 0.25 * (A[0] - B[0]), A[1] - 0.25 * (A[1] - B[1])) +
		text(372, 96, sym('I', '12'), 'end', 'font-size="13"');
	speichere('drehstrom/dreieckschaltung.svg', 560, 300, 'Dreieckschaltung: je eine Impedanz zwischen zwei Außenleitern, kein Neutralleiter', s);
}

// =====================================================================
// MESS- UND REGELUNGSTECHNIK  →  src/assets/mtrs/
// =====================================================================
/** Messgerät (Kreis mit Buchstabe) zwischen zwei achsparallelen Punkten, Text bleibt waagrecht */
function geraet(x1, y1, x2, y2, buchstabe) {
	const xm = (x1 + x2) / 2, ym = (y1 + y2) / 2, r = 16;
	const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
	return strich(x1, y1, xm - dx * r, ym - dy * r) + strich(xm + dx * r, ym + dy * r, x2, y2) +
		`<circle cx="${xm}" cy="${ym}" r="${r}"/>` + text(xm, ym + 5, buchstabe, 'middle', 'font-weight="600"');
}
/** Kasten mit Text */
const kasten = (x, y, b, h, zeilen, extra = '') =>
	`<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="6" ${extra}/>` +
	zeilen.map((z, i) => text(x + b / 2, y + h / 2 + 5 + (i - (zeilen.length - 1) / 2) * 17, z, 'middle', i ? 'font-size="12"' : '')).join('');

// M1) Messkette
speichere('mtrs/messkette.svg', 680, 170, 'Messkette: Messgröße, Sensor, Signalverarbeitung, Ausgabe',
	kasten(10, 50, 110, 60, ['Messgröße', 'z. B. Temperatur']) + pfeil(120, 80, 160, 80) +
	kasten(160, 50, 120, 60, ['Sensor', 'ϑ → R → U'], `stroke="${AKZENT}"`) + pfeil(280, 80, 320, 80) +
	kasten(320, 40, 200, 80, ['Signalverarbeitung', 'verstärken · filtern', 'linearisieren · A/D-wandeln']) + pfeil(520, 80, 560, 80) +
	kasten(560, 50, 110, 60, ['Ausgabe', 'Anzeige · Regler']) +
	text(340, 155, 'Störgrößen (Temperatur, Rauschen, Rückwirkung) wirken auf jedes Glied', 'middle', 'font-size="12"'));

// M2) NTC-Kennlinie mit Linearisierung
{
	const x0 = 70, y0 = 230, sx = 7, sy = 6; // T 0..60 °C, R 0..35 kΩ
	const R = (T) => 10 * Math.exp(3950 * (1 / (T + 273.15) - 1 / 298.15));
	const X = (T) => x0 + T * sx, Y = (r) => y0 - r * sy;
	const pts = []; for (let T = 0; T <= 60; T += 1) pts.push([X(T), Y(Math.min(R(T), 35))]);
	const [T1, T2] = [20, 30], k = (R(T2) - R(T1)) / (T2 - T1);
	const lin = (T) => R(T1) + k * (T - T1);
	let g = '';
	for (let T = 10; T <= 60; T += 10) g += strich(X(T), y0, X(T), y0 + 5) + text(X(T), y0 + 19, `${T}`, 'middle', 'font-size="11"');
	for (let r = 10; r <= 30; r += 10) g += strich(x0 - 5, Y(r), x0, Y(r)) + text(x0 - 8, Y(r) + 4, `${r}`, 'end', 'font-size="11"');
	speichere('mtrs/ntc-linearisierung.svg', 540, 270, 'NTC-Kennlinie mit linearer Näherung zwischen 20 °C und 30 °C',
		pfeil(x0, y0, x0 + 450, y0) + pfeil(x0, y0, x0, 15) + g + text(x0 + 450, y0 + 36, sym('ϑ') + ' in °C', 'end', 'font-size="12"') +
		text(x0 + 8, 25, sym('R') + ' in kΩ', 'start', 'font-size="12"') +
		`<polyline points="${p(pts)}" stroke-width="2.5"/>` +
		strich(X(8), Y(lin(8)), X(44), Y(lin(44)), `stroke="${AKZENT}" stroke-width="2" stroke-dasharray="7 4"`) +
		punkt(X(T1), Y(R(T1))) + punkt(X(T2), Y(R(T2))) +
		text(X(T2) + 10, Y(R(T2)) - 8, 'Arbeitsbereich 20 … 30 °C', 'start', `font-size="12" fill="${AKZENT}"`) +
		text(X(46), Y(lin(44)) + 4, sym('R', 'lin') + ' = ' + sym('k') + '·' + sym('ϑ') + ' + ' + sym('d'), 'start', `font-size="12" fill="${AKZENT}"`) +
		text(X(4), Y(31), 'NTC (10 kΩ, B = 3950 K)', 'start', 'font-size="12"'));
}

// M3) Normalverteilung
{
	const x0 = 280, y0 = 220, s = 60, h = 170;
	const f = (z) => Math.exp(-z * z / 2);
	const pts = []; for (let z = -3.6; z <= 3.6; z += 0.05) pts.push([x0 + z * s, y0 - h * f(z)]);
	const flaeche = [[x0 - s, y0]]; for (let z = -1; z <= 1.001; z += 0.05) flaeche.push([x0 + z * s, y0 - h * f(z)]); flaeche.push([x0 + s, y0]);
	let g = '';
	for (const k of [-3, -2, -1, 1, 2, 3]) g += strich(x0 + k * s, y0, x0 + k * s, y0 - h * f(k), 'stroke-width="0.8" stroke-dasharray="3 3"') +
		text(x0 + k * s, y0 + 18, (k > 0 ? '+' : '−') + Math.abs(k) + 'σ', 'middle', 'font-size="12"');
	speichere('mtrs/normalverteilung.svg', 560, 300, 'Normalverteilung: 68,3 % der Werte liegen innerhalb ±σ, 95,5 % innerhalb ±2σ, 99,7 % innerhalb ±3σ',
		`<polygon points="${p(flaeche)}" fill="${AKZENT}" fill-opacity="0.25" stroke="none"/>` +
		pfeil(40, y0, 530, y0) + `<polyline points="${p(pts)}" stroke-width="2.5"/>` + g +
		strich(x0, y0, x0, y0 - h, 'stroke-width="1"') + text(x0, y0 + 18, sym('x̄'), 'middle') +
		text(x0 + 6, y0 - 60, '68,3 %', 'start', `font-size="13" fill="${AKZENT}"`) +
		mass(x0 - 2 * s, 255, x0 + 2 * s, 255) + text(x0, 250, '95,5 %', 'middle', 'font-size="12"') +
		mass(x0 - 3 * s, 285, x0 + 3 * s, 285) + text(x0, 280, '99,7 %', 'middle', 'font-size="12"') + text(530, y0 - 8, sym('x'), 'end'));
}

// M4) Kennwerte einer Sinusspannung
{
	const x0 = 70, y0 = 140, b = 400, a = 100;
	const pts = []; for (let g = 0; g <= 360; g += 3) pts.push([x0 + g / 360 * b, y0 - a * Math.sin(g * Math.PI / 180)]);
	const betrag = []; for (let g = 0; g <= 360; g += 3) betrag.push([x0 + g / 360 * b, y0 - a * Math.abs(Math.sin(g * Math.PI / 180))]);
	const lin = (w, extra) => strich(x0, y0 - w * a, x0 + b, y0 - w * a, extra);
	speichere('mtrs/sinus-kennwerte.svg', 600, 290, 'Kennwerte einer Sinusspannung: Scheitelwert, Spitze-Spitze-Wert, Effektivwert und Gleichrichtwert',
		pfeil(x0, y0, x0 + b + 40, y0) + pfeil(x0, y0 + a + 25, x0, 20) + text(x0 + b + 40, y0 + 20, sym('t'), 'end') + text(x0 + 8, 30, sym('u'), 'start') +
		`<polyline points="${p(betrag)}" stroke-width="1.2" stroke-dasharray="3 3"/>` +
		`<polyline points="${p(pts)}" stroke-width="2.5"/>` +
		lin(1, 'stroke-width="0.8" stroke-dasharray="4 3"') + lin(-1, 'stroke-width="0.8" stroke-dasharray="4 3"') +
		lin(1 / Math.SQRT2, `stroke="${AKZENT}" stroke-width="2"`) + lin(2 / Math.PI, 'stroke="#d97706" stroke-width="2" stroke-dasharray="8 4"') +
		text(x0 + b + 8, y0 - a + 4, sym('Û'), 'start') + text(x0 + b + 8, y0 - a / Math.SQRT2 + 4, sym('U') + ' = 0,707 ' + sym('Û'), 'start', `fill="${AKZENT}" font-size="13"`) +
		text(x0 + b + 8, y0 - 2 * a / Math.PI + 14, sym('|ū|') + ' = 0,637 ' + sym('Û'), 'start', 'fill="#d97706" font-size="13"') +
		mass(x0 + b * 0.62, y0 - a, x0 + b * 0.62, y0 + a) + text(x0 + b * 0.62 + 8, y0 + 50, sym('U', 'ss') + ' = 2' + sym('Û'), 'start', 'font-size="13"') +
		text(x0 + b * 0.25, y0 + a + 20, 'gestrichelt: Betrag |u| (Gleichrichtung)', 'middle', 'font-size="11"'));
}

// M5) Mischspannung
{
	const x0 = 70, y0 = 230, b = 400, s = 18, Ud = 5, Ua = 3;
	const pts = []; for (let g = 0; g <= 720; g += 4) pts.push([x0 + g / 720 * b, y0 - s * (Ud + Ua * Math.sin(g * Math.PI / 180))]);
	speichere('mtrs/mischspannung.svg', 600, 270, 'Mischspannung aus Gleichanteil und sinusförmigem Wechselanteil',
		pfeil(x0, y0, x0 + b + 40, y0) + pfeil(x0, y0 + 10, x0, 20) + text(x0 + b + 40, y0 + 20, sym('t'), 'end') + text(x0 + 8, 30, sym('u'), 'start') +
		`<polyline points="${p(pts)}" stroke-width="2.5"/>` +
		strich(x0, y0 - s * Ud, x0 + b, y0 - s * Ud, `stroke="${AKZENT}" stroke-width="2" stroke-dasharray="7 4"`) +
		text(x0 + b + 8, y0 - s * Ud + 4, sym('U', 'DC') + ' = ' + sym('ū'), 'start', `fill="${AKZENT}"`) +
		mass(x0 + b * 0.125 + 2, y0 - s * Ud, x0 + b * 0.125 + 2, y0 - s * (Ud + Ua)) + text(x0 + b * 0.125 + 10, y0 - s * (Ud + 1.5) + 4, sym('û', '~'), 'start', 'font-size="13"') +
		strich(x0 - 4, y0 - s * (Ud + Ua), x0 + b, y0 - s * (Ud + Ua), 'stroke-width="0.7" stroke-dasharray="3 3"') + text(x0 - 8, y0 - s * (Ud + Ua) + 4, sym('û'), 'end', 'font-size="13"'));
}

// M6) Kennlinien NTC und PTC (logarithmische R-Achse)
{
	const x0 = 70, y0 = 230, b = 420, h = 200; // T -20..160 °C, R 10 Ω .. 1 MΩ (5 Dekaden)
	const X = (T) => x0 + (T + 20) / 180 * b, Y = (r) => y0 - (Math.log10(r) - 1) / 5 * h;
	const ntc = [], ptc = [];
	for (let T = -20; T <= 160; T += 2) {
		ntc.push([X(T), Y(Math.max(10, 10000 * Math.exp(3950 * (1 / (T + 273.15) - 1 / 298.15))))]);
		const r = T < 80 ? 100 * (1 - 0.003 * (T - 25)) : 100 * Math.pow(10, Math.min(4, (T - 80) / 12));
		ptc.push([X(T), Y(r)]);
	}
	let g = '';
	for (const T of [0, 40, 80, 120, 160]) g += strich(X(T), y0, X(T), y0 + 5) + text(X(T), y0 + 19, `${T}`, 'middle', 'font-size="11"');
	for (const [r, t] of [[100, '100 Ω'], [1e4, '10 kΩ'], [1e6, '1 MΩ']]) g += strich(x0 - 5, Y(r), x0, Y(r)) + text(x0 - 8, Y(r) + 4, t, 'end', 'font-size="11"');
	speichere('mtrs/ntc-ptc-kennlinien.svg', 560, 270, 'Widerstands-Temperatur-Kennlinien von Heißleiter (NTC) und Kaltleiter (PTC), Widerstand logarithmisch',
		pfeil(x0, y0, x0 + b + 30, y0) + pfeil(x0, y0, x0, 15) + g + text(x0 + b + 30, y0 + 36, sym('ϑ') + ' in °C', 'end', 'font-size="12"') +
		text(x0 + 8, 25, sym('R') + ' (logarithmisch)', 'start', 'font-size="12"') +
		`<polyline points="${p(ntc)}" stroke-width="2.5" stroke="${AKZENT}"/>` + `<polyline points="${p(ptc)}" stroke-width="2.5"/>` +
		text(X(-5), Y(4e4), 'NTC (Heißleiter)', 'start', `font-size="12" fill="${AKZENT}"`) + text(X(105), Y(3e5), 'PTC (Kaltleiter)', 'end', 'font-size="12"') +
		strich(X(80), Y(100) - 6, X(80), y0, 'stroke-width="0.8" stroke-dasharray="3 3"') + text(X(82), Y(60), sym('ϑ', 'N') + ' (Nenn-/Curie-Temperatur)', 'start', 'font-size="11"'));
}

/** Temperaturabhängiger Widerstand: Rechteck mit Schrägstrich, senkrecht */
const thermistor = (x, y1, y2) => widerstand(x, y1, x, y2) + strich(x - 14, (y1 + y2) / 2 + 16, x + 14, (y1 + y2) / 2 - 16) + strich(x + 14, (y1 + y2) / 2 - 16, x + 22, (y1 + y2) / 2 - 16);

// M7) NTC im Spannungsteiler
speichere('mtrs/ntc-spannungsteiler.svg', 420, 280, 'Temperaturmessung mit NTC im Spannungsteiler',
	text(160, 22, '+' + sym('U', 'B')) + draht([160, 30], [160, 50]) + widerstand(160, 50, 160, 130) + neben(160, 90, 'R', '1') +
	draht([160, 130], [160, 145]) + punkt(160, 145) + draht([160, 145], [300, 145]) + klemme(304, 145) +
	thermistor(160, 145, 230) + text(140, 193, sym('ϑ'), 'end') + text(190, 205, 'NTC', 'start', 'font-size="12"') +
	draht([160, 230], [160, 250]) + punkt(160, 250) + draht([160, 250], [300, 250]) + klemme(304, 250) + masse(160, 250) +
	pfeil(330, 155, 330, 240) + text(338, 202, sym('U', 'a'), 'start'));

// M8) Thermoelement
speichere('mtrs/thermoelement.svg', 560, 220, 'Thermoelement: zwei verschiedene Metalle, Messstelle und Vergleichsstelle',
	`<circle cx="90" cy="110" r="7" fill="${AKZENT}" stroke="${AKZENT}"/>` + text(90, 150, 'Messstelle', 'middle', 'font-size="12"') + text(90, 166, sym('ϑ', 'M'), 'middle') +
	`<path d="M90,110 C150,60 250,60 330,60" stroke-width="3"/>` + text(210, 50, 'Metall A (z. B. NiCr)', 'middle', 'font-size="12"') +
	`<path d="M90,110 C150,160 250,160 330,160" stroke-width="3" stroke="${AKZENT}"/>` + text(210, 182, 'Metall B (z. B. Ni)', 'middle', `font-size="12" fill="${AKZENT}"`) +
	`<rect x="330" y="45" width="40" height="130" stroke-dasharray="5 3" stroke-width="1.2"/>` + text(350, 200, 'Vergleichsstelle ' + sym('ϑ', 'V'), 'middle', 'font-size="12"') +
	draht([370, 60], [460, 60], [460, 92]) + draht([370, 160], [460, 160], [460, 128]) + `<circle cx="460" cy="110" r="18"/>` + text(460, 115, 'V', 'middle', 'font-weight="600"') +
	text(486, 115, sym('U', 'th') + ' ~ ' + sym('ϑ', 'M') + ' − ' + sym('ϑ', 'V'), 'start', 'font-size="13"'));

// M9) Hall-Effekt
speichere('mtrs/hall-effekt.svg', 580, 280, 'Hall-Effekt: Strom durch ein Plättchen im Magnetfeld erzeugt quer eine Hallspannung',
	`<polygon points="${p([[120, 90], [380, 90], [420, 170], [160, 170]])}" stroke-width="2"/>` +
	draht([40, 130], [140, 130]) + draht([400, 130], [440, 130]) + stromspitze(90, 130, 'r') + text(80, 120, sym('I'), 'middle') +
	pfeil(180, 10, 180, 80) + pfeil(340, 10, 340, 80) + text(188, 30, sym('B'), 'start') + text(348, 30, sym('B'), 'start') +
	punkt(250, 90) + punkt(290, 170) + draht([250, 90], [250, 50], [500, 50], [500, 100]) + geraet(500, 100, 500, 180, 'V') + draht([500, 180], [500, 240], [290, 240], [290, 170]) +
	text(524, 145, sym('U', 'H'), 'start', `fill="${AKZENT}"`) +
	text(262, 112, '− − −', 'start', `font-size="13" fill="${AKZENT}"`) + text(240, 160, '+ + +', 'start', `font-size="13" fill="${AKZENT}"`) +
	text(270, 270, 'Lorentzkraft lenkt die Ladungsträger zur Seite → Querspannung', 'middle', 'font-size="12"'));

// M10) Dehnungsmessstreifen
{
	let m = 'M90,160 L120,160';
	for (let i = 0; i < 8; i++) { const x = 120 + i * 30; m += ` L${x},60 L${x + 15},60 L${x + 15},160 L${x + 30},160`; }
	m += ' L${x}';
	m = m.replace(' L${x}', '');
	speichere('mtrs/dms.svg', 520, 250, 'Dehnungsmessstreifen: mäanderförmiges Messgitter auf einer Trägerfolie',
		`<rect x="70" y="40" width="330" height="140" rx="8" stroke-width="1.2" stroke-dasharray="6 3"/>` +
		`<path d="${m}" stroke="${AKZENT}" stroke-width="2.5" fill="none"/>` + draht([90, 160], [90, 210]) + draht([360, 160], [380, 160], [380, 210]) +
		punkt(90, 210) + punkt(380, 210) + text(235, 230, 'Anschlüsse', 'middle', 'font-size="12"') +
		mass(20, 110, 60, 110) + mass(410, 110, 500, 110) + text(455, 100, 'Dehnung ε', 'middle', 'font-size="12"') +
		text(235, 30, 'Trägerfolie mit Messgitter (z. B. Konstantan)', 'middle', 'font-size="12"'));
}

// M11) Messbereichserweiterung Spannung
speichere('mtrs/vorwiderstand.svg', 520, 220, 'Spannungsmessbereich erweitern: Vorwiderstand in Reihe zum Messwerk',
	klemme(40, 80) + klemme(480, 80) + draht([44, 80], [100, 80]) + widerstand(100, 80, 220, 80) + ueber(160, 80, 'R', 'V') +
	draht([220, 80], [270, 80]) + `<rect x="270" y="55" width="120" height="50" rx="4" stroke-dasharray="5 3" stroke-width="1.2"/>` +
	geraet(280, 80, 380, 80, 'V') + text(330, 125, 'Messwerk ' + sym('R', 'i') + ', ' + sym('U', 'M'), 'middle', 'font-size="12"') + draht([390, 80], [476, 80]) +
	pfeil(60, 165, 460, 165) + text(260, 185, sym('U') + ' (neuer Messbereich)', 'middle') +
	pfeil(110, 105, 210, 105, AKZENT) + text(160, 125, sym('U', 'V'), 'middle', `fill="${AKZENT}"`) + draht([270, 80], [280, 80]) + draht([380, 80], [390, 80]));

// M12) Shunt
speichere('mtrs/shunt.svg', 520, 240, 'Strommessbereich erweitern: Nebenwiderstand (Shunt) parallel zum Messwerk',
	klemme(40, 120) + klemme(480, 120) + draht([44, 120], [130, 120]) + punkt(130, 120) + punkt(390, 120) + draht([390, 120], [476, 120]) +
	draht([130, 120], [130, 60], [200, 60]) + geraet(200, 60, 320, 60, 'A') + draht([320, 60], [390, 60], [390, 120]) + text(260, 30, 'Messwerk ' + sym('R', 'i') + ', ' + sym('I', 'M'), 'middle', 'font-size="12"') +
	draht([130, 120], [130, 180], [200, 180]) + widerstand(200, 180, 320, 180) + text(260, 206, sym('R', 'N') + ' (Shunt), ' + sym('I', 'N'), 'middle', 'font-size="12"') + draht([320, 180], [390, 180], [390, 120]) +
	stromspitze(80, 120, 'r') + text(80, 110, sym('I')) + stromspitze(170, 60, 'r') + stromspitze(170, 180, 'r'));

// M13) Spannungs- und stromrichtige Messung
function rmess(name, titel, spannungsrichtig) {
	const o = 50, u = 200;
	let s = gquelle(50, o, u, 'U', '0') + draht([50, o], [100, o]) + geraet(100, o, 200, o, 'A') + draht([200, o], [260, o]);
	if (spannungsrichtig) {
		s += punkt(260, o) + draht([260, o], [380, o]) + widerstand(380, o, 380, u) + neben(380, 125, 'R', 'x') +
			geraet(260, o, 260, u, 'V') + punkt(260, u) + draht([50, u], [380, u]) + stromspitze(330, o, 'r') + text(330, o - 10, sym('I', 'x')) +
			stromspitze(260, 90, 'u') + text(270, 92, sym('I', 'V'), 'start', 'font-size="13"');
	} else {
		s += draht([260, o], [380, o]) + widerstand(380, o, 380, u) + neben(380, 125, 'R', 'x') + punkt(80, o) + punkt(380, u) +
			draht([80, o], [80, 20], [460, 20], [460, 90]) + geraet(460, 90, 460, 160, 'V') + draht([460, 160], [460, u], [380, u]) +
			draht([50, u], [380, u]) + text(480, 130, sym('U', 'A') + ' + ' + sym('U', 'x'), 'start', 'font-size="12"') + stromspitze(330, o, 'r') + text(330, o - 10, sym('I', 'x'));
	}
	speichere(name, 580, 250, titel, s);
}
rmess('mtrs/spannungsrichtig.svg', 'Spannungsrichtige Messung: Voltmeter direkt am Widerstand, Amperemeter misst auch den Voltmeterstrom', true);
rmess('mtrs/stromrichtig.svg', 'Stromrichtige Messung: Amperemeter direkt in Reihe zum Widerstand, Voltmeter misst auch die Spannung am Amperemeter', false);

// M14) Wheatstone-Brücke
speichere('mtrs/wheatstone.svg', 520, 280, 'Wheatstone-Messbrücke mit Diagonalspannung UB',
	gquelle(60, 40, 240, 'U', '0') + draht([60, 40], [380, 40]) + draht([60, 240], [380, 240]) + punkt(200, 40) + punkt(200, 240) +
	widerstand(200, 40, 200, 140) + neben(200, 90, 'R', '1', 'links') + widerstand(200, 140, 200, 240) + neben(200, 190, 'R', '2', 'links') +
	widerstand(380, 40, 380, 140) + neben(380, 90, 'R', '3') + widerstand(380, 140, 380, 240) + neben(380, 190, 'R', '4') +
	punkt(200, 140) + punkt(380, 140) + draht([200, 140], [250, 140]) + draht([330, 140], [380, 140]) + geraet(250, 140, 330, 140, 'V') +
	pfeil(215, 165, 365, 165, AKZENT) + text(290, 185, sym('U', 'B'), 'middle', `fill="${AKZENT}"`) + text(190, 133, 'a', 'end', 'font-size="12"') + text(390, 133, 'b', 'start', 'font-size="12"'));

// M15) Quantisierungskennlinie 3 Bit
{
	const x0 = 70, y0 = 260, sx = 50, sy = 26;
	let st = [[x0, y0]];
	for (let k = 0; k < 8; k++) { const xa = x0 + (k === 0 ? 0 : (k - 0.5) * sx), xb = x0 + (k + 0.5) * sx; st.push([xa, y0 - k * sy], [Math.min(xb, x0 + 8 * sx), y0 - k * sy]); }
	let g = '';
	for (let k = 1; k <= 8; k++) g += strich(x0 + k * sx, y0, x0 + k * sx, y0 + 5) + text(x0 + k * sx, y0 + 18, k === 8 ? sym('U', 'ref') : `${k}/8`, 'middle', 'font-size="10"');
	for (let k = 0; k < 8; k++) g += text(x0 - 8, y0 - k * sy + 4, k.toString(2).padStart(3, '0'), 'end', 'font-size="11"');
	speichere('mtrs/adc-kennlinie.svg', 540, 300, 'Kennlinie eines idealen 3-Bit-A/D-Umsetzers: 8 Stufen, Quantisierungsfehler höchstens eine halbe Stufe',
		pfeil(x0, y0, x0 + 8 * sx + 40, y0) + pfeil(x0, y0, x0, 20) + g + text(x0 + 8 * sx + 40, y0 + 36, sym('U', 'e'), 'end') + text(x0 + 8, 30, 'Digitalwert', 'start', 'font-size="12"') +
		strich(x0, y0, x0 + 8 * sx, y0 - 8 * sy, `stroke="${AKZENT}" stroke-dasharray="6 4" stroke-width="1.5"`) +
		`<polyline points="${p(st)}" stroke-width="2.5"/>` + mass(x0 + 3.5 * sx + 70, y0 - 3 * sy, x0 + 3.5 * sx + 70, y0 - 4 * sy) +
		text(x0 + 3.5 * sx + 80, y0 - 3.5 * sy + 4, '1 LSB = ' + sym('U', 'ref') + '/2' + '<tspan dy="-6" font-size="9">n</tspan>', 'start', 'font-size="12"'));
}

// M16) Dämpfung eines Zeigermesswerks
{
	const x0 = 60, y0 = 220, b = 440, h = 140, T = 180;
	const kurve = (D) => {
		const pts = [];
		for (let t = 0; t <= 1; t += 0.005) {
			const w = 2 * Math.PI * 2.2, tt = t;
			let y;
			if (D < 1) { const wd = w * Math.sqrt(1 - D * D); y = 1 - Math.exp(-D * w * tt) * (Math.cos(wd * tt) + D / Math.sqrt(1 - D * D) * Math.sin(wd * tt)); }
			else if (D === 1) y = 1 - Math.exp(-w * tt) * (1 + w * tt);
			else { const a = w * (D - Math.sqrt(D * D - 1)), c = w * (D + Math.sqrt(D * D - 1)); y = 1 - (c * Math.exp(-a * tt) - a * Math.exp(-c * tt)) / (c - a); }
			pts.push([x0 + t * b, y0 - y * h]);
		}
		return pts;
	};
	speichere('mtrs/daempfung.svg', 560, 270, 'Einschwingen eines Zeigers bei schwacher, richtiger und zu starker Dämpfung',
		pfeil(x0, y0, x0 + b + 30, y0) + pfeil(x0, y0, x0, 20) + text(x0 + b + 30, y0 + 20, sym('t'), 'end') + text(x0 + 8, 30, 'Zeigerausschlag', 'start', 'font-size="12"') +
		strich(x0, y0 - h, x0 + b, y0 - h, 'stroke-width="0.8" stroke-dasharray="4 3"') + text(x0 + b + 4, y0 - h + 4, 'Endwert', 'start', 'font-size="11"') +
		`<polyline points="${p(kurve(0.2))}" stroke-width="2"/>` + `<polyline points="${p(kurve(0.7))}" stroke-width="2.5" stroke="${AKZENT}"/>` +
		`<polyline points="${p(kurve(3))}" stroke-width="2" stroke-dasharray="7 4"/>` +
		text(x0 + 210, 32, 'zu schwach: schwingt', 'start', 'font-size="12"') + text(x0 + 100, y0 - 20, 'richtig: kurzes Überschwingen', 'start', `font-size="12" fill="${AKZENT}"`) +
		text(x0 + 300, y0 - 60, 'zu stark: kriecht', 'start', 'font-size="12"'));
}

// ======================================================================
// Programmierung in C: Struktogramme (Nassi-Shneiderman), Werkzeugkette, Bits, Strings
// ======================================================================
{
	const MONO = 'font-family="ui-monospace, Consolas, monospace" font-size="14"';
	const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const code = (x, y, t, anker = 'middle', extra = '') =>
		text(x, y, esc(t), anker, extra.includes('font-size') ? `${MONO.replace(' font-size="14"', '')} ${extra}` : `${MONO} ${extra}`);
	const titel = (x, y, t) => text(x, y, t, 'middle', 'font-size="13" font-weight="600"');
	const rechteck = (x, y, b, h, extra = '') => `<rect x="${x}" y="${y}" width="${b}" height="${h}" ${extra}/>`;
	// Sequenz aus mehreren Zeilen (Codezeilen), gibt SVG zurück
	const sequenz = (x, y, b, hZeile, zeilen) =>
		zeilen.map((z, i) => rechteck(x, y + i * hZeile, b, hZeile) + code(x + b / 2, y + i * hZeile + hZeile / 2 + 5, z)).join('');
	// kopfgesteuerte Schleife: Kopfband + linker Balken, Körper als Zeilen
	const kopfschleife = (x, y, b, kopf, zeilen, hZeile = 40, rand = 28) =>
		rechteck(x, y, b, 40 + zeilen.length * hZeile) + code(x + 10, y + 26, kopf, 'start') +
		sequenz(x + rand, y + 40, b - rand, hZeile, zeilen);

	// P1) Grundelemente: Sequenz, Verzweigung, Mehrfachauswahl
	speichere('programmierung/ns-grundelemente.svg', 760, 240, 'Struktogramm-Grundelemente: Sequenz, Verzweigung, Mehrfachauswahl',
		titel(110, 24, 'Sequenz (Folge)') +
		sequenz(10, 40, 200, 60, ['Anweisung 1', 'Anweisung 2', 'Anweisung 3']) +
		titel(380, 24, 'Verzweigung (if … else)') +
		rechteck(270, 40, 220, 180) + strich(270, 40, 380, 100) + strich(490, 40, 380, 100) + strich(270, 100, 490, 100) +
		strich(380, 100, 380, 220) + code(380, 64, 'Bedingung?') + text(282, 94, 'ja', 'start', 'font-size="13"') +
		text(478, 94, 'nein', 'end', 'font-size="13"') + code(325, 165, 'Anweisung A') + code(435, 165, 'Anweisung B') +
		titel(640, 24, 'Mehrfachauswahl (switch)') +
		rechteck(530, 40, 220, 180) + strich(530, 40, 695, 100) + strich(750, 40, 695, 100) + strich(530, 100, 750, 100) +
		[585, 640, 695].map((x) => strich(x, 100, x, 220)).join('') + code(640, 60, 'x?') +
		['1', '2', '3'].map((t, i) => text(536 + i * 55, 95, t, 'start', 'font-size="13"')).join('') +
		text(722, 94, 'sonst', 'middle', 'font-size="12"') +
		['A', 'B', 'C', 'D'].map((t, i) => code(557 + i * 55, 165, t)).join(''));

	// P2) Schleifen
	speichere('programmierung/ns-schleifen.svg', 760, 240, 'Struktogramm-Schleifen: kopfgesteuert, fußgesteuert, Zählschleife',
		titel(125, 24, 'kopfgesteuert (while)') +
		rechteck(10, 40, 230, 180) + strich(40, 90, 240, 90) + strich(40, 90, 40, 220) +
		code(20, 70, 'solange Bedingung', 'start') + code(140, 160, 'Schleifenkörper') +
		titel(380, 24, 'fußgesteuert (do … while)') +
		rechteck(265, 40, 230, 180) + strich(295, 40, 295, 170) + strich(295, 170, 495, 170) +
		code(395, 110, 'Schleifenkörper') + code(275, 200, 'solange Bedingung', 'start') +
		titel(635, 24, 'Zählschleife (for)') +
		rechteck(520, 40, 230, 180) + strich(550, 90, 750, 90) + strich(550, 90, 550, 220) +
		code(530, 70, 'für i = 1 bis 10', 'start') + code(650, 160, 'Schleifenkörper'));

	// P3) Beispiel: Summe 1 bis 100
	speichere('programmierung/ns-summe.svg', 340, 260, 'Struktogramm: Summe der Zahlen 1 bis 100',
		sequenz(10, 10, 320, 40, ['summe = 0', 'i = 1']) +
		kopfschleife(10, 90, 320, 'solange i <= 100', ['summe = summe + i', 'i = i + 1']) +
		sequenz(10, 210, 320, 40, ['Ausgabe: summe']));

	// P4) Hauptschleife eines Mikrocontroller-Programms
	speichere('programmierung/hauptschleife.svg', 400, 260, 'Struktogramm eines Mikrocontroller-Programms mit Endlosschleife',
		sequenz(10, 10, 380, 44, ['Initialisierung: Ports, ADC, Timer']) +
		kopfschleife(10, 54, 380, 'solange 1 (endlos)', ['Eingänge lesen (Taster, Sensor)', 'verarbeiten (vergleichen, rechnen)', 'Ausgänge setzen (LED, Motor)'], 48));

	// P5) Werkzeugkette
	const box = (x, z, akz = false) => kasten(x, 40, 130, 64, z, akz ? `stroke="${AKZENT}"` : '');
	speichere('programmierung/werkzeugkette.svg', 760, 150, 'Vom Quellcode zum lauffähigen Programm: Editor, Compiler, Linker, Programm',
		box(5, ['Quellcode', 'main.c']) + pfeil(135, 72, 160, 72) +
		box(160, ['Compiler', 'prüft + übersetzt'], true) + pfeil(290, 72, 315, 72) +
		box(315, ['Linker', '+ Bibliotheken']) + pfeil(445, 72, 470, 72) +
		box(470, ['Programm', '.exe bzw. .hex']) + pfeil(600, 72, 625, 72) +
		box(625, ['läuft auf', 'PC / Mikrocontroller']) +
		text(380, 135, 'Syntaxfehler meldet der Compiler mit Zeilennummer – das Programm wird dann gar nicht erzeugt.', 'middle', 'font-size="12"'));

	// P6) Bits im Register setzen
	{
		const x0 = 200, b = 46, h = 34;
		const zeile = (y, bits, name, akzent = false) =>
			text(x0 - 12, y + 23, esc(name), 'end', `${MONO}${akzent ? ` fill="${AKZENT}"` : ''}`) +
			bits.split('').map((c, i) => rechteck(x0 + i * b, y, b, h) + code(x0 + i * b + b / 2, y + 23, c)).join('');
		let kopf = '';
		for (let i = 0; i < 8; i++) kopf += text(x0 + i * b + b / 2, 30, `${7 - i}`, 'middle', 'font-size="12"');
		speichere('programmierung/bits-setzen.svg', 680, 200, 'Bit 1 eines 8-Bit-Registers mit einer ODER-Maske setzen',
			text(x0 - 12, 30, 'Bit', 'end', 'font-size="12"') + kopf +
			rechteck(x0 + 6 * b, 38, b, 3 * h + 24, `stroke="${AKZENT}" stroke-width="3"`) +
			zeile(40, '00101100', 'PORTB') + zeile(80, '00000010', '(1 << 1)') +
			strich(x0, 124, x0 + 8 * b, 124) + zeile(130, '00101110', 'PORTB | (1 << 1)', true) +
			text(x0 + 8 * b + 10, 63, '= 0x2C', 'start', MONO) + text(x0 + 8 * b + 10, 103, '= 0x02', 'start', MONO) +
			text(x0 + 8 * b + 10, 153, '= 0x2E', 'start', `${MONO} fill="${AKZENT}"`) +
			text(340, 190, 'Nur Bit 1 ändert sich – alle anderen Bits bleiben, wie sie waren.', 'middle', 'font-size="12"'));
	}

	// P7) String im Speicher
	{
		const x0 = 150, b = 52;
		const z = ["'H'", "'a'", "'l'", "'l'", "'o'", "'\\0'"], asc = ['72', '97', '108', '108', '111', '0'];
		speichere('programmierung/string-speicher.svg', 500, 140, 'Der String „Hallo“ im Speicher: fünf Zeichen und das Nullzeichen',
			code(10, 52, 'char s[] =', 'start') + code(10, 72, '"Hallo";', 'start') +
			z.map((c, i) => rechteck(x0 + i * b, 30, b, 40, i === 5 ? `stroke="${AKZENT}" stroke-width="3"` : '') +
				code(x0 + i * b + b / 2, 55, c, 'middle', i === 5 ? `fill="${AKZENT}"` : '') +
				text(x0 + i * b + b / 2, 90, asc[i], 'middle', 'font-size="11"') +
				code(x0 + i * b + b / 2, 112, `s[${i}]`, 'middle', 'font-size="12"')).join('') +
			text(x0 - 10, 90, 'ASCII', 'end', 'font-size="11"') +
			text(x0 + 5.5 * b, 132, 'Ende-Zeichen', 'middle', `font-size="11" fill="${AKZENT}"`));
	}
}

// ======================================================================
// MTRS – weitere Themen: Leistung/Impedanz, Frequenzmessung, Messverstärker, A/D-D/A, Aktuatoren, Regelungstechnik
// ======================================================================
{
	const ORANGE = '#d97706';
	const klein = 'font-size="12"';
	const linie = (pts, extra = '') => `<polyline points="${p(pts)}" ${extra}/>`;
	const kurve = (f, t0, t1, X, Y, n = 300) => {
		const pts = [];
		for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n; pts.push([+X(t).toFixed(2), +Y(f(t)).toFixed(2)]); }
		return pts;
	};
	const achsen = (x0, y0, x1, yTop, xl, yl, yUnten = null) =>
		pfeil(x0, yUnten ?? y0, x0, yTop) + pfeil(x0, y0, x1, y0) +
		text(x1, y0 - 8, xl, 'end', klein) + text(x0 + 8, yTop + 8, yl, 'start', klein);
	const gestrichelt = (x1, y1, x2, y2, farbe = 'currentColor') =>
		strich(x1, y1, x2, y2, `stroke-dasharray="6 4" stroke-width="1.5" stroke="${farbe}"`);
	const legende = (x, y, eintraege) =>
		eintraege.map(([t, f, dash], i) =>
			strich(x, y + i * 18, x + 24, y + i * 18, `stroke="${f}" stroke-width="2.5"${dash ? ' stroke-dasharray="6 4"' : ''}`) +
			text(x + 30, y + i * 18 + 4, t, 'start', klein)).join('');

	// L1) Leistung im Zeitverlauf
	{
		const x0 = 50, y0 = 140, sx = 520 / (4 * Math.PI), X = (t) => x0 + t * sx;
		const u = (t) => Math.sin(t), i = (t) => 0.8 * Math.sin(t - Math.PI / 3), pp = (t) => u(t) * i(t);
		const P = 0.4 * 0.5;
		speichere('mtrs/leistung-zeitverlauf.svg', 620, 280, 'Spannung, Strom und Augenblicksleistung bei 60 Grad Phasenverschiebung',
			achsen(x0, y0, 590, 20, sym('t'), '', 230) +
			linie(kurve(u, 0, 4 * Math.PI, X, (v) => y0 - 95 * v), 'stroke-width="2"') +
			linie(kurve(i, 0, 4 * Math.PI, X, (v) => y0 - 95 * v), `stroke="${AKZENT}" stroke-width="2"`) +
			linie(kurve(pp, 0, 4 * Math.PI, X, (v) => y0 - 150 * v), `stroke="${ORANGE}" stroke-width="2.5"`) +
			gestrichelt(x0, y0 - 150 * P, 580, y0 - 150 * P, ORANGE) +
			text(585, y0 - 150 * P - 6, sym('P'), 'end', `fill="${ORANGE}"`) +
			legende(70, 245, [[sym('u') + '(' + sym('t') + ')', 'currentColor'], [sym('i') + '(' + sym('t') + ')', AKZENT]]) +
			legende(240, 245, [[sym('p') + '(' + sym('t') + ') = ' + sym('u') + ' · ' + sym('i'), ORANGE], ['Mittelwert = Wirkleistung', ORANGE, true]]));
	}

	// L2) Realer Kondensator: ESB und |Z|(f)
	{
		const C = 100e-9, R = 0.02, L = 5e-9;
		const Z = (f) => { const w = 2 * Math.PI * f; return Math.hypot(R, w * L - 1 / (w * C)); };
		const x0 = 330, y0 = 240, bx = 280, lf0 = 4, lf1 = 8, lz0 = -2, lz1 = 2;
		const X = (lf) => x0 + ((lf - lf0) / (lf1 - lf0)) * bx, Y = (lz) => y0 - ((lz - lz0) / (lz1 - lz0)) * 200;
		let g = '';
		for (let d = lf0; d <= lf1; d++) g += strich(X(d), y0, X(d), y0 + 5) + text(X(d), y0 + 18, ['10 k', '100 k', '1 M', '10 M', '100 M'][d - 4], 'middle', 'font-size="11"');
		for (let d = lz0; d <= lz1; d++) g += strich(x0 - 5, Y(d), x0, Y(d)) + text(x0 - 8, Y(d) + 4, ['10 m', '0,1', '1', '10', '100'][d + 2], 'end', 'font-size="11"');
		const pts = []; for (let k = 0; k <= 300; k++) { const lf = lf0 + (k / 300) * (lf1 - lf0); pts.push([+X(lf).toFixed(2), +Y(Math.log10(Z(10 ** lf))).toFixed(2)]); }
		const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
		speichere('mtrs/kondensator-impedanz.svg', 640, 290, 'Realer Kondensator: Ersatzschaltbild mit ESR und ESL und Impedanzbetrag über der Frequenz',
			klemme(20, 90) + draht([24, 90], [40, 90]) + kondensator(40, 90, 100, 90) + ueber(70, 90, 'C', '') + widerstand(100, 90, 180, 90) + ueber(140, 90, 'R', 'ESR') +
			spule(180, 90, 250, 90) + ueber(215, 90, 'L', 'ESL') + draht([250, 90], [262, 90]) + klemme(266, 90) +
			text(140, 150, 'unterhalb ' + sym('f', '0') + ': kapazitiv', 'middle', klein) + text(140, 170, 'oberhalb ' + sym('f', '0') + ': induktiv', 'middle', klein) +
			achsen(x0, y0, 630, 20, sym('f') + ' in Hz', sym('Z') + ' in Ω') + g +
			`<polyline points="${p(pts)}" stroke="${AKZENT}" stroke-width="2.5"/>` +
			gestrichelt(X(Math.log10(f0)), y0, X(Math.log10(f0)), Y(-1.7)) + text(X(Math.log10(f0)) + 6, Y(-1.85), sym('f', '0') + ' ≈ 7 MHz', 'start', klein) +
			text(X(5.3), Y(1.6), '∼ 1/' + sym('f'), 'start', klein) + text(X(7.6), Y(0.9), '∼ ' + sym('f'), 'end', klein));
	}

	// F1) Komparator mit Rauschen, ohne und mit Hysterese
	{
		const x0 = 110, b = 470, N = 600;
		const sig = (t) => -1 + 2 * t + 0.09 * Math.sin(2 * Math.PI * 23 * t) + 0.06 * Math.sin(2 * Math.PI * 61 * t + 1) + 0.04 * Math.sin(2 * Math.PI * 137 * t + 2);
		const X = (t) => x0 + t * b, ys = (v) => 60 - v * 40;
		const ohne = [], mit = []; let zMit = 0;
		for (let k = 0; k <= N; k++) {
			const t = k / N, v = sig(t);
			ohne.push([+X(t).toFixed(2), v > 0 ? 140 : 170]);
			if (v > 0.15) zMit = 1; if (v < -0.15) zMit = 0;
			mit.push([+X(t).toFixed(2), zMit ? 220 : 250]);
		}
		const stufen = (pts) => { const q = [pts[0]]; for (let k = 1; k < pts.length; k++) { if (pts[k][1] !== pts[k - 1][1]) q.push([pts[k][0], pts[k - 1][1]]); q.push(pts[k]); } return q; };
		speichere('mtrs/komparator-rauschen.svg', 640, 280, 'Verrauschtes Signal am Komparator: ohne Hysterese mehrfaches Umschalten, mit Hysterese einmal',
			text(x0 - 12, 64, 'Signal', 'end', klein) + linie(kurve(sig, 0, 1, X, ys, N), 'stroke-width="1.5"') +
			gestrichelt(x0, 54, x0 + b, 54, ORANGE) + gestrichelt(x0, 66, x0 + b, 66, ORANGE) + gestrichelt(x0, 60, x0 + b, 60, AKZENT) +
			text(x0 + b + 4, 48, 'Schwelle', 'start', `font-size="11" fill="${AKZENT}"`) + text(x0 + b + 4, 80, 'Hysterese', 'start', `font-size="11" fill="${ORANGE}"`) +
			text(x0 - 12, 155, 'ohne', 'end', klein) + text(x0 - 12, 170, 'Hysterese', 'end', klein) + linie(stufen(ohne), 'stroke-width="2"') +
			text(x0 - 12, 235, 'mit', 'end', klein) + text(x0 - 12, 250, 'Hysterese', 'end', klein) + linie(stufen(mit), `stroke="${AKZENT}" stroke-width="2"`));
	}

	// F2) Torzeitverfahren
	speichere('mtrs/torzeit.svg', 700, 190, 'Frequenzzähler nach dem Torzeitverfahren: Komparator, Tor, Zähler, Zeitbasis',
		text(8, 60, 'Signal', 'start', klein) + pfeil(10, 70, 60, 70) +
		kasten(60, 45, 110, 50, ['Komparator', 'mit Hysterese']) + pfeil(170, 70, 230, 70) +
		kasten(230, 45, 90, 50, ['Tor', '(UND)'], `stroke="${AKZENT}"`) + pfeil(320, 70, 380, 70) +
		kasten(380, 45, 110, 50, ['Zähler', sym('N')]) + pfeil(490, 70, 550, 70) + kasten(550, 45, 140, 50, ['Anzeige', sym('f') + ' = ' + sym('N') + '/' + sym('T', 'Tor')]) +
		kasten(60, 125, 110, 50, ['Quarz-', 'oszillator']) + pfeil(170, 150, 230, 150) + kasten(230, 125, 90, 50, ['Teiler', sym('T', 'Tor')]) +
		draht([320, 150], [345, 150], [345, 112], [275, 112]) + pfeil(275, 112, 275, 95) + text(355, 140, 'öffnet das Tor', 'start', klein));

	// F3) Periodendauermessung (Zeitdiagramm)
	{
		const x0 = 160;
		const tx = linie([[x0, 60], [x0 + 40, 60], [x0 + 40, 30], [x0 + 340, 30], [x0 + 340, 60], [x0 + 420, 60]], `stroke="${AKZENT}" stroke-width="2"`);
		let ref = '', gez = '';
		for (let k = 0; k < 24; k++) {
			const x = x0 + 10 + k * 18;
			ref += linie([[x, 120], [x, 100], [x + 9, 100], [x + 9, 120]], 'stroke-width="1.5"');
			if (x > x0 + 40 && x + 9 < x0 + 340) gez += linie([[x, 180], [x, 160], [x + 9, 160], [x + 9, 180]], `stroke="${ORANGE}" stroke-width="1.5"`);
		}
		speichere('mtrs/periodendauer.svg', 640, 230, 'Periodendauermessung: Referenzimpulse während einer Periode des Messsignals zählen',
			text(x0 - 12, 50, 'Messsignal (Tor)', 'end', klein) + tx + mass(x0 + 40, 76, x0 + 340, 76) + text(x0 + 190, 92, sym('T', 'x'), 'middle', klein) +
			text(x0 - 12, 115, 'Referenztakt ' + sym('f', 'ref'), 'end', klein) + strich(x0, 120, x0 + 440, 120, 'stroke-width="1.5"') + ref +
			text(x0 - 12, 175, 'gezählt: ' + sym('N'), 'end', klein) + strich(x0, 180, x0 + 440, 180, 'stroke-width="1.5"') + gez +
			text(x0 + 190, 215, sym('T', 'x') + ' = ' + sym('N') + '/' + sym('f', 'ref'), 'middle', klein));
	}

	// V1) Instrumentenverstärker
	speichere('mtrs/instrumentenverstaerker.svg', 620, 300, 'Instrumentenverstärker aus drei Operationsverstärkern mit Verstärkungswiderstand RG',
		klemme(40, 64) + text(32, 69, sym('U', '1'), 'end') + draht([44, 64], [140, 64]) + opv(170, 80, true) + text(180, 84, '1', 'middle', klein) +
		draht([140, 96], [120, 96], [120, 120]) + punkt(120, 120) + widerstand(120, 120, 120, 200) + neben(120, 160, 'R', 'G', 'links') +
		draht([212, 80], [230, 80], [230, 120]) + widerstand(230, 120, 120, 120) + text(175, 145, sym('R'), 'middle') + punkt(230, 80) +
		klemme(40, 256) + text(32, 261, sym('U', '2'), 'end') + draht([44, 256], [140, 256]) + opv(170, 240, false) + text(180, 244, '2', 'middle', klein) +
		draht([140, 224], [120, 224], [120, 200]) + punkt(120, 200) +
		draht([212, 240], [230, 240], [230, 200]) + widerstand(230, 200, 120, 200) + ueber(175, 200, 'R', '') + punkt(230, 240) +
		draht([230, 80], [300, 80], [300, 144]) + widerstand(300, 144, 390, 144) + ueber(345, 144, 'R', '1') + draht([390, 144], [420, 144]) + punkt(400, 144) +
		draht([230, 240], [300, 240], [300, 176]) + widerstand(300, 176, 390, 176) + text(345, 200, sym('R', '1')) + draht([390, 176], [420, 176]) + punkt(400, 176) +
		opv(450, 160) + text(462, 164, '3', 'middle', klein) +
		draht([400, 144], [400, 100]) + widerstand(400, 100, 520, 100) + ueber(460, 100, 'R', '2') + draht([520, 100], [520, 160]) +
		draht([492, 160], [570, 160]) + punkt(520, 160) + klemme(574, 160) + text(582, 165, sym('U', 'a'), 'start') +
		widerstand(400, 176, 400, 262) + neben(400, 222, 'R', '2') + klemme(400, 266) + text(400, 290, 'REF', 'middle', klein));

	// V2) Low-Side und High-Side
	{
		const teil = (x, high) => {
			let s = text(x + 110, 22, high ? 'High-Side' : 'Low-Side', 'middle', 'font-weight="600"') +
				text(x + 20, 48, '+' + sym('U', 'B'), 'start', klein) + draht([x + 20, 56], [x + 110, 56]);
			if (!high) {
				s += widerstand(x + 110, 56, x + 110, 140) + text(x + 126, 102, 'Last', 'start', klein) +
					`<g stroke="${AKZENT}">${widerstand(x + 110, 140, x + 110, 215)}</g>` + text(x + 94, 182, sym('R', 'S'), 'end', `fill="${AKZENT}"`) + masse(x + 110, 215) +
					pfeil(x + 145, 150, x + 145, 205, AKZENT) + text(x + 153, 175, sym('U', 'S'), 'start', `fill="${AKZENT}"`) +
					text(x + 153, 195, 'nahe 0 V', 'start', 'font-size="11"');
			} else {
				s += `<g stroke="${AKZENT}">${widerstand(x + 110, 56, x + 110, 130)}</g>` + text(x + 94, 98, sym('R', 'S'), 'end', `fill="${AKZENT}"`) +
					widerstand(x + 110, 130, x + 110, 215) + text(x + 126, 177, 'Last', 'start', klein) + masse(x + 110, 215) +
					pfeil(x + 145, 66, x + 145, 120, AKZENT) + text(x + 153, 90, sym('U', 'S'), 'start', `fill="${AKZENT}"`) +
					text(x + 153, 110, 'auf ' + sym('U', 'B') + '-Potential', 'start', 'font-size="11"');
			}
			return s;
		};
		speichere('mtrs/shunt-low-high.svg', 600, 245, 'Strommessung mit Shunt: Low-Side an Masse und High-Side an der Versorgung', teil(10, false) + teil(300, true));
	}

	// V3) 4–20-mA-Stromschleife
	speichere('mtrs/stromschleife.svg', 660, 230, 'Zweileiter-Messumformer in einer 4-20-mA-Stromschleife mit Bürdenwiderstand',
		gquelle(60, 50, 190, 'U', 'V') + text(60, 215, '24 V', 'middle', klein) +
		draht([60, 50], [450, 50], [450, 90], [490, 90]) + stromspitze(300, 50, 'r') + text(300, 40, sym('I') + ' = 4 … 20 mA', 'middle', klein) +
		kasten(490, 70, 150, 100, ['Messumformer', '(Zweileiter)', 'mit Sensor'], `stroke="${AKZENT}"`) +
		draht([490, 150], [450, 150], [450, 190], [310, 190]) + widerstand(310, 190, 190, 190) + text(250, 215, sym('R', 'B') + ' = 250 Ω', 'middle', klein) +
		draht([190, 190], [60, 190]) + pfeil(300, 165, 200, 165) + text(250, 155, '1 … 5 V → Steuerung', 'middle', klein) +
		text(380, 120, 'Leitung', 'middle', klein) + text(380, 136, '(Hunderte m)', 'middle', klein));

	// A1) R-2R-D/A-Umsetzer (3 Bit, Code 101)
	{
		const knoten = [[160, 'Bit 0', 1], [280, 'Bit 1', 0], [400, 'Bit 2', 1]];
		let s = klemme(524, 60) + text(532, 65, sym('U', 'ref'), 'start') + draht([160, 60], [520, 60]) +
			widerstand(160, 60, 280, 60) + ueber(220, 60, 'R', '') + widerstand(280, 60, 400, 60) + ueber(340, 60, 'R', '') +
			draht([160, 60], [80, 60]) + widerstand(80, 60, 80, 150) + text(64, 110, '2' + sym('R'), 'end') + draht([80, 150], [80, 240]) +
			draht([80, 240], [440, 240]) + masse(440, 240) + draht([144, 200], [570, 200]) + text(130, 204, 'Σ', 'end', klein);
		for (const [x, name, bit] of knoten) {
			const ca = [x - 16, 176], cb = [x + 16, 176];
			s += punkt(x, 60) + widerstand(x, 60, x, 140) + text(x + 14, 104, '2' + sym('R'), 'start') + draht([x, 140], [x, 146]) +
				`<circle cx="${x}" cy="149" r="3"/>` + `<circle cx="${ca[0]}" cy="${ca[1]}" r="2.5"/><circle cx="${cb[0]}" cy="${cb[1]}" r="2.5"/>` +
				strich(x, 152, bit ? ca[0] + 1 : cb[0] - 1, 174) + draht([ca[0], 179], [ca[0], 200]) + punkt(ca[0], 200) +
				draht([cb[0], 179], [cb[0], 240]) + punkt(cb[0], 240) + text(x, 280, `${name} = ${bit}`, 'middle', klein);
		}
		s += opv(600, 216) + draht([570, 232], [555, 232], [555, 252]) + masse(555, 252) + punkt(560, 200) + draht([560, 200], [560, 150]) +
			widerstand(560, 150, 680, 150) + ueber(620, 150, 'R', '') + draht([680, 150], [680, 216]) + draht([642, 216], [700, 216]) + punkt(680, 216) +
			text(704, 240, sym('U', 'a'), 'end');
		speichere('mtrs/r2r.svg', 720, 300, 'D/A-Umsetzer mit R-2R-Netzwerk, 3 Bit, Code 101', s);
	}

	// A2) Dual-Slope
	{
		const x0 = 60, y0 = 210, T1 = 200, k = 140;
		const kurveDS = (ue) => [[x0, y0], [x0 + T1, y0 - k * ue], [x0 + T1 + T1 * ue, y0]];
		speichere('mtrs/dual-slope.svg', 560, 250, 'Dual-Slope-Verfahren: Aufintegrieren für feste Zeit, Abintegrieren mit fester Steigung',
			achsen(x0, y0, 540, 20, sym('t'), sym('u', 'Int')) +
			linie(kurveDS(1), 'stroke-width="2.5"') + linie(kurveDS(0.55), `stroke="${AKZENT}" stroke-width="2.5"`) +
			gestrichelt(x0 + T1, y0, x0 + T1, y0 - k) + mass(x0, y0 + 14, x0 + T1, y0 + 14) + text(x0 + T1 / 2, y0 + 30, sym('T', '1') + ' (fest)', 'middle', klein) +
			mass(x0 + T1, y0 + 14, x0 + T1 + T1 * 0.55, y0 + 14) + text(x0 + T1 + T1 * 0.275, y0 + 30, sym('T', '2'), 'middle', `${klein} fill="${AKZENT}"`) +
			text(x0 + 95, y0 - k * 0.5 - 12, 'großes ' + sym('U', 'e'), 'end', klein) + text(x0 + 130, y0 - k * 0.36 + 22, 'kleines ' + sym('U', 'e'), 'start', `${klein} fill="${AKZENT}"`) +
			text(x0 + T1 + 100, y0 - k + 10, 'gleiche Steigung (' + sym('U', 'ref') + ')', 'start', klein));
	}

	// A3) Offset- und Verstärkungsfehler
	{
		const x0 = 60, y0 = 230, s = 22;
		const stufen = []; for (let z = 0; z < 8; z++) stufen.push([x0 + z * s, y0 - z * s], [x0 + (z + 1) * s, y0 - z * s]);
		speichere('mtrs/adc-fehler.svg', 560, 270, 'Kennlinie eines A/D-Umsetzers: ideal, mit Offsetfehler und mit Verstärkungsfehler',
			achsen(x0, y0, 280, 20, sym('U', 'e'), 'Code') + linie(stufen, 'stroke-width="1.5"') +
			strich(x0, y0 + s / 2, x0 + 8 * s, y0 - 7.5 * s, 'stroke-width="2"') +
			strich(x0, y0 + s / 2 - 30, x0 + 8 * s, y0 - 7.5 * s - 30, `stroke="${AKZENT}" stroke-width="2.5"`) +
			strich(x0, y0 + s / 2, x0 + 8 * s, y0 - 5.6 * s, `stroke="${ORANGE}" stroke-width="2.5"`) +
			legende(300, 60, [['ideal (Treppe und Gerade)', 'currentColor'], ['Offsetfehler: verschoben', AKZENT], ['Verstärkungsfehler: Steigung', ORANGE]]) +
			text(300, 140, 'DNL: einzelne Stufen ungleich breit', 'start', klein) + text(300, 160, 'INL: Kennlinie gekrümmt', 'start', klein));
	}

	// AK1) Magnetkreis
	{
		const kern = [[360, 130], [360, 40], [60, 40], [60, 240], [360, 240], [360, 150], [310, 150], [310, 190], [110, 190], [110, 90], [310, 90], [310, 130]];
		let wick = ''; for (let y = 96; y <= 184; y += 11) wick += strich(46, y, 124, y + 6, 'stroke-width="2.5"');
		speichere('mtrs/magnetkreis.svg', 470, 280, 'Magnetkreis: Eisenkern mit Spule und Luftspalt',
			`<polygon points="${p(kern)}" fill="currentColor" fill-opacity="0.12"/>` + wick +
			draht([46, 100], [20, 100]) + draht([46, 180], [20, 180]) + klemme(16, 100) + klemme(16, 180) + stromspitze(32, 100, 'r') + text(28, 90, sym('I'), 'middle', klein) +
			text(140, 145, sym('N'), 'start') + text(210, 30, 'Eisen, ' + sym('μ', 'r') + ' groß', 'middle', klein) +
			`<rect x="85" y="65" width="250" height="150" rx="8" stroke="${AKZENT}" stroke-dasharray="7 5" stroke-width="1.5"/>` +
			spitze(200, 215, 190, 215, AKZENT) + text(200, 262, sym('Φ'), 'middle', `fill="${AKZENT}"`) +
			text(375, 144, 'Luftspalt ' + sym('δ'), 'start', klein));
	}

	// AK2) Relais mit Freilaufdiode
	speichere('mtrs/freilauf.svg', 330, 270, 'Relaisspule am Transistor mit Freilaufdiode',
		text(190, 20, '+' + sym('U', 'B'), 'middle', klein) + draht([150, 34], [230, 34]) + punkt(190, 34) + draht([190, 26], [190, 34]) +
		spule(150, 34, 150, 130) + text(132, 86, 'Relais', 'end', klein) + diode(230, 130, 230, 34) + text(250, 86, 'Freilauf-', 'start', klein) + text(250, 102, 'diode', 'start', klein) +
		draht([150, 130], [230, 130]) + punkt(150, 130) + draht([150, 130], [150, 158]) + npn(150, 190) +
		widerstand(40, 190, 118, 190) + ueber(79, 190, 'R', 'B') + klemme(36, 190) + text(30, 225, 'µC-Pin', 'start', klein) + masse(150, 222));

	// AK3) Ersatzschaltbild Gleichstrommotor
	speichere('mtrs/dc-motor-esb.svg', 480, 230, 'Ersatzschaltbild des Gleichstrommotors: Ankerwiderstand, Ankerinduktivität, Gegenspannung',
		gquelle(50, 50, 190, 'U', '') + draht([50, 50], [100, 50]) + stromspitze(85, 50, 'r') + text(85, 40, sym('I'), 'middle') +
		widerstand(100, 50, 200, 50) + ueber(150, 50, 'R', 'A') + spule(200, 50, 300, 50) + ueber(250, 50, 'L', 'A') + draht([300, 50], [360, 50]) +
		quelle(360, 190, 360, 50) + pfeil(410, 80, 410, 160) +
		text(418, 116, sym('U', 'q'), 'start') + text(418, 136, '= ' + sym('k') + ' ' + sym('ω'), 'start', klein) + draht([50, 190], [360, 190]));

	// AK4) Kennlinien Gleichstrommotor
	{
		const x0 = 60, y0 = 240, b = 400, h = 200;
		speichere('mtrs/dc-motor-kennlinie.svg', 540, 290, 'Kennlinien des Gleichstrommotors: Drehzahl, Strom und mechanische Leistung über dem Moment',
			achsen(x0, y0, x0 + b + 40, 20, sym('M'), '') +
			strich(x0, y0 - h, x0 + b, y0, 'stroke-width="2.5"') + text(x0 + 8, y0 - h - 8, sym('n', '0'), 'start') + text(x0 + 70, y0 - h + 30, sym('n'), 'start') +
			strich(x0, y0 - 12, x0 + b, y0 - h, `stroke="${AKZENT}" stroke-width="2.5"`) + text(x0 + b + 6, y0 - h + 4, sym('I', 'A'), 'start', `fill="${AKZENT}"`) +
			text(x0 + 330, y0 - 150, sym('I'), 'start', `fill="${AKZENT}"`) +
			linie(kurve((m) => 4 * m * (1 - m), 0, 1, (m) => x0 + m * b, (v) => y0 - v * h * 0.75), `stroke="${ORANGE}" stroke-width="2.5"`) +
			text(x0 + b / 2, y0 - h * 0.75 - 8, sym('P', 'mech') + ' max. bei ' + sym('n', '0') + '/2', 'middle', `${klein} fill="${ORANGE}"`) +
			text(x0 + b, y0 + 20, sym('M', 'A'), 'middle', klein) + gestrichelt(x0 + b, y0, x0 + b, y0 - h));
	}

	// AK5) Asynchronmotor M(n)
	{
		const x0 = 60, y0 = 250, b = 420, h = 200, sk = 0.25;
		const M = (n) => { const s = Math.max(1 - n, 1e-6); return 2 / (s / sk + sk / s); };
		const ML = (n) => 0.08 + 0.3 * n * n;
		let nB = 0.9; for (let n = 0.8; n < 1; n += 0.0005) if (M(n) < ML(n)) { nB = n; break; }
		speichere('mtrs/asm-kennlinie.svg', 540, 300, 'Drehmoment-Drehzahl-Kennlinie eines Asynchronmotors mit Lastkennlinie und Betriebspunkt',
			achsen(x0, y0, x0 + b + 40, 20, sym('n'), sym('M')) +
			linie(kurve(M, 0, 1, (n) => x0 + n * b, (v) => y0 - v * h * 0.85), 'stroke-width="2.5"') +
			linie(kurve(ML, 0, 1, (n) => x0 + n * b, (v) => y0 - v * h * 0.85), `stroke="${AKZENT}" stroke-width="2" stroke-dasharray="7 4"`) +
			text(x0 + 6, y0 - M(0) * h * 0.85 - 8, sym('M', 'A'), 'start', klein) +
			text(x0 + (1 - sk) * b, y0 - h * 0.85 - 10, sym('M', 'K') + ' (Kippmoment)', 'middle', klein) + punkt(x0 + (1 - sk) * b, y0 - h * 0.85) +
			punkt(x0 + nB * b, y0 - M(nB) * h * 0.85) + text(x0 + nB * b - 10, y0 - M(nB) * h * 0.85 - 10, 'Betriebspunkt', 'end', klein) +
			text(x0 + 0.5 * b, y0 - ML(0.5) * h * 0.85 + 22, 'Last', 'middle', `${klein} fill="${AKZENT}"`) +
			text(x0 + b, y0 + 20, sym('n', 's'), 'middle', klein));
	}

	// R1) Regelkreis
	{
		const k = (x, y, b, h, z, akz) => kasten(x, y, b, h, z, akz ? `stroke="${AKZENT}"` : '');
		speichere('mtrs/regelkreis.svg', 720, 240, 'Blockschaltbild eines Regelkreises mit Regler, Stellglied, Strecke und Messglied',
			pfeil(20, 90, 76, 90) + text(40, 80, sym('w'), 'middle') + `<circle cx="90" cy="90" r="14"/>` + strich(80, 80, 100, 100) + strich(80, 100, 100, 80) +
			text(100, 125, '−', 'start', 'font-size="18"') + pfeil(104, 90, 150, 90) + text(127, 80, sym('e'), 'middle') +
			k(150, 65, 100, 50, ['Regler'], true) + pfeil(250, 90, 300, 90) + text(275, 80, sym('u'), 'middle') +
			k(300, 65, 110, 50, ['Stellglied']) + pfeil(410, 90, 460, 90) +
			k(460, 65, 110, 50, ['Strecke']) + pfeil(515, 20, 515, 65) + text(525, 30, sym('z'), 'start') +
			pfeil(570, 90, 700, 90) + text(690, 80, sym('y'), 'middle') + punkt(630, 90) +
			draht([630, 90], [630, 185], [570, 185]) + spitze(580, 185, 570, 185) + k(460, 160, 110, 50, ['Messglied']) +
			draht([460, 185], [90, 185], [90, 104]) + spitze(90, 114, 90, 104) + text(100, 175, sym('r'), 'start'));
	}

	// R2) Kennwerte der Sprungantwort
	{
		const x0 = 60, y0 = 240, b = 460, h = 160, D = 0.4, w0 = 1.6;
		const wd = w0 * Math.sqrt(1 - D * D), phi = Math.acos(D);
		const y = (t) => 1 - (Math.exp(-D * w0 * t) / Math.sqrt(1 - D * D)) * Math.sin(wd * t + phi);
		const T = 12, X = (t) => x0 + (t / T) * b, Y = (v) => y0 - v * h;
		let tan = 0, taus = 0; for (let t = 0; t < T; t += 0.001) { if (!tan && y(t) >= 0.98) tan = t; if (Math.abs(y(t) - 1) > 0.02) taus = t; }
		const tmax = Math.PI / wd, ymax = y(tmax);
		speichere('mtrs/regel-kennwerte.svg', 560, 290, 'Kennwerte der Sprungantwort: Überschwingweite, Anregelzeit, Ausregelzeit, Toleranzband',
			achsen(x0, y0, x0 + b + 20, 20, sym('t'), sym('y')) +
			gestrichelt(x0, Y(1.02), x0 + b, Y(1.02), ORANGE) + gestrichelt(x0, Y(0.98), x0 + b, Y(0.98), ORANGE) +
			text(x0 + b, Y(1.02) - 6, 'Toleranzband ±2 %', 'end', `font-size="11" fill="${ORANGE}"`) +
			text(x0 - 6, Y(1) + 4, sym('w'), 'end') +
			linie(kurve(y, 0, T, X, Y), `stroke="${AKZENT}" stroke-width="2.5"`) +
			mass(X(tmax), Y(1), X(tmax), Y(ymax)) + text(X(tmax) + 8, Y((1 + ymax) / 2) + 4, 'Δ' + sym('h'), 'start') +
			gestrichelt(X(tan), Y(0.98), X(tan), y0) + text(X(tan), y0 + 18, sym('t', 'an'), 'middle', klein) +
			gestrichelt(X(taus), Y(1), X(taus), y0) + text(X(taus), y0 + 18, sym('t', 'aus'), 'middle', klein));
	}

	// R3) Sprungantworten der Grundglieder
	{
		const feld = (gx, gy, titel, f, tmax = 5) => {
			const x0 = gx + 20, y0 = gy + 115, b = 170, h = 58;
			const X = (t) => x0 + ((t + 0.5) / (tmax + 0.5)) * b, Y = (v) => y0 - v * h;
			const ein = [[x0, y0], [X(0), y0], [X(0), Y(1)], [x0 + b, Y(1)]];
			return text(gx + 105, gy + 18, titel, 'middle', 'font-weight="600" font-size="13"') +
				strich(x0, y0, x0 + b + 6, y0, 'stroke-width="1.5"') + strich(x0, y0 + 4, x0, gy + 28, 'stroke-width="1.5"') +
				linie(ein, 'stroke-width="1.2" stroke-dasharray="4 3"') +
				linie(kurve((t) => (t < 0 ? 0 : f(t)), -0.5, tmax, X, Y), `stroke="${AKZENT}" stroke-width="2.5"`);
		};
		const pt2 = (t) => { const D = 0.3, w = 2, wd = w * Math.sqrt(1 - D * D); return 1 - (Math.exp(-D * w * t) / Math.sqrt(1 - D * D)) * Math.sin(wd * t + Math.acos(D)); };
		speichere('mtrs/sprungantworten.svg', 680, 300, 'Sprungantworten der Übertragungsglieder P, I, PT1, PT2 schwingend, PT2 aperiodisch und Totzeit',
			feld(0, 0, 'P', () => 0.7) + feld(225, 0, 'I', (t) => Math.min(t * 0.25, 1.35)) + feld(450, 0, 'PT1', (t) => 1 - Math.exp(-t)) +
			feld(0, 140, 'PT2 (D &lt; 1)', pt2) + feld(225, 140, 'PT2 (D ≥ 1)', (t) => 1 - (1 + t / 0.6) * Math.exp(-t / 0.6)) +
			feld(450, 140, 'Totzeit', (t) => (t >= 1.5 ? 1 : 0)) + text(340, 292, 'gestrichelt: Eingangssprung · farbig: Ausgang', 'middle', 'font-size="11"'));
	}

	// R4) Wendetangente
	{
		const x0 = 60, y0 = 240, b = 440, h = 180, T = 9, X = (t) => x0 + (t / T) * b, Y = (v) => y0 - v * h;
		const y = (t) => 1 - Math.exp(-t) * (1 + t + (t * t) / 2);
		const tw = 2, m = (tw * tw * Math.exp(-tw)) / 2, yw = y(tw), Tu = tw - yw / m, Te = tw + (1 - yw) / m;
		speichere('mtrs/wendetangente.svg', 560, 285, 'Wendetangentenverfahren: Verzugszeit Tu und Ausgleichszeit Tg',
			achsen(x0, y0, x0 + b + 20, 20, sym('t'), sym('y')) + strich(x0, Y(1), x0 + b, Y(1), 'stroke-width="1" stroke-dasharray="4 3"') +
			text(x0 + b, Y(1) - 6, 'Endwert', 'end', klein) +
			linie(kurve(y, 0, T, X, Y), `stroke="${AKZENT}" stroke-width="2.5"`) +
			strich(X(Tu), Y(0), X(Te), Y(1), `stroke="${ORANGE}" stroke-width="2"`) + punkt(X(tw), Y(yw)) + text(X(tw) + 12, Y(yw) + 14, 'Wendepunkt', 'start', klein) +
			mass(x0, y0 + 14, X(Tu), y0 + 14) + text((x0 + X(Tu)) / 2, y0 + 32, sym('T', 'u'), 'middle', klein) +
			mass(X(Tu), y0 + 14, X(Te), y0 + 14) + text((X(Tu) + X(Te)) / 2, y0 + 32, sym('T', 'g'), 'middle', klein) +
			gestrichelt(X(Te), Y(1), X(Te), y0));
	}

	// R5) Bode-Diagramm des offenen Kreises: G0 = 1/(s(1+0,5 s))
	{
		const x0 = 80, b = 440, l0 = -1.3, l1 = 1.3, X = (lw) => x0 + ((lw - l0) / (l1 - l0)) * b;
		const betrag = (w) => -20 * Math.log10(w * Math.hypot(1, 0.5 * w)), phase = (w) => -90 - (Math.atan(0.5 * w) * 180) / Math.PI;
		const Yb = (db) => 110 - db * 2.2;
		const Yp = (deg) => 200 - (deg + 90) * 1.2;
		const wD = 0.91, xD = X(Math.log10(wD));
		let g = '';
		for (const lw of [-1, 0, 1]) g += strich(X(lw), 330, X(lw), 336) + text(X(lw), 350, ['0,1', '1', '10'][lw + 1], 'middle', 'font-size="11"');
		speichere('mtrs/bode-phasenreserve.svg', 560, 370, 'Bode-Diagramm des offenen Kreises mit Durchtrittsfrequenz und Phasenreserve',
			strich(x0, 15, x0, 330) + strich(x0, 330, x0 + b, 330) + g + text(x0 + b, 364, sym('ω') + ' in 1/s', 'end', klein) +
			strich(x0, Yb(0), x0 + b, Yb(0), 'stroke-width="1"') + text(x0 - 6, Yb(0) + 4, '0 dB', 'end', 'font-size="11"') +
			text(x0 - 6, Yb(20) + 4, '20 dB', 'end', 'font-size="11"') + text(x0 - 6, Yb(-20) + 4, '−20 dB', 'end', 'font-size="11"') +
			linie(kurve((lw) => betrag(10 ** lw), l0, l1, X, Yb), `stroke="${AKZENT}" stroke-width="2.5"`) +
			text(X(-1.15), Yb(betrag(10 ** -1.15)) + 22, '|' + sym('G', '0') + '|', 'start', `fill="${AKZENT}"`) +
			strich(x0, Yp(-90), x0 + b, Yp(-90), 'stroke-width="1" stroke-dasharray="4 3"') + text(x0 - 6, Yp(-90) + 4, '−90°', 'end', 'font-size="11"') +
			strich(x0, Yp(-180), x0 + b, Yp(-180), 'stroke-width="1.5"') + text(x0 - 6, Yp(-180) + 4, '−180°', 'end', 'font-size="11"') +
			linie(kurve((lw) => phase(10 ** lw), l0, l1, X, Yp), `stroke="${ORANGE}" stroke-width="2.5"`) +
			text(X(1.1), Yp(phase(10 ** 1.1)) - 10, sym('φ', '0'), 'middle', `fill="${ORANGE}"`) +
			gestrichelt(xD, Yb(0), xD, 330) + punkt(xD, Yb(0)) + text(xD + 6, Yb(0) - 8, sym('ω', 'D'), 'start') +
			mass(xD + 14, Yp(phase(wD)), xD + 14, Yp(-180)) +
			text(xD + 22, (Yp(phase(wD)) + Yp(-180)) / 2 + 4, sym('φ', 'R') + ' ≈ 65°', 'start', klein));
	}

	// R6) Regelverlauf P und PI (Simulation PT2-Strecke Ks = 2, T1 = 2 s, T2 = 0,5 s)
	{
		const sim = (KP, TN) => {
			const dt = 0.002; let x1 = 0, x2 = 0, I = 0; const pts = [];
			for (let k = 0; k <= 5000; k++) {
				const t = k * dt, e = 1 - x2; if (TN) I += (KP / TN) * e * dt; const u = KP * e + I;
				x1 += (dt * (2 * u - x1)) / 2; x2 += (dt * (x1 - x2)) / 0.5;
				if (k % 10 === 0) pts.push([t, x2]);
			}
			return pts;
		};
		const x0 = 60, y0 = 240, b = 440, h = 180, X = (t) => x0 + (t / 10) * b, Y = (v) => y0 - v * h;
		const zu = (pts) => pts.map(([t, v]) => [+X(t).toFixed(2), +Y(v).toFixed(2)]);
		speichere('mtrs/regelverlauf-p-pi.svg', 560, 290, 'Sollwertsprung: P-Regler mit bleibender Regelabweichung, PI-Regler ohne',
			achsen(x0, y0, x0 + b + 20, 20, sym('t') + ' in s', sym('y')) +
			strich(x0, Y(1), x0 + b, Y(1), 'stroke-width="1.5" stroke-dasharray="6 4"') + text(x0 - 6, Y(1) + 4, sym('w'), 'end', klein) +
			linie(zu(sim(2, 0)), 'stroke-width="2.5"') + linie(zu(sim(1, 2)), `stroke="${AKZENT}" stroke-width="2.5"`) +
			mass(X(9), Y(1), X(9), Y(0.8)) + text(X(9) - 8, Y(0.9) + 4, sym('e', '∞') + ' = 20 %', 'end', klein) +
			text(X(10), y0 + 20, '10', 'middle', 'font-size="11"') + text(X(5), y0 + 20, '5', 'middle', 'font-size="11"') +
			legende(300, 170, [['P-Regler, ' + sym('K', 'P') + ' = 2', 'currentColor'], ['PI-Regler (Betragsoptimum)', AKZENT]]));
	}
}

// =====================================================================
// DESIGNSYSTEM-ENTWURF: Dioden-Theorie mit farbigen Signalwegen
// Farben kommen aus dem Designsystem (--ds-signal-1/2), mit Ersatzfarbe für andere Seiten.
// =====================================================================
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';

	// ---------- Brückengleichrichter: Stromweg je Halbwelle ----------
	const o = 40, u = 220, xl = 110, xr = 230, m = 130, xL = 360;
	const blass = (inhalt) => `<g opacity="0.35">${inhalt}</g>`;
	const wechselquelle = () => {
		const xm = (xl + xr) / 2;
		return strich(xl, m, xm - 18, m) + strich(xm + 18, m, xr, m) + `<circle cx="${xm}" cy="${m}" r="18"/>` +
			`<path d="M${xm - 11},${m} q5.5,-12 11,0 t11,0"/>`;
	};
	/** Stromweg: breites, halbtransparentes Band hinter den Leitungen + Richtungspfeile */
	const weg = (pts, farbe, pfeile) =>
		`<polyline points="${p(pts)}" stroke="${farbe}" stroke-width="10" stroke-opacity="0.28" stroke-linejoin="round"/>` +
		pfeile.map(([x1, y1, x2, y2]) => spitze(x1, y1, x2, y2, farbe)).join('');

	function bruecke(halbwelle) {
		const pos = halbwelle === 'positiv';
		const farbe = pos ? S1 : S2;
		// leitende Dioden: positiv D1 (links oben) und D4 (rechts unten), negativ D2 und D3
		const d1 = diode(xl, m, xl, o), d2 = diode(xr, m, xr, o), d3 = diode(xl, u, xl, m), d4 = diode(xr, u, xr, m);
		const pfad = pos
			? [[xl, m], [xl, o], [xL, o], [xL, u], [xr, u], [xr, m], [xl, m]]
			: [[xr, m], [xr, o], [xL, o], [xL, u], [xl, u], [xl, m], [xr, m]];
		const pfeile = pos
			? [[xl, 70, xl, 58], [280, o, 296, o], [xL, 150, xL, 166], [300, u, 284, u], [xr, 196, xr, 184]]
			: [[xr, 70, xr, 58], [280, o, 296, o], [xL, 150, xL, 166], [180, u, 164, u], [xl, 196, xl, 184]];
		const titel = pos
			? 'Brückengleichrichter, positive Halbwelle: Strom über D1, Last und D4'
			: 'Brückengleichrichter, negative Halbwelle: Strom über D2, Last und D3';
		speichere(`elektronik/bruecke-${halbwelle}.svg`, 460, 262, titel,
			weg(pfad, farbe, pfeile) +
			(pos ? d1 + d4 + blass(d2 + d3) : d2 + d3 + blass(d1 + d4)) +
			text(xl - 18, 88, sym('D', '1'), 'end') + text(xr + 18, 88, sym('D', '2'), 'start') +
			text(xl - 18, 178, sym('D', '3'), 'end') + text(xr + 18, 178, sym('D', '4'), 'start') +
			punkt(xl, m) + punkt(xr, m) + wechselquelle() +
			text(xl + 8, m - 10, pos ? '+' : '−', 'start', 'font-weight="700"') +
			text(xr - 8, m - 10, pos ? '−' : '+', 'end', 'font-weight="700"') +
			text((xl + xr) / 2, m + 38, sym('u', '~')) +
			draht([xl, o], [xL, o]) + draht([xl, u], [xL, u]) + punkt(xr, o) + punkt(xr, u) +
			widerstand(xL, o, xL, u) + neben(xL, 130, 'R', 'L') +
			pfeil(420, 90, 420, 170) + text(428, 135, sym('u', 'a'), 'start') +
			text(xL + 12, o - 8, '+', 'start') + text(xL + 12, u + 20, '−', 'start') +
			text(230, 254, pos ? 'positive Halbwelle: D1 und D4 leiten' : 'negative Halbwelle: D2 und D3 leiten', 'middle',
				`font-size="13" font-weight="600" fill="${farbe}"`),
		);
	}
	bruecke('positiv');
	bruecke('negativ');

	// ---------- Spannungsverlauf mit Ladekondensator (Brücke, 50 Hz) ----------
	// Modell: ideale Dioden, Spitzenwert 1, Entladung über R_L mit τ = R_L·C = 67 ms (ergibt ΔU ≈ 14 %).
	{
		const x0 = 60, y0 = 230, bx = 560 / 40, by = 170; // 40 ms auf 560 px, Spitzenwert 1 auf 170 px
		const X = (t) => x0 + t * bx, Y = (v) => y0 - v * by;
		const tau = 66.7, dt = 0.02;
		const gl = [], uc = [];
		let v = 0, vmin = 1, tmin = 0;
		for (let t = 0; t <= 40 + 1e-9; t += dt) {
			const s = Math.abs(Math.sin((2 * Math.PI * t) / 20));
			v = Math.max(s, v * Math.exp(-dt / tau));
			gl.push([X(t).toFixed(1), Y(s).toFixed(1)]);
			uc.push([X(t).toFixed(1), Y(v).toFixed(1)]);
			if (t > 10 && t < 20 && v < vmin) { vmin = v; tmin = t; }
		}
		const ymin = Y(vmin), ymax = Y(1);
		const klein = 'font-size="12"';
		speichere('elektronik/glaettung-verlauf.svg', 660, 290,
			`Spannungsverlauf am Brückengleichrichter mit Ladekondensator: gleichgerichtete Spannung und geglättete Ausgangsspannung mit Brummspannung von etwa ${Math.round((1 - vmin) * 100)} Prozent`,
			pfeil(x0, y0, x0 + 590, y0) + pfeil(x0, y0 + 10, x0, 25) +
			text(x0 + 590, y0 + 20, sym('t'), 'end') + text(x0 - 10, 34, sym('u'), 'end') +
			[10, 20, 30, 40].map((t) => strich(X(t), y0 - 4, X(t), y0 + 4) + text(X(t), y0 + 20, `${t} ms`, 'middle', 'font-size="11"')).join('') +
			`<polyline points="${p(gl)}" stroke-width="1.75" stroke-dasharray="5 4" opacity="0.7"/>` +
			`<polyline points="${p(uc)}" stroke="${S1}" stroke-width="3"/>` +
			// ΔU zwischen Spitze und Minimum
			strich(X(5) - 10, ymax, X(tmin) + 40, ymax, 'stroke-width="1" stroke-dasharray="2 3"') +
			strich(X(tmin) - 10, ymin, X(tmin) + 40, ymin, 'stroke-width="1" stroke-dasharray="2 3"') +
			mass(X(tmin) + 32, ymax, X(tmin) + 32, ymin) + text(X(tmin) + 40, (ymax + ymin) / 2 + 5, 'Δ' + sym('U', '', false), 'start') +
			// û_a
			strich(x0 - 4, ymax, x0 + 4, ymax) + text(x0 - 8, ymax + 5, sym('û', 'a'), 'end') +
			// Erklärungen in freien Flächen: „Nachladen“ über der Spitze bei 25 ms, „Entladen“ in der Lücke bei 30 ms
			text(X(24.3), Y(1) - 22, 'Nachladen', 'middle', `${klein} fill="${S1}" font-weight="600"`) +
			pfeil(X(24.3), Y(1) - 16, X(24.3), Y(1) - 4, S1) +
			text(X(30), Y(0.72), 'Entladen', 'middle', klein) + text(X(30), Y(0.72) + 15, 'über ' + sym('R', 'L'), 'middle', klein) +
			pfeil(X(30), Y(0.72) - 13, X(30), Y(0.86) + 2) +
			legendeZeile(x0 + 10, 270, S1),
		);
		function legendeZeile(x, y, farbe) {
			return strich(x, y - 4, x + 28, y - 4, `stroke="${farbe}" stroke-width="3"`) + text(x + 36, y, sym('u', 'a') + ' mit Ladekondensator', 'start', klein) +
				strich(x + 250, y - 4, x + 278, y - 4, 'stroke-width="1.75" stroke-dasharray="5 4"') + text(x + 286, y, 'gleichgerichtet, ohne Kondensator', 'start', klein);
		}
	}
}

// =====================================================================
// TRANSISTOR-GRUNDSCHALTUNGEN UND DIFFERENZVERSTÄRKER  →  src/assets/elektronik/
// =====================================================================
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const klein = 'font-size="13"';
	/** NPN gespiegelt (Basis rechts): Mitte (x,y), Basis (x+32,y), Kollektor (x,y-32), Emitter (x,y+32) */
	const npnR = (x, y) => `<g transform="translate(${2 * x},0) scale(-1,1)">${npn(x, y)}</g>`;
	const masseZ = (x, y) => masse(x, y);
	/** Spannungspfeil mit Beschriftung (senkrecht, von oben nach unten) */
	const upfeil = (x, y1, y2, name, idx, seite = 'rechts') =>
		pfeil(x, y1, x, y2) + text(seite === 'rechts' ? x + 8 : x - 8, (y1 + y2) / 2 + 5, sym(name, idx), seite === 'rechts' ? 'start' : 'end');

	// ---------- T1) Emitterschaltung mit Spannungsteiler ----------
	{
		const o = 30, u = 290, xb = 150, xt = 270, yb = 160, xa = 420;
		speichere('elektronik/emitterschaltung.svg', 520, 330, 'Emitterschaltung mit Basisspannungsteiler, Emitterwiderstand, Koppelkondensatoren und Last',
			draht([xb, o], [xa - 60, o]) + text(xa - 50, o + 5, '+' + sym('U', 'B'), 'start') +
			// Basisspannungsteiler
			widerstand(xb, o, xb, yb) + neben(xb, 95, 'R', '1', 'links') + widerstand(xb, yb, xb, u) + neben(xb, 225, 'R', '2', 'links') +
			punkt(xb, yb) + draht([xb, yb], [xt - 32, yb]) + stromspitze(215, yb, 'r') + text(215, yb - 10, sym('I', 'B')) +
			// Eingang
			klemme(30, yb) + draht([34, yb], [70, yb]) + kondensator(70, yb, 115, yb) + text(92, yb - 22, sym('C', 'K')) + draht([115, yb], [xb, yb]) +
			upfeil(30, yb + 20, u - 20, 'u', 'e', 'links') + klemme(30, u) +
			// Transistor, Kollektor- und Emitterzweig
			npn(xt, yb) + text(xt + 22, yb + 5, 'T', 'start') +
			widerstand(xt, o, xt, 110) + neben(xt, 70, 'R', 'C') + draht([xt, 110], [xt, yb - 32]) + punkt(xt, 110) +
			stromspitze(xt, 52, 'u') + text(xt - 10, 54, sym('I', 'C'), 'end') +
			draht([xt, yb + 32], [xt, 205]) + punkt(xt, 205) + widerstand(xt, 205, xt, u) + neben(xt, 250, 'R', 'E', 'links') +
			draht([xt, 205], [330, 205]) + kondensator(330, 205, 330, u) + text(348, 252, sym('C', 'E'), 'start') + punkt(330, u) +
			// Ausgang
			draht([xt, 110], [305, 110]) + kondensator(305, 110, 355, 110) + text(330, 88, sym('C', 'A')) + draht([355, 110], [xa, 110]) +
			widerstand(xa, 110, xa, u) + neben(xa, 200, 'R', 'L') + punkt(xa, 110) + upfeil(480, 130, 270, 'u', 'a') +
			draht([34, u], [xa, u]) + punkt(xb, u) + punkt(xt, u) + masseZ(225, u) +
			pfeil(xt + 45, yb - 20, xt + 45, yb + 24) + text(xt + 53, yb + 6, sym('U', 'CE'), 'start', klein),
		);
	}

	// ---------- T2) Kollektorschaltung (Emitterfolger) ----------
	{
		const o = 30, u = 290, xb = 150, xt = 270, yb = 140, xa = 420;
		speichere('elektronik/kollektorschaltung.svg', 520, 330, 'Kollektorschaltung (Emitterfolger): Ausgang am Emitter, Kollektor direkt an der Versorgung',
			draht([xb, o], [xt, o]) + text(xt + 10, o + 5, '+' + sym('U', 'B'), 'start') +
			widerstand(xb, o, xb, yb) + neben(xb, 85, 'R', '1', 'links') + widerstand(xb, yb, xb, u) + neben(xb, 215, 'R', '2', 'links') +
			punkt(xb, yb) + draht([xb, yb], [xt - 32, yb]) +
			klemme(30, yb) + draht([34, yb], [70, yb]) + kondensator(70, yb, 115, yb) + text(92, yb - 22, sym('C', 'K')) + draht([115, yb], [xb, yb]) +
			upfeil(30, yb + 20, u - 20, 'u', 'e', 'links') + klemme(30, u) +
			npn(xt, yb) + draht([xt, o], [xt, yb - 32]) + punkt(xt, o) +
			draht([xt, yb + 32], [xt, 195]) + punkt(xt, 195) + widerstand(xt, 195, xt, u) + neben(xt, 245, 'R', 'E', 'links') +
			draht([xt, 195], [305, 195]) + kondensator(305, 195, 355, 195) + text(330, 224, sym('C', 'A')) + draht([355, 195], [xa, 195]) +
			widerstand(xa, 195, xa, u) + neben(xa, 245, 'R', 'L') + punkt(xa, 195) + upfeil(480, 210, 275, 'u', 'a') +
			draht([34, u], [xa, u]) + punkt(xb, u) + punkt(xt, u) + masseZ(225, u) +
			pfeil(xt + 40, yb + 4, xt + 40, yb + 46) + text(xt + 48, yb + 30, sym('U', 'BE'), 'start', klein),
		);
	}

	// ---------- T3) Basisschaltung ----------
	{
		const o = 30, u = 290, xb = 150, xt = 270, yb = 150, xa = 420;
		speichere('elektronik/basisschaltung.svg', 520, 330, 'Basisschaltung: Basis über Kondensator an Masse, Eingang am Emitter, Ausgang am Kollektor',
			draht([xb, o], [xa - 60, o]) + text(xa - 50, o + 5, '+' + sym('U', 'B'), 'start') +
			widerstand(xb, o, xb, yb) + neben(xb, 90, 'R', '1', 'links') + widerstand(xb, yb, xb, u) + neben(xb, 220, 'R', '2', 'links') +
			punkt(xb, yb) + draht([xb, yb], [xt - 32, yb]) + draht([200, yb], [200, 215]) + punkt(200, yb) +
			kondensator(200, 215, 200, u) + text(186, 252, sym('C', 'B'), 'end') + punkt(200, u) +
			npn(xt, yb) +
			widerstand(xt, o, xt, 105) + neben(xt, 68, 'R', 'C') + draht([xt, 105], [xt, yb - 32]) + punkt(xt, 105) +
			draht([xt, yb + 32], [xt, 215]) + punkt(xt, 215) + widerstand(xt, 215, xt, u) + neben(xt, 255, 'R', 'E') +
			// Eingang am Emitter (von rechts unten)
			draht([xt, 215], [330, 215]) + kondensator(330, 215, 375, 215) + text(352, 193, sym('C', 'K')) + draht([375, 215], [470, 215]) + klemme(474, 215) +
			upfeil(474, 230, u - 15, 'u', 'e') +
			draht([xt, 105], [305, 105]) + kondensator(305, 105, 350, 105) + text(328, 83, sym('C', 'A')) + draht([350, 105], [470, 105]) + klemme(474, 105) +
			text(484, 110, sym('u', 'a'), 'start') +
			draht([xb, u], [478, u]) + klemme(474, u) + punkt(xb, u) + punkt(xt, u) + masseZ(240, u),
		);
	}

	// ---------- T4) Ausgangskennlinienfeld mit Arbeitsgerade ----------
	{
		const x0 = 70, y0 = 280, sx = 36, sy = 100; // 1 V = 36 px, 1 mA = 100 px
		const X = (U) => x0 + U * sx, Y = (I) => y0 - I * sy;
		// idealisiert: B = 200, ohne Early-Effekt (waagrechte Kennlinien), ib in mA → I_C in mA
		const ic = (ib, U) => 200 * ib * (1 - Math.exp(-U / 0.08));
		let kurven = '';
		for (const ibu of [2, 4, 6, 8, 10]) {
			const pts = [];
			for (let U = 0; U <= 12.5; U += 0.05) pts.push([X(U).toFixed(1), Y(ic(ibu / 1000, U)).toFixed(1)]);
			kurven += `<polyline points="${p(pts)}" stroke-width="1.75"/>` + text(X(12.6), Y(ic(ibu / 1000, 12.5)) + 4, `${ibu} µA`, 'start', 'font-size="11"');
		}
		// Arbeitsgerade U_B = 12 V, R_C + R_E = 5,7 kΩ  →  I_C = (12 V − U_CE)/5,7 kΩ
		const gerade = (U) => (12 - U) / 5.7;
		// Schnittpunkt mit der Kennlinie I_B = 6 µA
		let ua = 0;
		for (let U = 0; U < 12; U += 0.001) if (ic(0.00578, U) >= gerade(U)) { ua = U; break; }
		const apKurve = [];
		for (let U = 0; U <= 12.5; U += 0.05) apKurve.push([X(U).toFixed(1), Y(ic(0.00578, U)).toFixed(1)]);
		const ia = gerade(ua);
		speichere('elektronik/kennlinienfeld-arbeitsgerade.svg', 600, 330,
			`Ausgangskennlinienfeld eines NPN-Transistors (idealisiert, B = 200) mit Arbeitsgerade für 12 V und 5,7 kΩ; Arbeitspunkt bei etwa ${ua.toFixed(1).replace('.', ',')} V und ${ia.toFixed(2).replace('.', ',')} mA`,
			pfeil(x0, y0, x0 + 490, y0) + pfeil(x0, y0, x0, 25) + text(x0 + 490, y0 + 36, sym('U', 'CE') + ' in V', 'end') + text(x0 - 10, 34, sym('I', 'C') + ' in mA', 'end') +
			[2, 4, 6, 8, 10, 12].map((U) => strich(X(U), y0 - 4, X(U), y0 + 4) + text(X(U), y0 + 18, String(U), 'middle', 'font-size="11"')).join('') +
			[0.5, 1, 1.5, 2].map((I) => strich(x0 - 4, Y(I), x0 + 4, Y(I)) + text(x0 - 8, Y(I) + 4, String(I).replace('.', ','), 'end', 'font-size="11"')).join('') +
			kurven + text(X(12.6), 52, sym('I', 'B') + ' =', 'start', 'font-size="11"') +
			`<polyline points="${p(apKurve)}" stroke="${S2}" stroke-width="2" stroke-dasharray="6 4"/>` +
			text(X(8.4), Y(1.156) - 8, sym('I', 'B') + ' ≈ 5,8 µA', 'start', `font-size="11" fill="${S2}"`) +
			`<polyline points="${p([[X(0), Y(gerade(0))], [X(12), Y(0)]])}" stroke="${S1}" stroke-width="2.5"/>` +
			text(X(2.2), Y(gerade(2.2)) + 18, 'Arbeitsgerade', 'start', `font-size="12" fill="${S1}" font-weight="600"`) +
			`<circle cx="${X(ua)}" cy="${Y(ia)}" r="6" fill="${S2}" stroke="none"/>` + text(X(ua) + 10, Y(ia) - 10, 'AP', 'start', `font-weight="700" fill="${S2}"`) +
			strich(X(ua), Y(ia), X(ua), y0, 'stroke-width="1" stroke-dasharray="3 3"') + strich(x0, Y(ia), X(ua), Y(ia), 'stroke-width="1" stroke-dasharray="3 3"') +
			text(X(0) + 12, Y(gerade(0)) - 12, sym('U', 'B') + '/(' + sym('R', 'C') + ' + ' + sym('R', 'E') + ')', 'start', 'font-size="11"') +
			text(X(12), y0 - 8, sym('U', 'B'), 'middle', 'font-size="11"'),
		);
		console.log(`  Arbeitspunkt im Kennlinienfeld: U_CE = ${ua.toFixed(2)} V, I_C = ${ia.toFixed(3)} mA`);
	}

	// ---------- T5) Kleinsignal-Ersatzschaltbild der Emitterschaltung ----------
	{
		const o = 50, u = 210;
		speichere('elektronik/kleinsignal-emitterschaltung.svg', 560, 250,
			'Kleinsignal-Ersatzschaltbild der Emitterschaltung mit überbrücktem Emitterwiderstand: Eingang mit R1 parallel R2 parallel rBE, Ausgang mit gesteuerter Stromquelle beta mal iB parallel RC und RL',
			klemme(30, o) + klemme(30, u) + upfeil(30, o + 18, u - 18, 'u', 'e', 'links') +
			draht([34, o], [270, o]) + draht([34, u], [520, u]) +
			widerstand(110, o, 110, u) + neben(110, 130, 'R', '1') + punkt(110, o) + punkt(110, u) +
			widerstand(180, o, 180, u) + neben(180, 130, 'R', '2') + punkt(180, o) + punkt(180, u) +
			widerstand(260, o, 260, u) + neben(260, 130, 'r', 'BE') + stromspitze(260, 84, 'u') + text(272, 84, sym('i', 'B'), 'start', klein) +
			text(110, 30, 'B', 'middle', 'font-weight="700"') + text(260, 236, 'E', 'middle', 'font-weight="700"') +
			// Ausgang
			draht([360, o], [520, o]) + squelle(360, u, 360, o) + text(334, 132, 'β·' + sym('i', 'B'), 'end') + stromspitze(360, 100, 'u') +
			widerstand(440, o, 440, u) + neben(440, 130, 'R', 'C') + punkt(440, o) + punkt(440, u) +
			widerstand(520, o, 520, u) + neben(520, 130, 'R', 'L', 'links') + text(360, 30, 'C', 'middle', 'font-weight="700"') +
			pfeil(550, o + 20, 550, u - 20) + text(545, o + 10, sym('u', 'a'), 'end') + punkt(360, u) +
			strich(300, 40, 300, 225, 'stroke-width="1" stroke-dasharray="4 4"') + text(300, 30, 'Eingang | Ausgang', 'middle', 'font-size="11"'),
		);
	}

	// ---------- T6) Differenzverstärker mit gemeinsamem Emitterwiderstand bzw. Stromquelle ----------
	function diff(name, stromquelle) {
		const o = 30, x1 = 200, x2 = 360, yb = 170, ye = 240, u = 330;
		const unten = stromquelle
			? squelle(280, u, 280, ye) + text(304, 290, sym('I', '0'), 'start') + stromspitze(280, 262, 'u') + text(304, 308, '(Stromquelle)', 'start', klein)
			: widerstand(280, ye, 280, u) + neben(280, 288, 'R', 'E') + stromspitze(280, 262, 'u') + text(266, 264, sym('I', 'E,ges'), 'end', klein);
		speichere(`elektronik/${name}.svg`, 560, 370,
			stromquelle
				? 'Differenzverstärker mit zwei NPN-Transistoren, Kollektorwiderständen und einer Konstantstromquelle im gemeinsamen Emitterzweig'
				: 'Differenzverstärker mit zwei NPN-Transistoren, zwei Kollektorwiderständen und gemeinsamem Emitterwiderstand an der negativen Versorgung',
			draht([x1, o], [x2, o]) + punkt(280, o) + strich(280, o, 280, o - 12) + text(280, o - 16, '+' + sym('U', 'B')) +
			widerstand(x1, o, x1, 115) + neben(x1, 72, 'R', 'C1', 'links') + widerstand(x2, o, x2, 115) + neben(x2, 72, 'R', 'C2') +
			draht([x1, 115], [x1, yb - 32]) + draht([x2, 115], [x2, yb - 32]) + punkt(x1, 115) + punkt(x2, 115) +
			npn(x1, yb) + npnR(x2, yb) + text(x1 + 20, yb + 5, sym('T', '1'), 'start') + text(x2 - 20, yb + 5, sym('T', '2'), 'end') +
			draht([x1, yb + 32], [x1, ye], [x2, ye], [x2, yb + 32]) + punkt(280, ye) +
			stromspitze(x1, 222, 'u') + text(x1 - 8, 225, sym('I', 'E1'), 'end', klein) + stromspitze(x2, 222, 'u') + text(x2 + 8, 225, sym('I', 'E2'), 'start', klein) +
			unten + strich(280, u, 280, u + 8) + text(280, u + 24, '−' + sym('U', 'B')) +
			// Eingänge
			klemme(80, yb) + draht([84, yb], [x1 - 32, yb]) + upfeil(80, yb + 16, 300, 'u', 'e1', 'links') + masse(80, 304) +
			klemme(480, yb) + draht([x2 + 32, yb], [476, yb]) + upfeil(480, yb + 16, 300, 'u', 'e2') + masse(480, 304) +
			// Ausgänge
			draht([x1, 115], [120, 115]) + klemme(116, 115) + text(108, 120, sym('u', 'a1'), 'end') +
			draht([x2, 115], [440, 115]) + klemme(444, 115) + text(452, 120, sym('u', 'a2'), 'start') +
			`<g stroke="${S1}">` + pfeil(x1 + 14, 100, x2 - 14, 100, S1) + `</g>` + text(280, 92, sym('u', 'aD'), 'middle', `fill="${S1}"`),
		);
	}
	diff('differenzverstaerker', false);
	diff('differenzverstaerker-stromquelle', true);
}

// ---------- T7) Differenzverstärker: Stromaufteilung über der Differenzspannung ----------
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const x0 = 310, y0 = 250, sx = 2, sy = 180; // 1 mV = 2 px, I0 = 180 px
	const X = (u) => x0 + u * sx, Y = (a) => y0 - a * sy;
	const UT = 26;
	const i1 = (u) => 1 / (1 + Math.exp(-u / UT)), i2 = (u) => 1 - i1(u);
	const k1 = [], k2 = [];
	for (let u = -140; u <= 140; u += 1) { k1.push([X(u).toFixed(1), Y(i1(u)).toFixed(1)]); k2.push([X(u).toFixed(1), Y(i2(u)).toFixed(1)]); }
	const kl = 'font-size="11"';
	speichere('elektronik/differenzverstaerker-kennlinie.svg', 620, 300,
		'Stromaufteilung im Differenzverstärker: Kollektorströme beider Transistoren über der Differenzspannung; linear nur für wenige zehn Millivolt, darüber übernimmt ein Transistor den ganzen Strom',
		pfeil(20, y0, 600, y0) + pfeil(x0, y0 + 10, x0, 30) + text(600, y0 + 36, sym('u', 'D') + ' in mV', 'end') + text(x0 - 8, 40, sym('I', 'C') + '/' + sym('I', '0'), 'end') +
		[-120, -80, -40, 40, 80, 120].map((u) => strich(X(u), y0 - 4, X(u), y0 + 4) + text(X(u), y0 + 18, String(u).replace('-', '−'), 'middle', kl)).join('') +
		[0.5, 1].map((a) => strich(x0 - 4, Y(a), x0 + 4, Y(a)) + text(x0 + 8, Y(a) + 4, String(a).replace('.', ','), 'start', kl)).join('') +
		strich(20, Y(1), 600, Y(1), 'stroke-width="1" stroke-dasharray="3 4"') +
		`<rect x="${X(-26)}" y="${Y(1)}" width="${52 * sx}" height="${sy}" fill="currentColor" opacity="0.07" stroke="none"/>` +
		text(x0, y0 - 6, 'nahezu linear', 'middle', kl) +
		`<polyline points="${p(k1)}" stroke="${S1}" stroke-width="2.5"/>` + `<polyline points="${p(k2)}" stroke="${S2}" stroke-width="2.5" stroke-dasharray="7 4"/>` +
		text(X(45), Y(0.7), sym('I', 'C1') + ' (T1)', 'start', `fill="${S1}" font-weight="600"`) +
		text(X(-45), Y(0.7), sym('I', 'C2') + ' (T2)', 'end', `fill="${S2}" font-weight="600"`) +
		text(X(130), Y(0.06) - 6, 'T1 übernimmt', 'end', kl) + text(X(-130), Y(0.06) - 6, 'T2 übernimmt', 'start', kl),
	);
}

// =====================================================================
// KIPPSTUFEN  →  src/assets/elektronik/
// =====================================================================
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const kl = 'font-size="12"';
	const npnR = (x, y) => `<g transform="translate(${2 * x},0) scale(-1,1)">${npn(x, y)}</g>`;

	/** Zeitdiagramm-Spur: Grundlinie, Beschriftung links, Kurve */
	function spur(y0, hoehe, name, pts, farbe = 'currentColor', extra = '') {
		return strich(70, y0, 600, y0, 'stroke-width="1" opacity="0.5"') + text(62, y0 - hoehe / 2 + 5, name, 'end') +
			`<polyline points="${p(pts)}" stroke="${farbe}" stroke-width="2.25" ${extra}/>`;
	}

	// ---------- K1) Astabile Kippstufe (Multivibrator) mit zwei Transistoren ----------
	{
		const o = 40, u = 330, xa = 100, xb1 = 190, xb2 = 350, xc = 440, yt = 270;
		speichere('elektronik/multivibrator.svg', 540, 370,
			'Astabile Kippstufe mit zwei NPN-Transistoren: Kollektorwiderstände, Basiswiderstände und zwei über Kreuz geschaltete Kondensatoren',
			draht([xa, o], [xc, o]) + text(270, o - 12, '+' + sym('U', 'B')) + strich(270, o, 270, o - 4) + punkt(xb1, o) + punkt(xb2, o) +
			widerstand(xa, o, xa, 160) + neben(xa, 100, 'R', 'C1', 'links') + widerstand(xc, o, xc, 160) + neben(xc, 100, 'R', 'C2') +
			widerstand(xb1, o, xb1, 150) + neben(xb1, 95, 'R', 'B1', 'links') + widerstand(xb2, o, xb2, 150) + neben(xb2, 95, 'R', 'B2') +
			draht([xa, 160], [xa, yt - 32]) + draht([xc, 160], [xc, yt - 32]) +
			npnR(xa, yt) + npn(xc, yt) + text(xa - 24, yt + 5, sym('T', '1'), 'end') + text(xc + 24, yt + 5, sym('T', '2'), 'start') +
			// Basisknoten
			draht([xb1, 150], [xb1, yt], [xa + 32, yt]) + punkt(xb1, yt) + draht([xb2, 150], [xb2, yt], [xc - 32, yt]) + punkt(xb2, yt) +
			// C1: Kollektor T1 → Basis T2 ; C2: Kollektor T2 → Basis T1
			punkt(xa, 185) + draht([xa, 185], [245, 185]) + kondensator(245, 185, 295, 185) + draht([295, 185], [xb2, 185]) + punkt(xb2, 185) + text(270, 168, sym('C', '1')) +
			punkt(xc, 220) + draht([xc, 220], [295, 220]) + kondensator(295, 220, 245, 220) + draht([245, 220], [xb1, 220]) + punkt(xb1, 220) + text(270, 245, sym('C', '2')) +
			// Emitter an Masse
			draht([xa, yt + 32], [xa, u], [xc, u], [xc, yt + 32]) + masse(270, u) +
			// Ausgänge
			draht([xc, 160], [500, 160]) + klemme(504, 160) + text(504, 148, sym('u', 'a'), 'middle') + punkt(xc, 160) +
			text(xa + 12, yt - 34, 'K1', 'start', 'font-size="11"') + text(xc - 12, yt - 34, 'K2', 'end', 'font-size="11"'),
		);
	}

	// ---------- K2) Zeitdiagramm der astabilen Kippstufe (berechnet) ----------
	{
		// Modell: U_B = 5 V, Transistor ein: U_CE = 0,1 V, U_BE = 0,7 V; τ_B = R_B·C, τ_C = R_C·C = 0,1·τ_B (symmetrisch)
		const UB = 5, Usat = 0.1, Ube = 0.7, tauB = 1, tauC = 0.1;
		// Kippzeit: u_BE läuft von (U_BE − (U_B − U_sat)) Richtung U_B bis U_BE
		const ustart = Ube - (UB - Usat);
		const tk = tauB * Math.log((UB - ustart) / (UB - Ube));
		const T = 2 * tk;
		const X = (t) => 80 + (t / (3 * T)) * 500;
		const sp = 26; // px pro Volt (Basisspannung)
		const spC = 14; // px pro Volt (Kollektorspannungen)
		const ys = [105, 215, 330];
		// Zustand: T1 leitet in [0, tk), T2 leitet in [tk, 2tk) usw.
		const uCE = (t, nr) => {
			const phase = Math.floor(t / tk), tr = t - phase * tk;
			const t1an = phase % 2 === 0;
			const an = nr === 1 ? t1an : !t1an;
			return an ? Usat : UB - (UB - Ube) * Math.exp(-tr / tauC);
		};
		const uBE2 = (t) => {
			const phase = Math.floor(t / tk), tr = t - phase * tk;
			const t1an = phase % 2 === 0;
			return t1an ? UB - (UB - ustart) * Math.exp(-tr / tauB) : Ube;
		};
		const pts = (f, y0, m = sp) => {
			const a = [];
			for (let t = 0; t <= 3 * T; t += T / 600) a.push([X(t).toFixed(1), (y0 - f(t) * m).toFixed(1)]);
			return a;
		};
		const y3 = ys[2];
		speichere('elektronik/multivibrator-signale.svg', 640, 490,
			`Zeitdiagramm der astabilen Kippstufe (berechnet für 5 V): Kollektorspannungen von T1 und T2 als Rechteck, Basisspannung von T2 springt beim Umschalten auf etwa minus 4,2 V und steigt dann bis 0,7 V`,
			spur(ys[0], 5 * spC, sym('u', 'CE1'), pts((t) => uCE(t, 1), ys[0], spC), S1) +
			spur(ys[1], 5 * spC, sym('u', 'CE2'), pts((t) => uCE(t, 2), ys[1], spC), S2) +
			strich(70, y3, 600, y3, 'stroke-width="1" opacity="0.5"') + text(62, y3 - 20, sym('u', 'BE2'), 'end') +
			`<polyline points="${p(pts(uBE2, y3))}" stroke="currentColor" stroke-width="2.25"/>` +
			strich(80, y3 - Ube * sp, 600, y3 - Ube * sp, 'stroke-width="1" stroke-dasharray="4 4"') + text(604, y3 - Ube * sp + 4, '0,7 V', 'start', 'font-size="11"') +
			text(604, y3 - ustart * sp + 4, (ustart).toFixed(1).replace('.', ',').replace('-', '−') + ' V', 'start', 'font-size="11"') +
			strich(80, y3 - ustart * sp, 600, y3 - ustart * sp, 'stroke-width="1" stroke-dasharray="2 5" opacity="0.6"') +
			[ys[0], ys[1]].map((y) => text(604, y - UB * spC + 4, '5 V', 'start', 'font-size="11"')).join('') +
			// Kippzeit markieren
			mass(X(0), 458, X(tk), 458) + text((X(0) + X(tk)) / 2, 478, sym('t', '1') + ' ≈ 0,76 ' + sym('R', 'B2') + sym('C', '1') + ' (bei 5 V)', 'middle', kl) +
			mass(X(0), 18, X(T), 18) + text((X(0) + X(T)) / 2, 12, 'Periodendauer ' + sym('T'), 'middle', kl) +
			[1, 2, 3, 4, 5].map((k) => strich(X(k * tk), 30, X(k * tk), 445, 'stroke-width="1" stroke-dasharray="1 5" opacity="0.5"')).join('') +
			text(X(tk * 0.5), ys[0] + 18, 'T1 leitet', 'middle', 'font-size="11"') + text(X(tk * 1.5), ys[0] + 18, 'T1 sperrt', 'middle', 'font-size="11"'),
		);
		console.log(`  Multivibrator: Kippzeit t1 = ${(tk / tauB).toFixed(3)}·R_B·C bei U_B = 5 V (ln 2 = 0,693)`);
	}

	// ---------- 555-Baustein als Kasten ----------
	function ne555(x, y) {
		// Kasten 110×150, Anschlüsse: 8 und 4 oben, 1 und 5 unten, 2 links, 6/7 rechts oben, 3 rechts unten
		const b = 120, h = 150;
		return `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="4"/>` + text(x + b / 2, y + h / 2 + 6, '555', 'middle', 'font-weight="700" font-size="18"') +
			text(x + 30, y + 16, '8', 'middle', 'font-size="10"') + text(x + 80, y + 16, '4', 'middle', 'font-size="10"') +
			text(x + 30, y + h - 6, '1', 'middle', 'font-size="10"') + text(x + 80, y + h - 6, '5', 'middle', 'font-size="10"') +
			text(x + 8, y + 104, '2', 'start', 'font-size="10"') + text(x + b - 8, y + 34, '7', 'end', 'font-size="10"') +
			text(x + b - 8, y + 64, '6', 'end', 'font-size="10"') + text(x + b - 8, y + 114, '3', 'end', 'font-size="10"') +
			text(x + 14, y + 104, 'TRIG', 'start', 'font-size="9"') + text(x + b - 16, y + 34, 'DIS', 'end', 'font-size="9"') +
			text(x + b - 16, y + 64, 'THR', 'end', 'font-size="9"') + text(x + b - 16, y + 114, 'OUT', 'end', 'font-size="9"') +
			text(x + 30, y + 28, 'VCC', 'middle', 'font-size="9"') + text(x + 80, y + 28, 'RST', 'middle', 'font-size="9"') +
			text(x + 30, y + h - 18, 'GND', 'middle', 'font-size="9"') + text(x + 80, y + h - 18, 'CV', 'middle', 'font-size="9"');
	}

	// ---------- K3) Monostabile Kippstufe mit 555 ----------
	{
		const x = 200, y = 90, o = 40, u = 320;
		speichere('elektronik/monoflop-555.svg', 560, 350,
			'Monostabile Kippstufe mit Timer 555: R vom Pluspol an Discharge und Threshold, C an Masse, Trigger mit Pull-up und Taster, Ausgang an Pin 3',
			draht([60, o], [420, o]) + text(240, o - 12, '+' + sym('U', 'B')) +
			ne555(x, y) +
			draht([x + 30, o], [x + 30, y]) + punkt(x + 30, o) + draht([x + 80, o], [x + 80, y]) + punkt(x + 80, o) +
			draht([x + 30, y + 150], [x + 30, u]) + draht([x + 80, y + 150], [x + 80, 260]) + kondensator(x + 80, 260, x + 80, u) +
			text(x + 96, 292, '10 nF', 'start', 'font-size="11"') +
			// R und C an 6/7
			widerstand(380, o, 380, 124) + neben(380, 82, 'R') + punkt(380, o) + draht([380, 124], [380, 184]) +
			draht([x + 120, y + 34], [380, y + 34]) + punkt(380, y + 34) + draht([x + 120, y + 64], [380, y + 64]) + punkt(380, y + 64) +
			kondensator(380, 184, 380, u) + neben(380, 250, 'C') + punkt(380, 184) +
			// Trigger: Pull-up und Taster
			widerstand(80, o, 80, 150) + text(64, 98, '10 kΩ', 'end', 'font-size="11"') + punkt(80, o) + draht([80, 150], [80, y + 104], [x, y + 104]) +
			punkt(80, y + 104) + schalter(80, y + 104, 80, u) + text(66, 260, 'Taster', 'end', 'font-size="11"') +
			// Ausgang
			draht([x + 120, y + 114], [470, y + 114]) + klemme(474, y + 114) + text(484, y + 119, sym('u', 'a'), 'start') +
			draht([60, u], [420, u]) + punkt(x + 30, u) + punkt(x + 80, u) + punkt(380, u) + punkt(80, u) + masse(250, u),
		);
	}

	// ---------- K4) Zeitdiagramm Monoflop ----------
	{
		const tp = 1.1; // t_i = ln3·RC ≈ 1,1 RC, Zeitachse in Einheiten von RC
		const X = (t) => 80 + t * 130; // 0 … 4 RC
		const ys = [100, 210, 320];
		const sp = 12;
		const tr = 0.4; // Triggerzeitpunkt
		const trg = (t) => (t >= tr && t < tr + 0.08 ? 0 : 5);
		const uc = (t) => (t < tr ? 0 : t < tr + tp ? 5 * (1 - Math.exp(-(t - tr))) : 0);
		const ua = (t) => (t >= tr && t < tr + tp ? 5 : 0);
		const pts = (f, y0) => {
			const a = [];
			for (let t = 0; t <= 3.6; t += 0.004) a.push([X(t).toFixed(1), (y0 - f(t) * sp).toFixed(1)]);
			return a;
		};
		speichere('elektronik/monoflop-signale.svg', 640, 380,
			'Zeitdiagramm der monostabilen Kippstufe: kurzer Low-Impuls am Trigger, Ausgang wird für die Zeit 1,1 R C high, Kondensatorspannung steigt bis zwei Drittel der Versorgung und wird dann entladen',
			spur(ys[0], 100, sym('u', 'TRIG'), pts(trg, ys[0])) +
			spur(ys[1], 100, sym('u', 'C'), pts(uc, ys[1]), S1) +
			strich(80, ys[1] - (10 / 3) * sp, 600, ys[1] - (10 / 3) * sp, 'stroke-width="1" stroke-dasharray="4 4"') + text(604, ys[1] - (10 / 3) * sp + 4, '⅔ ' + sym('U', 'B'), 'start', 'font-size="11"') +
			strich(80, ys[0] - (5 / 3) * sp, 600, ys[0] - (5 / 3) * sp, 'stroke-width="1" stroke-dasharray="4 4"') + text(604, ys[0] - (5 / 3) * sp + 4, '⅓ ' + sym('U', 'B'), 'start', 'font-size="11"') +
			spur(ys[2], 100, sym('u', 'a'), pts(ua, ys[2]), S2) +
			mass(X(tr), ys[2] + 26, X(tr + tp), ys[2] + 26) + text((X(tr) + X(tr + tp)) / 2, ys[2] + 46, sym('t', 'i') + ' = ln 3 · ' + sym('R') + sym('C') + ' ≈ 1,1 ' + sym('R') + sym('C'), 'middle', kl) +
			strich(X(tr), 30, X(tr), ys[2], 'stroke-width="1" stroke-dasharray="1 5" opacity="0.6"') + strich(X(tr + tp), 30, X(tr + tp), ys[2], 'stroke-width="1" stroke-dasharray="1 5" opacity="0.6"') +
			text(X(tr) + 8, 30, 'Trigger', 'start', 'font-size="11"') + text(X(tr + tp) + 8, 30, 'Zeit abgelaufen', 'start', 'font-size="11"'),
		);
	}

	// ---------- K5) Bistabile Kippstufe ----------
	{
		const o = 40, u = 340, xa = 100, xk1 = 200, xk2 = 340, xc = 440, yt = 250;
		speichere('elektronik/bistabil.svg', 540, 380,
			'Bistabile Kippstufe mit zwei NPN-Transistoren, über Kreuz geschalteten Widerständen vom Kollektor zur Basis des anderen Transistors und zwei Tastern zum Setzen und Rücksetzen',
			draht([xa, o], [xc, o]) + text(270, o - 12, '+' + sym('U', 'B')) +
			widerstand(xa, o, xa, 150) + neben(xa, 95, 'R', 'C1', 'links') + widerstand(xc, o, xc, 150) + neben(xc, 95, 'R', 'C2') +
			draht([xa, 150], [xa, yt - 32]) + draht([xc, 150], [xc, yt - 32]) +
			npnR(xa, yt) + npn(xc, yt) + text(xa - 24, yt + 5, sym('T', '1'), 'end') + text(xc + 24, yt + 5, sym('T', '2'), 'start') +
			// Querwiderstände: Kollektor T1 → Basis T2, Kollektor T2 → Basis T1
			punkt(xa, 170) + draht([xa, 170], [215, 170]) + `<g>${widerstand(215, 170, 305, 170)}</g>` + draht([305, 170], [xk2, 170], [xk2, yt]) + text(260, 155, sym('R', 'K1')) +
			punkt(xc, 200) + draht([xc, 200], [305, 200]) + widerstand(305, 200, 215, 200) + draht([215, 200], [xk1, 200], [xk1, yt]) + text(260, 225, sym('R', 'K2')) +
			draht([xk1, yt], [xa + 32, yt]) + punkt(xk1, yt) + draht([xk2, yt], [xc - 32, yt]) + punkt(xk2, yt) +
			// Basiswiderstände nach Masse und Taster
			widerstand(xk1, yt, xk1, u) + neben(xk1, 300, 'R', 'B1', 'links') + widerstand(xk2, yt, xk2, u) + neben(xk2, 300, 'R', 'B2') +
			draht([xk1, yt], [235, yt]) + schalter(235, yt, 235, u) + text(250, 312, 'S', 'start', 'font-size="13" font-weight="700"') +
			draht([xk2, yt], [305, yt]) + schalter(305, yt, 305, u) + text(290, 312, 'R', 'end', 'font-size="13" font-weight="700"') +
			draht([xa, yt + 32], [xa, u], [xc, u], [xc, yt + 32]) + punkt(xk1, u) + punkt(xk2, u) + punkt(235, u) + punkt(305, u) + masse(270, u) +
			draht([xa, 150], [40, 150]) + klemme(36, 150) + text(36, 138, sym('u', 'a1')) + punkt(xa, 150) +
			draht([xc, 150], [500, 150]) + klemme(504, 150) + text(504, 138, sym('u', 'a2')) + punkt(xc, 150),
		);
	}

	// ---------- K6) Zeitdiagramm bistabil ----------
	{
		const X = (t) => 80 + t * 50; // 0 … 10
		const ys = [80, 170, 270, 360];
		const sp = 14;
		const s = (t) => ((t >= 2 && t < 2.4) || (t >= 3.8 && t < 4.2) ? 5 : 0);
		const r = (t) => (t >= 6.2 && t < 6.6 ? 5 : 0);
		// S (Basis T1 an Masse) → T1 sperrt → u_a1 high; R → T2 sperrt → u_a2 high, u_a1 low
		const ua1 = (t) => (t < 2 ? 0.1 : t < 6.2 ? 5 : 0.1);
		const ua2 = (t) => 5.1 - ua1(t);
		const pts = (f, y0) => {
			const a = [];
			for (let t = 0; t <= 10; t += 0.01) a.push([X(t).toFixed(1), (y0 - f(t) * sp).toFixed(1)]);
			return a;
		};
		speichere('elektronik/bistabil-signale.svg', 640, 400,
			'Zeitdiagramm der bistabilen Kippstufe: Taster S schaltet den Ausgang 1 auf High, Taster R schaltet zurück; dazwischen bleibt der Zustand gespeichert, ein zweites Drücken von S ändert nichts',
			spur(ys[0], 70, 'Taster S', pts(s, ys[0])) + spur(ys[1], 70, 'Taster R', pts(r, ys[1])) +
			spur(ys[2], 70, sym('u', 'a1'), pts(ua1, ys[2]), S1) + spur(ys[3], 70, sym('u', 'a2'), pts(ua2, ys[3]), S2) +
			text(X(5.1), ys[2] - 5 * sp - 8, 'bleibt gespeichert', 'middle', 'font-size="11"') + text(X(8.1), ys[3] - 5 * sp - 8, 'bleibt gespeichert', 'middle', 'font-size="11"') +
			text(X(4.4), ys[0] - 5 * sp + 6, 'erneut S: keine Änderung', 'start', 'font-size="11"') +
			[2, 3.8, 6.2].map((t) => strich(X(t), 24, X(t), ys[3], 'stroke-width="1" stroke-dasharray="1 5" opacity="0.6"')).join(''),
		);
	}
}

// =====================================================================
// SIGNALE UND SPEKTREN  →  src/assets/mtrs/
// Alle Kurven und Linienhöhen werden aus den Fourier-Koeffizienten bzw. einer DFT berechnet.
// =====================================================================
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const kl = 'font-size="11"';
	const komma = (z, n = 2) => z.toFixed(n).replace('.', ',');

	// Fourier-Koeffizienten (Amplitude 1, symmetrisch um 0)
	const koeff = {
		Sinus: (n) => (n === 1 ? 1 : 0),
		Rechteck: (n) => (n % 2 === 1 ? 4 / (Math.PI * n) : 0),
		Dreieck: (n) => (n % 2 === 1 ? ((8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1)) : 0),
	};
	const ideal = {
		Sinus: (x) => Math.sin(2 * Math.PI * x),
		Rechteck: (x) => ((x % 1) + 1) % 1 < 0.5 ? 1 : -1,
		Dreieck: (x) => {
			const t = (((x % 1) + 1) % 1);
			return t < 0.25 ? 4 * t : t < 0.75 ? 2 - 4 * t : 4 * t - 4;
		},
	};

	// ---------- S1) Zeit- und Frequenzbereich nebeneinander ----------
	{
		const zeilen = ['Sinus', 'Rechteck', 'Dreieck'];
		const h = 150, oben = 40;
		let inhalt = text(175, 24, 'Zeitbereich', 'middle', 'font-weight="700"') + text(515, 24, 'Frequenzbereich (Amplitudenspektrum)', 'middle', 'font-weight="700"');
		zeilen.forEach((name, i) => {
			const y0 = oben + i * h + 70; // Nulllinie Zeitbereich
			const yb = oben + i * h + 120; // Grundlinie Spektrum
			// Zeitbereich: 2 Perioden auf 260 px
			const X = (x) => 50 + x * 130, Y = (v) => y0 - v * 45;
			const pts = [];
			for (let x = 0; x <= 2; x += 0.002) pts.push([X(x).toFixed(1), Y(ideal[name](x)).toFixed(1)]);
			inhalt += text(14, y0 - 52, name, 'start', 'font-weight="700"') +
				pfeil(50, y0, 320, y0) + pfeil(50, y0 + 52, 50, y0 - 56) + text(320, y0 + 16, sym('t'), 'end', kl) +
				text(44, Y(1) + 4, '1', 'end', kl) + text(44, Y(-1) + 4, '−1', 'end', kl) +
				strich(46, Y(1), 54, Y(1)) + strich(46, Y(-1), 54, Y(-1)) +
				`<polyline points="${p(pts)}" stroke="${S1}" stroke-width="2.25"/>` +
				mass(X(0), y0 + 62, X(1), y0 + 62) + text(X(0.5), y0 + 58, sym('T'), 'middle', kl);
			// Spektrum: n = 1 … 11
			const XF = (n) => 380 + n * 24, YF = (a) => yb - a * 70;
			inhalt += pfeil(380, yb, 660, yb) + pfeil(380, yb, 380, yb - 105) + text(660, yb + 16, sym('f'), 'end', kl) +
				text(374, YF(1) + 4, '1', 'end', kl) + strich(376, YF(1), 384, YF(1));
			for (let n = 1; n <= 11; n++) {
				const a = Math.abs(koeff[name](n));
				inhalt += strich(XF(n), yb, XF(n), yb + 4) + (n % 2 === 1 ? text(XF(n), yb + 16, n === 1 ? sym('f', '0') : `${n}${sym('f', '0')}`, 'middle', 'font-size="10"') : '');
				if (a > 0) {
					inhalt += strich(XF(n), yb, XF(n), YF(a), `stroke="${S2}" stroke-width="3"`) + `<circle cx="${XF(n)}" cy="${YF(a)}" r="3" fill="${S2}" stroke="none"/>`;
					if (n <= 5 || name === 'Rechteck' && n <= 7) inhalt += text(XF(n) + 4, YF(a) - 6, komma(a), 'start', 'font-size="10"');
				}
			}
		});
		speichere('mtrs/zeit-frequenzbereich.svg', 680, 500,
			'Sinus, Rechteck und Dreieck im Zeit- und Frequenzbereich: Der Sinus hat nur eine Spektrallinie, das Rechteck ungerade Oberschwingungen mit Amplituden 4 durch pi n, das Dreieck ungerade Oberschwingungen mit 8 durch pi Quadrat n Quadrat',
			inhalt);
	}

	// ---------- S2) Aliasing ----------
	{
		const fs = 10, f = 9, fa = 1; // kHz
		const X = (t) => 60 + t * 540, Y = (v) => 140 - v * 85; // t in ms, 0 … 1 ms
		const echt = [], schein = [];
		for (let t = 0; t <= 1.0001; t += 0.0005) {
			echt.push([X(t).toFixed(1), Y(Math.sin(2 * Math.PI * f * t)).toFixed(1)]);
			schein.push([X(t).toFixed(1), Y(-Math.sin(2 * Math.PI * fa * t)).toFixed(1)]);
		}
		let punkte = '';
		for (let k = 0; k <= 10; k++) {
			const t = k / fs;
			const v = Math.sin(2 * Math.PI * f * t);
			punkte += strich(X(t), Y(0), X(t), Y(v), 'stroke-width="1" opacity="0.6"') + `<circle cx="${X(t)}" cy="${Y(v)}" r="5" fill="${S2}" stroke="none"/>`;
		}
		speichere('mtrs/aliasing.svg', 640, 290,
			'Aliasing: Ein 9-kHz-Sinus wird mit 10 kHz abgetastet. Die Abtastwerte liegen genau auf einem 1-kHz-Sinus – das Messgerät zeigt fälschlich 1 kHz',
			pfeil(60, Y(0), 620, Y(0)) + pfeil(60, 240, 60, 40) + text(620, Y(0) + 34, sym('t') + ' in ms', 'end', kl) +
			[0.2, 0.4, 0.6, 0.8, 1].map((t) => strich(X(t), Y(0) - 4, X(t), Y(0) + 4) + text(X(t), Y(0) + 18, komma(t, 1), 'middle', kl)).join('') +
			`<polyline points="${p(echt)}" stroke="currentColor" stroke-width="1.5" opacity="0.75"/>` +
			`<polyline points="${p(schein)}" stroke="${S1}" stroke-width="3" stroke-dasharray="8 5"/>` + punkte +
			strich(80, 262, 108, 262, 'stroke-width="1.5"') + text(114, 266, 'Signal 9 kHz', 'start', kl) +
			`<circle cx="230" cy="262" r="5" fill="${S2}" stroke="none"/>` + text(242, 266, 'Abtastwerte (10 kHz)', 'start', kl) +
			strich(400, 262, 428, 262, `stroke="${S1}" stroke-width="3" stroke-dasharray="8 5"`) + text(434, 266, 'scheinbar 1 kHz', 'start', kl),
		);
	}

	// ---------- S3) Spektrale Leckage und Fensterfunktion (echte DFT) ----------
	{
		const N = 256;
		const dft = (x) => {
			const m = [];
			for (let k = 0; k < N / 2; k++) {
				let re = 0, im = 0;
				for (let n = 0; n < N; n++) { re += x[n] * Math.cos((2 * Math.PI * k * n) / N); im -= x[n] * Math.sin((2 * Math.PI * k * n) / N); }
				m.push(Math.hypot(re, im));
			}
			return m;
		};
		const signal = (zyklen, fenster) => {
			const x = [];
			let summe = 0;
			for (let n = 0; n < N; n++) {
				const w = fenster ? 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N) : 1;
				summe += w;
				x.push(w * Math.sin((2 * Math.PI * zyklen * n) / N));
			}
			return dft(x).map((v) => (2 * v) / summe); // amplitudenrichtig
		};
		const ganz = signal(20, false), halbR = signal(20.5, false), halbH = signal(20.5, true);
		const db = (v) => Math.max(-80, 20 * Math.log10(Math.max(v, 1e-6)));
		const X = (k) => 70 + (k - 5) * 17, Y = (d) => 40 - d * 2.6; // Bins 5 … 36
		const linie = (m, farbe, extra = '') => {
			const pts = [];
			for (let k = 5; k <= 36; k++) pts.push([X(k), Y(db(m[k])).toFixed(1)]);
			return `<polyline points="${p(pts)}" stroke="${farbe}" stroke-width="2" ${extra}/>` +
				pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${farbe}" stroke="none"/>`).join('');
		};
		speichere('mtrs/leckage-fenster.svg', 640, 320,
			`Spektrale Leckage (berechnete DFT, 256 Werte): Mit genau 20 Perioden nur eine Linie; mit 20,5 Perioden und Rechteckfenster verschmiert das Spektrum weit (Linie nur ${komma(db(halbR[20]), 1)} dB statt 0 dB); das Hann-Fenster begrenzt die Leckage auf die Nachbarlinien`,
			pfeil(70, Y(-80), 620, Y(-80)) + pfeil(70, Y(-80), 70, 25) + text(620, Y(-80) + 34, 'Frequenzlinie ' + sym('k'), 'end', kl) +
			text(64, 30, 'dB', 'end', kl) +
			[0, -20, -40, -60, -80].map((d) => strich(66, Y(d), 74, Y(d)) + text(62, Y(d) + 4, String(d).replace('-', '−'), 'end', kl) +
				strich(74, Y(d), 620, Y(d), 'stroke-width="0.6" opacity="0.25"')).join('') +
			[10, 15, 20, 25, 30, 35].map((k) => strich(X(k), Y(-80) - 4, X(k), Y(-80) + 4) + text(X(k), Y(-80) + 18, String(k), 'middle', kl)).join('') +
			linie(halbR, S2) + linie(halbH, S1) +
			`<line x1="${X(20)}" y1="${Y(-80)}" x2="${X(20)}" y2="${Y(db(ganz[20]))}" stroke="currentColor" stroke-width="3"/>` +
			text(X(20) + 6, Y(0) - 4, 'ganze Periodenzahl: eine Linie', 'start', kl) +
			strich(120, 304, 148, 304, `stroke="${S2}" stroke-width="2"`) + text(154, 308, '20,5 Perioden, Rechteckfenster', 'start', kl) +
			strich(370, 304, 398, 304, `stroke="${S1}" stroke-width="2"`) + text(404, 308, '20,5 Perioden, Hann-Fenster', 'start', kl),
		);
		console.log(`  Leckage: Rechteck halbzahlig Spitze ${db(halbR[20]).toFixed(1)} dB, bei k=30: ${db(halbR[30]).toFixed(1)} dB; Hann Spitze ${db(halbH[20]).toFixed(1)} dB, bei k=30: ${db(halbH[30]).toFixed(1)} dB`);
	}
}

// =====================================================================
// REALE MAGNETKREISE UND INDUKTIVITÄTEN  →  src/assets/mtrs/ bzw. leistungselektronik/
// =====================================================================
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const kl = 'font-size="11"';
	const komma = (z, n = 1) => z.toFixed(n).replace('.', ',');
	const mu0 = 4e-7 * Math.PI;
	// Beispielkennlinie Elektroblech (typische Werte, keine Datenblattangabe)
	const HT = [0, 50, 100, 150, 200, 300, 500, 1000, 2500, 5000, 10000];
	const BT = [0, 0.55, 0.95, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.68, 1.78];
	const Hvon = (b) => {
		for (let i = 1; i < BT.length; i++) if (b <= BT[i]) return HT[i - 1] + ((HT[i] - HT[i - 1]) * (b - BT[i - 1])) / (BT[i] - BT[i - 1]);
		return HT[HT.length - 1];
	};

	// ---------- M1) Hystereseschleife und Neukurve (schematisch, berechnet mit tanh-Modell) ----------
	{
		const Bs = 1.5, Hc = 60, H0 = 120; // Modell eines weichmagnetischen Werkstoffs
		const X = (h) => 320 + h * 0.5, Y = (b) => 160 - b * 85; // H −500 … 500 A/m
		const ast = (sgn) => {
			const pts = [];
			for (let h = -500; h <= 500; h += 2) pts.push([X(sgn * h).toFixed(1), Y(sgn * Bs * Math.tanh((h - Hc) / H0)).toFixed(1)]);
			return pts;
		};
		const neu = [];
		// Neukurve: beginnt flach (Anfangspermeabilität), wird steil und läuft in die Sättigung
		for (let h = 0; h <= 500; h += 2) neu.push([X(h).toFixed(1), Y(Bs * Math.tanh(h / (H0 * 1.15)) * (1 - Math.exp(-h / 40))).toFixed(1)]);
		const Br = Bs * Math.tanh(Hc / H0);
		speichere('mtrs/hystereseschleife.svg', 640, 330,
			'Hystereseschleife eines weichmagnetischen Werkstoffs mit Neukurve, Sättigung, Remanenz und Koerzitivfeldstärke; die Fläche der Schleife entspricht den Ummagnetisierungsverlusten',
			`<path d="M${p(ast(1)).split(' ').join(' L')} L${p(ast(-1)).split(' ').join(' L')} Z" fill="${S1}" opacity="0.08" stroke="none"/>` +
			pfeil(40, Y(0), 610, Y(0)) + pfeil(X(0), 310, X(0), 18) + text(610, Y(0) + 18, sym('H') + ' in A/m', 'end', kl) + text(X(0) + 8, 26, sym('B') + ' in T', 'start', kl) +
			[-400, -200, 200, 400].map((h) => strich(X(h), Y(0) - 4, X(h), Y(0) + 4) + text(X(h), Y(0) + 18, String(h).replace('-', '−'), 'middle', kl)).join('') +
			[-1.5, -1, 1, 1.5].map((b) => strich(X(0) - 4, Y(b), X(0) + 4, Y(b)) + text(X(0) - 8, Y(b) + 4, komma(b).replace('-', '−'), 'end', kl)).join('') +
			`<polyline points="${p(ast(1))}" stroke="${S1}" stroke-width="2.5"/>` + `<polyline points="${p(ast(-1))}" stroke="${S1}" stroke-width="2.5"/>` +
			`<polyline points="${p(neu)}" stroke="${S2}" stroke-width="2" stroke-dasharray="6 4"/>` +
			`<circle cx="${X(0)}" cy="${Y(Br)}" r="4.5" fill="currentColor" stroke="none"/>` + text(X(0) - 10, Y(Br) - 8, 'Remanenz ' + sym('B', 'r'), 'end', kl) +
			`<circle cx="${X(-Hc)}" cy="${Y(0)}" r="4.5" fill="currentColor" stroke="none"/>` + text(X(-Hc) - 6, Y(0) - 10, sym('H', 'c'), 'end', kl) +
			text(X(470), Y(1.46) - 12, 'Sättigung', 'end', kl) + text(X(180), Y(0.55), 'Neukurve', 'start', `${kl} fill="${S2}"`) +
			text(X(-450), Y(-0.6), 'Fläche ~ Verluste', 'start', kl) + text(X(-450), Y(-0.6) + 14, 'je Ummagnetisierung', 'start', kl),
		);
	}

	// ---------- M2) Fluss über Durchflutung: Luftspalt „schert“ die Kennlinie ----------
	{
		const lFe = 0.2, A = 4e-4;
		const X = (th) => 70 + th * 0.34, Y = (b) => 270 - b * 140; // Θ 0 … 1600 A, B 0 … 1,7 T
		const kurve = (delta) => {
			const pts = [];
			for (let b = 0; b <= 1.72; b += 0.005) {
				const th = Hvon(b) * lFe + (b / mu0) * delta;
				if (th > 1620) break;
				pts.push([X(th).toFixed(1), Y(b).toFixed(1)]);
			}
			return pts;
		};
		const kl2 = 'font-size="12"';
		speichere('mtrs/luftspalt-kennlinie.svg', 660, 320,
			'Flussdichte über der Durchflutung für einen Eisenkreis (20 cm Elektroblech, 4 Quadratzentimeter) ohne Luftspalt und mit 1 mm Luftspalt: Der Luftspalt macht die Kennlinie flacher und linearer, Sättigung tritt erst bei viel größerer Durchflutung ein',
			pfeil(70, 270, 640, 270) + pfeil(70, 270, 70, 20) + text(640, 290, sym('Θ') + ' = ' + sym('N') + sym('I') + ' in A', 'end', kl) + text(78, 28, sym('B') + ' in T', 'start', kl) +
			[400, 800, 1200, 1600].map((t) => strich(X(t), 266, X(t), 274) + text(X(t), 288, String(t), 'middle', kl)).join('') +
			[0.5, 1, 1.5].map((b) => strich(66, Y(b), 74, Y(b)) + text(62, Y(b) + 4, komma(b), 'end', kl) + strich(74, Y(b), 640, Y(b), 'stroke-width="0.6" opacity="0.25"')).join('') +
			`<polyline points="${p(kurve(0))}" stroke="${S2}" stroke-width="2.5"/>` +
			`<polyline points="${p(kurve(1e-3))}" stroke="${S1}" stroke-width="2.5"/>` +
			text(X(250), Y(1.58), 'ohne Luftspalt: sehr steil, früh gesättigt', 'start', `${kl2} fill="${S2}" font-weight="600"`) +
			text(X(830), Y(0.92), 'mit 1 mm Luftspalt:', 'start', `${kl2} fill="${S1}" font-weight="600"`) +
			text(X(830), Y(0.92) + 15, 'flach, lange linear', 'start', `${kl2} fill="${S1}" font-weight="600"`) +
			strich(X(0), Y(1.2), X(995), Y(1.2), 'stroke-width="1" stroke-dasharray="3 4"') + strich(X(995), Y(1.2), X(995), 270, 'stroke-width="1" stroke-dasharray="3 4"') +
			text(X(995) + 4, 262, '995 A', 'start', kl),
		);
	}

	// ---------- M3) Sättigung messen: Messaufbau ----------
	{
		const o = 50, u = 250;
		speichere('leistungselektronik/saettigung-messaufbau.svg', 600, 300,
			'Messaufbau zur Sättigungsmessung: Labornetzteil mit Pufferkondensator, Drossel, MOSFET als Schalter, Shunt-Widerstand zur Strommessung mit dem Oszilloskop, Freilaufdiode parallel zur Drossel',
			gquelle(60, o, u, 'U', 'B') + draht([60, o], [260, o]) + kondensator(150, o, 150, u) + neben(150, 150, 'C') + punkt(150, o) + punkt(150, u) +
			spule(260, o, 260, 150) + neben(260, 100, 'L', '', 'links') + punkt(260, o) + punkt(260, 150) +
			draht([260, o], [340, o]) + diode(340, 150, 340, o) + text(356, 100, sym('D'), 'start') + draht([260, 150], [340, 150]) + punkt(340, 150) +
			draht([260, 150], [260, 170]) + nmos(260, 200, { bodyDiode: false }) + draht([200, 200], [230, 200]) + klemme(196, 200) + text(190, 205, 'Puls', 'end', kl) +
			text(190, 220, '(z. B. 20 µs)', 'end', kl) + widerstand(260, 230, 260, u + 20) + neben(260, 250, 'R', 'S') +
			draht([60, u], [150, u], [150, u + 20], [260, u + 20]) + punkt(260, 230) +
			draht([260, 230], [440, 230]) + klemme(444, 230) + text(452, 222, 'Oszilloskop', 'start', kl) + text(452, 238, sym('u', 'RS') + ' = ' + sym('R', 'S') + '·' + sym('i', 'L'), 'start', kl) +
			draht([260, u + 20], [440, u + 20]) + klemme(444, u + 20) + text(452, u + 25, 'Masse', 'start', kl) + masse(350, u + 20),
		);
	}

	// ---------- M4) Stromanstieg mit Sättigung (berechnet) ----------
	{
		const L0 = 100e-6, Isat = 3.2, U = 12;
		const L = (i) => L0 * (0.12 + 0.88 / (1 + Math.pow(i / Isat, 8)));
		const pts = [], ideal = [];
		let i = 0, t = 0, tSat = 0, iSat = 0;
		const dt = 1e-8;
		const X = (tt) => 70 + tt * 1e6 * 16, Y = (ii) => 250 - ii * 40; // 0 … 34 µs, 0 … 5,5 A
		while (i < 5.4 && t < 34e-6) {
			if (!tSat && L(i) <= 0.8 * L0) { tSat = t; iSat = i; }
			i += (U / L(i)) * dt; t += dt;
			if (Math.round(t / dt) % 20 === 0) pts.push([X(t).toFixed(1), Y(i).toFixed(1)]);
		}
		for (let tt = 0; tt <= 46e-6; tt += 1e-6) { const ii = (U / L0) * tt; if (ii > 5.5) break; ideal.push([X(tt).toFixed(1), Y(ii).toFixed(1)]); }
		speichere('leistungselektronik/saettigung-stromanstieg.svg', 640, 300,
			`Berechneter Stromanstieg in einer 100-µH-Drossel an 12 V: zunächst gerade (di/dt = U/L), ab etwa ${komma(iSat)} A krümmt sich die Kurve steil nach oben, weil die Induktivität durch Sättigung einbricht`,
			pfeil(70, 250, 620, 250) + pfeil(70, 250, 70, 20) + text(620, 270, sym('t') + ' in µs', 'end', kl) + text(78, 28, sym('i', 'L') + ' in A', 'start', kl) +
			[10, 20, 30].map((tt) => strich(X(tt * 1e-6), 246, X(tt * 1e-6), 254) + text(X(tt * 1e-6), 268, String(tt), 'middle', kl)).join('') +
			[1, 2, 3, 4, 5].map((ii) => strich(66, Y(ii), 74, Y(ii)) + text(62, Y(ii) + 4, String(ii), 'end', kl) + strich(74, Y(ii), 620, Y(ii), 'stroke-width="0.6" opacity="0.25"')).join('') +
			`<polyline points="${p(ideal)}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4"/>` +
			`<polyline points="${p(pts)}" stroke="${S1}" stroke-width="3"/>` +
			`<circle cx="${X(tSat)}" cy="${Y(iSat)}" r="5" fill="${S2}" stroke="none"/>` +
			text(X(tSat) - 10, Y(iSat) - 6, sym('I', 'sat') + ' ≈ ' + komma(iSat) + ' A (L um 20 % gesunken)', 'end', `${kl} fill="${S2}" font-weight="600"`) +
			text(X(33e-6), Y(1.4), 'gestrichelt: ideal, Gerade mit', 'end', kl) + text(X(33e-6), Y(1.4) + 15, sym('U') + '/' + sym('L', '0') + ' = 0,12 A/µs', 'end', kl),
		);
		console.log(`  Sättigung: I_sat(−20 %) = ${iSat.toFixed(2)} A nach ${(tSat * 1e6).toFixed(1)} µs`);
	}
}

// ---------- R1) Ball-on-Beam: Aufbau und Regelkreis ----------
{
	const S1 = 'var(--ds-signal-1, #0b72c4)';
	const S2 = 'var(--ds-signal-2, #b45a00)';
	const kl = 'font-size="12"';
	const block = (x, y, b, h, z1, z2 = '') =>
		`<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="6"/>` +
		text(x + b / 2, y + (z2 ? h / 2 - 3 : h / 2 + 5), z1, 'middle', 'font-size="13" font-weight="600"') +
		(z2 ? text(x + b / 2, y + h / 2 + 14, z2, 'middle', 'font-size="11"') : '');
	// Aufbau: Balken um Drehpunkt (360, 120) um −6° geneigt
	const w = (-6 * Math.PI) / 180, px = 360, py = 120, L = 250;
	const pkt = (s) => [px + s * Math.cos(w), py + s * Math.sin(w)];
	const [ax, ay] = pkt(-L), [bx, by] = pkt(L);
	const [kx, ky] = pkt(-90);
	const n = [-Math.sin(w), Math.cos(w)]; // Normale (nach unten)
	const yd = 300;
	speichere('mtrs/ball-on-beam.svg', 720, 420,
		'Ball-on-Beam: Eine Kugel rollt auf einem kippbaren Balken, ein Abstandssensor misst ihre Position, ein Servomotor stellt den Neigungswinkel. Darunter der Regelkreis aus Regler, Servo, Balken mit Kugel und Sensor',
		// Balken, Drehpunkt, Kugel
		`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke-width="7"/>` +
		`<polygon points="${p([[px, py + 6], [px - 16, py + 40], [px + 16, py + 40]])}"/>` + strich(px - 30, py + 40, px + 30, py + 40, 'stroke-width="3"') +
		`<circle cx="${kx - n[0] * 17}" cy="${ky - n[1] * 17}" r="13" fill="${S2}" stroke="none"/>` +
		pfeil(kx - 40, ky - 34 - 4, kx - 80, ky - 30 - 4 - 4, S2) + text(kx - 60, ky - 48, 'rollt', 'middle', `${kl} fill="${S2}"`) +
		// Abstandssensor am linken Ende
		`<rect x="${ax - 46}" y="${ay - 34}" width="36" height="28" rx="3"/>` + text(ax - 28, ay - 42, 'Sensor', 'middle', kl) +
		`<path d="M${ax - 6},${ay - 26} q8,6 0,12 M${ax + 2},${ay - 30} q12,10 0,20" stroke="${S1}"/>` +
		mass(ax - 10, ay + 22, kx - 17, ky + 22) + text((ax + kx) / 2 - 10, ay + 40, sym('x'), 'middle') +
		// Servo am rechten Ende über Hebel
		`<rect x="${bx - 30}" y="${by + 60}" width="60" height="40" rx="4"/>` + text(bx, by + 85, 'Servo', 'middle', kl) +
		draht([bx, by + 4], [bx, by + 40], [bx + 18, by + 60]) + `<circle cx="${bx}" cy="${by + 40}" r="4"/>` +
		`<path d="M${px + 70},${py} A70,70 0 0 1 ${pkt(70)[0]},${pkt(70)[1]}" stroke-width="1.5"/>` + text(px + 80, py - 4, sym('α'), 'start') +
		strich(px - 200, py, px + 200, py, 'stroke-width="1" stroke-dasharray="4 5" opacity="0.5"') +
		// Blockschaltbild
		text(20, yd - 26, 'Regelkreis', 'start', 'font-weight="700"') +
		pfeil(20, yd + 25, 66, yd + 25) + text(24, yd + 16, sym('w'), 'start') + `<circle cx="80" cy="${yd + 25}" r="14"/>` +
		text(74, yd + 12, '+', 'middle', 'font-size="11"') + text(86, yd + 52, '−', 'middle', 'font-size="13"') +
		pfeil(94, yd + 25, 130, yd + 25) + text(112, yd + 16, sym('e'), 'middle', 'font-size="11"') +
		block(130, yd, 130, 50, 'Regler', 'P, PD oder PID') + pfeil(260, yd + 25, 300, yd + 25) + text(280, yd + 16, sym('α', 'soll'), 'middle', 'font-size="11"') +
		block(300, yd, 110, 50, 'Servo', 'Totzeit, Begrenzung') + pfeil(410, yd + 25, 450, yd + 25) + text(430, yd + 16, sym('α'), 'middle', 'font-size="11"') +
		block(450, yd, 150, 50, 'Balken + Kugel', 'ẍ = 5/7 · g · α') + pfeil(600, yd + 25, 700, yd + 25) + text(690, yd + 16, sym('x'), 'end') +
		draht([650, yd + 25], [650, yd + 95], [400, yd + 95]) + punkt(650, yd + 25) + block(300, yd + 75, 100, 40, 'Sensor') +
		draht([300, yd + 95], [80, yd + 95]) + pfeil(80, yd + 95, 80, yd + 39),
	);
}
