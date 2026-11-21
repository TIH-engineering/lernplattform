// @ts-check
// Hauptkonfiguration der Lernplattform.
// Hier stehen: Seitentitel, Sprache, Formel-Unterstützung und die Navigation (Seitenleiste).
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeKatexSuche from './src/lib/katex-suche.mjs';
import rehypeBasisLinks from './src/lib/basis-links.mjs';

// Adresse der veröffentlichten Seite (GitHub Pages).
// Bei einer eigenen Domain später: SITE = 'https://…' und BASIS = '/' setzen.
const SITE = 'https://tih-engineering.github.io';
const BASIS = '/lernplattform';

// Kennzeichnung für Themenbereiche, die noch keine Inhalte haben.
const inArbeit = { text: 'in Arbeit', variant: /** @type {const} */ ('note') };

// Ein Themenbereich, der schon Inhalte hat – immer gleicher Aufbau:
// Übersicht, Theorie, Rechenbeispiele, Praxisbeispiele, Quiz (+ optionale Zusatzteile).
// theorieOrdner: true  → Theorie besteht aus mehreren Seiten im Unterordner „theorie/“
//                         (Reihenfolge über „sidebar.order“ im Kopf jeder Seite).
/**
 * @param {string} label
 * @param {string} ordner
 * @param {{ theorieOrdner?: boolean, zusatz?: [string, string][] }} [optionen]
 */
const thema = (label, ordner, { theorieOrdner = false, zusatz = [] } = {}) => ({
	label,
	collapsed: true,
	items: [
		{ label: 'Übersicht', slug: ordner },
		theorieOrdner
			? { label: 'Theorie', collapsed: true, items: [{ autogenerate: { directory: `${ordner}/theorie` } }] }
			: { label: 'Theorie', slug: `${ordner}/theorie` },
		{ label: 'Rechenbeispiele', slug: `${ordner}/rechenbeispiele` },
		{ label: 'Praxisbeispiele', slug: `${ordner}/praxisbeispiele` },
		{ label: 'Quiz', slug: `${ordner}/quiz` },
		...zusatz.map(([l, s]) => ({ label: l, slug: `${ordner}/${s}` })),
	],
});

// Grundlagen der Elektrotechnik: Theorie steht im Schulbuch, daher pro Thema nur
// Übersicht, Rechenbeispiele, Praxisbeispiele und Quiz. Ordner: src/content/docs/grundlagen/<ordner>/
const grundlagenThemen = [
	['Grundbegriffe, Strom und Spannung', 'grundbegriffe'],
	['Ohmsches Gesetz und Quellen', 'ohmsches-gesetz'],
	['Leiterwiderstand und Temperatur', 'leiterwiderstand'],
	['Reihen- und Parallelschaltung', 'schaltungen'],
	['Netzwerke und Ersatzquellen', 'netzwerke'],
	['Energie, Leistung, Wirkungsgrad', 'energie-leistung'],
	['Batterien und Akkus', 'akkus'],
	['Elektrisches Feld und Kondensator', 'kondensator'],
	['Magnetisches Feld', 'magnetfeld'],
	['Induktion und Transformator', 'induktion'],
	['Wechselgrößen und Blindwiderstände', 'wechselstrom'],
	['Komplexe Wechselstromrechnung', 'komplexe-rechnung'],
	['Leistung bei Wechselstrom', 'wechselstromleistung'],
	['Resonanz und Filter', 'resonanz-filter'],
];
const grundlagen = {
	label: 'Grundlagen der Elektrotechnik',
	collapsed: true,
	items: [
		{ label: 'Übersicht', slug: 'grundlagen' },
		...grundlagenThemen.map(([label, ordner], i) => ({
			label: `${i + 1} · ${label}`,
			collapsed: true,
			items: [
				{ label: 'Übersicht', slug: `grundlagen/${ordner}` },
				{ label: 'Rechenbeispiele', slug: `grundlagen/${ordner}/rechenbeispiele` },
				{ label: 'Praxisbeispiele', slug: `grundlagen/${ordner}/praxisbeispiele` },
				{ label: 'Quiz', slug: `grundlagen/${ordner}/quiz` },
			],
		})),
	],
};

// Ein Themenbereich, der noch leer ist: nur ein Link auf die Platzhalterseite.
/** @param {string} label @param {string} ordner */
const leer = (label, ordner) => ({ label, slug: ordner, badge: inArbeit });

export default defineConfig({
	site: SITE,
	base: BASIS,
	// Formeln mit $…$ und $$…$$ werden schon beim Bauen in fertiges HTML umgewandelt.
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			// strict: 'ignore' → Sonderzeichen wie € in Formeln ohne Warnung erlauben
			rehypePlugins: [[rehypeKatex, { strict: 'ignore' }], rehypeKatexSuche, [rehypeBasisLinks, { basis: BASIS }]],
		}),
	},
	integrations: [
		starlight({
			title: 'Elektronik lernen',
			description:
				'Lernplattform für Elektronik, Mess- und Regelungstechnik an der HTL – Theorie, Rechenbeispiele, Praxis und Quizzes.',
			// Deutsche Oberfläche (Suche, Buttons, „Auf dieser Seite“ …)
			defaultLocale: 'root',
			locales: { root: { label: 'Deutsch', lang: 'de' } },
			// KaTeX-Stil wird lokal mitgeliefert (keine externen Server).
			customCss: ['katex/dist/katex.min.css', './src/styles/eigene.css'],
			sidebar: [
				{ label: 'Startseite', slug: 'index' },
				{ label: 'So benutzt du diese Seite', slug: 'hinweise' },
				// 1) Grundlagen: Theorie steht im Schulbuch (GET1/GET2)
				grundlagen,
				// 2) Elektronik: kein Lehrbuch → eigene Theorie
				{
					label: 'Elektronik',
					items: [
						thema('Dioden', 'dioden'),
						thema('Transistoren', 'transistoren'),
						thema('Operationsverstärker', 'operationsverstaerker'),
						thema('Filter', 'filter'),
						thema('Oszillatoren', 'oszillatoren'),
						thema('Thermische Auslegung', 'thermische-auslegung'),
					],
				},
				// 3) Energietechnik
				{
					label: 'Energietechnik',
					items: [
						thema('Drehstrom', 'drehstrom'),
						thema('Leistungselektronik', 'leistungselektronik', {
							theorieOrdner: true,
							zusatz: [
								['Simulationen', 'simulationen'],
								['Literatur & Links', 'literatur'],
							],
						}),
					],
				},
				// 4) Mess- und Regelungstechnik (MTRS): kein Lehrbuch → eigene Theorie
				{
					label: 'Mess- und Regelungstechnik',
					items: [
						thema('Grundlagen der Messtechnik', 'messtechnik'),
						thema('Messfehler und Messunsicherheit', 'messfehler'),
						thema('Signalkennwerte', 'signalkennwerte'),
						thema('Sensoren', 'sensoren'),
						thema('Messwerke und Messbereiche', 'messwerke'),
						thema('Messbrücken', 'messbruecken'),
						thema('Digitale Messtechnik', 'digitale-messtechnik'),
						leer('Aktuatoren', 'aktuatoren'),
						leer('Regelungstechnik', 'regelungstechnik'),
					],
				},
				// 5) Projektmanagement: statt Rechenbeispielen Fallbeispiele
				{
					label: 'Projektmanagement',
					collapsed: true,
					items: [
						{ label: 'Übersicht', slug: 'projektmanagement' },
						{ label: 'Theorie', slug: 'projektmanagement/theorie' },
						{ label: 'Fallbeispiele', slug: 'projektmanagement/fallbeispiele' },
						{ label: 'Quiz', slug: 'projektmanagement/quiz' },
					],
				},
			],
		}),
	],
});
