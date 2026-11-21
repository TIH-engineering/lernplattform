// Kleines Zusatzmodul für die Formeln:
// KaTeX schreibt jede Formel zweimal ins HTML – einmal sichtbar und einmal als MathML
// für Screenreader. Die Suche soll nur die sichtbare Fassung lesen, sonst erscheinen
// in den Suchtreffern Formel-Quelltexte. Darum bekommt die MathML-Fassung das
// Attribut data-pagefind-ignore. Für Screenreader ändert sich nichts.
export default function rehypeKatexSuche() {
	const besuche = (knoten) => {
		if (knoten.type === 'element') {
			const klassen = knoten.properties?.className;
			if (Array.isArray(klassen) && klassen.includes('katex-mathml')) {
				knoten.properties.dataPagefindIgnore = '';
				return;
			}
		}
		knoten.children?.forEach(besuche);
	};
	return (baum) => besuche(baum);
}
