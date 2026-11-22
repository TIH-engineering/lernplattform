// Prüft die fertig gebaute Webseite im Ordner dist/:
//  - fehlerhafte Formeln (KaTeX)
//  - interne Links, Bilder und Sprungmarken (#…)
//  - Verteilung der richtigen Antworten in jedem Quiz
// Aufruf:  npm run build  und dann  node werkzeuge/pruefen.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const BASIS = '/lernplattform';

const alleHtml = (ordner) =>
	readdirSync(ordner).flatMap((n) => {
		const p = join(ordner, n);
		return statSync(p).isDirectory() ? alleHtml(p) : p.endsWith('.html') ? [p] : [];
	});

const dateien = alleHtml(DIST);
const inhalt = new Map(dateien.map((d) => [d, readFileSync(d, 'utf8')]));
let fehler = 0;

// 1) Formelfehler
for (const [d, t] of inhalt) {
	const n = (t.match(/katex-error/g) || []).length;
	if (n) { console.log(`FORMEL  ${relative(DIST, d)}: ${n} fehlerhafte Formel(n)`); fehler++; }
}

// 2) Links, Bilder, Sprungmarken
const zielDatei = (pfad) => {
	let p = join(DIST, decodeURIComponent(pfad.slice(BASIS.length)));
	if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
	return p;
};
const gemeldet = new Set();
for (const [d, t] of inhalt) {
	for (const m of t.matchAll(/(?:href|src)="(\/[^"#?]*)(#[^"]*)?"/g)) {
		const [, pfad, anker] = m;
		let meldung = null;
		if (pfad !== BASIS && !pfad.startsWith(BASIS + '/')) meldung = `OHNE BASIS ${pfad}`;
		else {
			const z = zielDatei(pfad);
			if (!existsSync(z)) meldung = `FEHLT ${pfad}`;
			else if (anker && anker.length > 1) {
				const id = decodeURIComponent(anker.slice(1));
				const zt = inhalt.get(z) ?? readFileSync(z, 'utf8');
				if (!zt.includes(`id="${id}"`)) meldung = `ANKER ${pfad}${anker}`;
			}
		}
		if (meldung && !gemeldet.has(meldung + d)) {
			gemeldet.add(meldung + d);
			console.log(`LINK    ${relative(DIST, d)}: ${meldung}`);
			fehler++;
		}
	}
}

// 2b) Sprungmarken auf derselben Seite (href="#…"), relative Links (ohne / am Anfang) und srcset
const seitenUrl = (d) => BASIS + '/' + relative(DIST, d).split(sep).join('/').replace(/index\.html$/, '');
const melde = (d, meldung) => {
	if (gemeldet.has(meldung + d)) return;
	gemeldet.add(meldung + d);
	console.log(`LINK    ${relative(DIST, d)}: ${meldung}`);
	fehler++;
};
for (const [d, t] of inhalt) {
	const ids = new Set([...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
	for (const m of t.matchAll(/<a\b[^>]*\shref="#([^"]*)"/g)) {
		const id = decodeURIComponent(m[1]);
		if (id && !ids.has(id)) melde(d, `ANKER (gleiche Seite) #${id}`);
	}
	for (const m of t.matchAll(/\s(?:href|src)="(?![a-z][a-z0-9+.-]*:|\/|#)([^"#?]+)(#[^"]*)?"/gi)) {
		const ziel = new URL(m[1], 'http://x' + seitenUrl(d)).pathname;
		if (!existsSync(zielDatei(ziel))) melde(d, `RELATIV ${m[1]} → ${ziel} fehlt`);
	}
	for (const m of t.matchAll(/srcset="([^"]+)"/g)) {
		for (const teil of m[1].split(',')) {
			const url = teil.trim().split(/\s+/)[0];
			if (url.startsWith('/') && !existsSync(zielDatei(url.split(/[?#]/)[0]))) melde(d, `SRCSET ${url}`);
		}
	}
}

// 3) Quiz: Position der richtigen Antwort (nur Fragen mit genau einer richtigen Antwort).
//    Ab 8 solchen Fragen gibt es eine WARNUNG (kein Fehler), wenn eine Position nie oder viel zu oft richtig ist.
console.log('\nQuiz – wie oft ist die 1./2./3./4. Antwort richtig?   (Fragen mit einer / mit mehreren richtigen Antworten)');
let warnungen = 0;
const gesamt = [0, 0, 0, 0];
let mehrfachGesamt = 0;
for (const [d, t] of inhalt) {
	if (!d.split(sep).includes('quiz')) continue;
	const alle = [...t.matchAll(/data-typ="mc" data-richtig="([0-9,]+)"/g)].map((m) => m[1]);
	const pos = alle.filter((p) => !p.includes(','));
	const mehrfach = alle.length - pos.length;
	mehrfachGesamt += mehrfach;
	const zaehler = [0, 1, 2, 3].map((k) => pos.filter((p) => Number(p) === k).length);
	zaehler.forEach((z, k) => (gesamt[k] += z));
	let hinweis = '';
	if (pos.length >= 8 && (Math.min(zaehler[0], zaehler[1]) === 0 || Math.max(...zaehler) > pos.length / 2)) {
		hinweis = '  ← WARNUNG: ungleichmäßig';
		warnungen++;
	}
	console.log(
		`  ${relative(DIST, d).replace(/[\\/]index\.html$/, '').padEnd(42)} ${zaehler.join(' / ')}   (${pos.length} / ${mehrfach})${hinweis}`,
	);
}
console.log(`  ${'Summe'.padEnd(42)} ${gesamt.join(' / ')}   (mit mehreren richtigen: ${mehrfachGesamt})`);
if (warnungen) console.log(`  ${warnungen} Warnung(en) zur Verteilung – bitte ansehen.`);

console.log(`\n${dateien.length} Seiten geprüft, ${fehler} Problem(e) gefunden.`);
process.exit(fehler ? 1 : 0);
