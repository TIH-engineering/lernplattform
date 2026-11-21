// Die Webseite liegt auf GitHub Pages in einem Unterordner (z. B. /lernplattform/).
// Dieses Modul stellt allen Links in den Inhalten, die mit „/“ beginnen, diesen Unterordner voran.
// So kannst du in den Texten weiterhin einfach [Link](/leistungselektronik/) schreiben –
// das gilt für normale Markdown-Links und für href="/…" bei Komponenten wie <LinkCard>.
export default function rehypeBasisLinks({ basis = '' } = {}) {
	const b = basis.replace(/\/$/, '');
	const anpassen = (href) =>
		typeof href === 'string' && b && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(b + '/')
			? b + href
			: href;

	const besuche = (knoten) => {
		if (knoten.type === 'element' && knoten.tagName === 'a' && knoten.properties) {
			knoten.properties.href = anpassen(knoten.properties.href);
		}
		if (knoten.type === 'mdxJsxFlowElement' || knoten.type === 'mdxJsxTextElement') {
			for (const attr of knoten.attributes ?? []) {
				if (attr.name === 'href') attr.value = anpassen(attr.value);
			}
		}
		knoten.children?.forEach(besuche);
	};
	return (baum) => besuche(baum);
}
