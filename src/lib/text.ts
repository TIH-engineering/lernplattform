// Wandelt kurze Texte aus den Quiz-Dateien (Markdown mit Formeln) in HTML um.
// Beispiel: 'Berechne $U_\mathrm{a}$ für **D = 0,5**.'
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import rehypeKatexSuche from './katex-suche.mjs';

const prozessor = unified()
	.use(remarkParse)
	.use(remarkMath)
	.use(remarkRehype)
	.use(rehypeKatex)
	.use(rehypeKatexSuche)
	.use(rehypeStringify);

/** Ganzer Absatz-Text (mit <p>-Absätzen). */
export function alsHtml(text: string): string {
	return String(prozessor.processSync(text.trim()));
}

/** Kurzer Text in einer Zeile (ohne umschließendes <p>). */
export function alsHtmlZeile(text: string): string {
	return alsHtml(text).replace(/^<p>([\s\S]*)<\/p>$/, '$1');
}

/** Zahl im österreichischen/deutschen Format, z. B. 0.524 → „0,524“. */
export function zahlDeutsch(wert: number): string {
	return wert.toLocaleString('de-AT', { maximumSignificantDigits: 6 });
}
