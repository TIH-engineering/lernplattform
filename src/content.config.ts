// Inhaltssammlungen der Webseite:
// - docs: alle Seiten (Starlight)
// - quiz: Quizfragen als YAML-Dateien in src/content/quiz/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const stufe = z.enum(['grundlagen', 'standard', 'vertiefung']);

// Text, der nach dem Entfernen von Leerzeichen nicht leer sein darf
const text = z.string().trim().min(1, 'Text darf nicht leer sein.');

// Gemeinsame Felder jeder Frage
const basis = {
	frage: text,
	stufe,
	/** Wird nach JEDER Antwort angezeigt (richtig oder falsch). */
	erklaerung: text,
};

/** Multiple Choice: eine oder mehrere Antworten richtig */
const multipleChoice = z.object({
	typ: z.literal('mc'),
	...basis,
	optionen: z
		.array(z.object({ text, richtig: z.boolean().default(false) }))
		.min(2)
		.refine((o) => o.some((x) => x.richtig), 'Mindestens eine Option muss richtig: true haben.')
		.refine(
			(o) => new Set(o.map((x) => x.text.toLowerCase())).size === o.length,
			'Zwei Antwortmöglichkeiten sind gleich (Tippfehler?).',
		),
	/** Antworten beim Bauen mischen (Standard). false z. B. bei „alle oben genannten“ */
	mischen: z.boolean().default(true),
});

/** Zahleneingabe mit Toleranz */
const zahleneingabe = z.object({
	typ: z.literal('zahl'),
	...basis,
	loesung: z.number().finite(),
	einheit: z.string().default(''),
	/** Erlaubte Abweichung, Standard: 2 % */
	toleranz: z.number().finite().nonnegative().default(2),
	toleranzArt: z.enum(['prozent', 'absolut']).default('prozent'),
});

const quiz = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/quiz' }),
	schema: z.object({
		titel: z.string().optional(),
		fragen: z
			.array(z.discriminatedUnion('typ', [multipleChoice, zahleneingabe]))
			.min(1)
			// Bei der Lösung 0 wäre eine Toleranz in % immer 0 – dann eine absolute Toleranz angeben.
			.superRefine((fragen, ctx) =>
				fragen.forEach((f, i) => {
					if (f.typ === 'zahl' && f.loesung === 0 && f.toleranzArt === 'prozent')
						ctx.addIssue({
							code: 'custom',
							path: [i, 'toleranzArt'],
							message: 'loesung: 0 braucht toleranzArt: absolut (z. B. toleranz: 0.01).',
						});
				}),
			),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Eigene Übersetzungen der Oberfläche (src/content/i18n/de.json)
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
	quiz,
};
