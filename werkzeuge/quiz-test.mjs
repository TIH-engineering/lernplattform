// Testet die Prüflogik des Quiz (src/lib/quiz-pruefung.mjs).
// Aufruf:  node werkzeuge/quiz-test.mjs   (braucht keinen Build)
import { leseZahl, zahlRichtig, auswahlRichtig, hinweisZuGrund } from '../src/lib/quiz-pruefung.mjs';

let fehler = 0;
function pruefe(name, ist, soll) {
	const ok = Object.is(ist, soll) || (typeof soll === 'number' && Math.abs(ist - soll) < 1e-12);
	console.log(`${ok ? 'OK    ' : 'FEHLER'} ${name}: ${JSON.stringify(ist)}${ok ? '' : ` (erwartet ${JSON.stringify(soll)})`}`);
	if (!ok) fehler++;
}

// Zahlen lesen
pruefe('„2,5“', leseZahl('2,5').wert, 2.5);
pruefe('„2.5“', leseZahl('2.5').wert, 2.5);
pruefe('„4,7e-3“', leseZahl('4,7e-3').wert, 0.0047);
pruefe('„4.7E-3“', leseZahl('4.7E-3').wert, 0.0047);
pruefe('„-2,5“', leseZahl('-2,5').wert, -2.5);
pruefe('„−2,5“ (typografisches Minus)', leseZahl('−2,5').wert, -2.5);
pruefe('„ 1 200 “', leseZahl(' 1 200 ').wert, 1200);
pruefe('„,5“', leseZahl(',5').wert, 0.5);
pruefe('„1.234,56“ wird abgewiesen', leseZahl('1.234,56').grund, 'trenner');
pruefe('„12 V“ wird abgewiesen', leseZahl('12 V').grund, 'einheit');
pruefe('„4,7 mA“ wird abgewiesen', leseZahl('4,7 mA').grund, 'einheit');
pruefe('leere Eingabe', leseZahl('   ').grund, 'leer');
pruefe('„abc“', leseZahl('abc').grund, 'einheit');
pruefe('„2,“', leseZahl('2,').wert, 2);
pruefe('„--2“', leseZahl('--2').grund, 'format');
pruefe('Hinweistext vorhanden', hinweisZuGrund('trenner').length > 10, true);

// Toleranzen
pruefe('2 % von 100: 101,9 richtig', zahlRichtig(101.9, 100, 2, 'prozent'), true);
pruefe('2 % von 100: 102 (Grenze) richtig', zahlRichtig(102, 100, 2, 'prozent'), true);
pruefe('2 % von 100: 102,1 falsch', zahlRichtig(102.1, 100, 2, 'prozent'), false);
pruefe('negativ: −9 ± 2 %: −8,9 richtig', zahlRichtig(-8.9, -9, 2, 'prozent'), true);
pruefe('absolut 0 ± 0,01: 0,01 richtig', zahlRichtig(0.01, 0, 0.01, 'absolut'), true);
pruefe('absolut 0 ± 0,01: −0,02 falsch', zahlRichtig(-0.02, 0, 0.01, 'absolut'), false);
pruefe('Grenze 0,1 + 0,2 (Rundung)', zahlRichtig(0.1 + 0.2, 0.25, 0.05, 'absolut'), true);

// Multiple Choice
pruefe('MC eine richtig – richtig gewählt', auswahlRichtig(['2'], ['2']), true);
pruefe('MC eine richtig – falsch gewählt', auswahlRichtig(['1'], ['2']), false);
pruefe('MC mehrere – alle richtigen', auswahlRichtig(['3', '0'], ['0', '3']), true);
pruefe('MC mehrere – nur eine davon', auswahlRichtig(['0'], ['0', '3']), false);
pruefe('MC mehrere – eine zu viel', auswahlRichtig(['0', '1', '3'], ['0', '3']), false);
pruefe('MC nichts gewählt → kein Versuch', auswahlRichtig([], ['0']), null);

console.log(`\n${fehler ? fehler + ' Test(s) FEHLGESCHLAGEN' : 'Alle Tests bestanden.'}`);
process.exit(fehler ? 1 : 0);
