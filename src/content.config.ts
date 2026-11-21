// Inhaltssammlungen der Webseite:
// - docs: alle Seiten (Starlight)
// - quiz: Quizfragen als YAML-Dateien in src/content/quiz/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const stufe = z.enum(['grundlagen', 'standard', 'vertiefung']);

// Gemeinsame Felder jeder Frage
const basis = {
	frage: z.string(),
	stufe,
	/** Wird nach JEDER Antwort angezeigt (richtig oder falsch). */
	erklaerung: z.string(),
};

/** Multiple Choice: eine oder mehrere Antworten richtig */
const multipleChoice = z.object({
	typ: z.literal('mc'),
	...basis,
	optionen: z
		.array(z.object({ text: z.string(), richtig: z.boolean().default(false) }))
		.min(2)
		.refine((o) => o.some((x) => x.richtig), 'Mindestens eine Option muss richtig: true haben.'),
});

/** Zahleneingabe mit Toleranz */
const zahleneingabe = z.object({
	typ: z.literal('zahl'),
	...basis,
	loesung: z.number(),
	einheit: z.string().default(''),
	/** Erlaubte Abweichung, Standard: 2 % */
	toleranz: z.number().nonnegative().default(2),
	toleranzArt: z.enum(['prozent', 'absolut']).default('prozent'),
});

const quiz = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/quiz' }),
	schema: z.object({
		titel: z.string().optional(),
		fragen: z.array(z.discriminatedUnion('typ', [multipleChoice, zahleneingabe])).min(1),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Eigene Übersetzungen der Oberfläche (src/content/i18n/de.json)
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
	quiz,
};
