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
			rehypePlugins: [rehypeKatex, rehypeKatexSuche, [rehypeBasisLinks, { basis: BASIS }]],
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
				{
					label: 'Grundlagen der Elektrotechnik',
					badge: inArbeit,
					items: [{ label: 'Übersicht', slug: 'grundlagen' }],
				},
				leer('Transistoren', 'transistoren'),
				leer('Operationsverstärker', 'operationsverstaerker'),
				leer('Filter', 'filter'),
				leer('Oszillatoren', 'oszillatoren'),
				thema('Leistungselektronik', 'leistungselektronik', {
					theorieOrdner: true,
					zusatz: [
						['Simulationen', 'simulationen'],
						['Literatur & Links', 'literatur'],
					],
				}),
				leer('Sensoren', 'sensoren'),
				leer('Aktuatoren', 'aktuatoren'),
				leer('Messtechnik', 'messtechnik'),
				leer('Regelungstechnik', 'regelungstechnik'),
			],
		}),
	],
});
