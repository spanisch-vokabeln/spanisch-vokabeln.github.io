# Bug-Fix-Plan – Español Vokabeln

Ergebnis des Audits vom 26.09.2026. Jeder Block ist so geschrieben, dass er **in einer eigenen Claude-Sitzung** ohne Vorwissen bearbeitet werden kann.

**So startest du eine Sitzung:**
> Lies `bugs.md` und bearbeite **Block X**. Hake erledigte Punkte in `bugs.md` ab.

**Regeln für jede Sitzung**
- Nur den eigenen Block anfassen; Auffälligkeiten außerhalb als Notiz unter „Offene Notizen“ am Ende eintragen.
- Nach den Änderungen: `npm run build` muss ohne Fehler und Warnungen durchlaufen.
- Im Browser prüfen (`npm run dev`, Handygröße 375 px, hell **und** dunkel).
- Am Ende den Status in der Übersicht unten auf ✅ setzen und einen Commit pro Block machen.

## Übersicht / Reihenfolge

| # | Block | Priorität | Abhängig von | Status |
|---|-------|-----------|--------------|--------|
| 1 | Antwortprüfung (Eintippen & Test) | 🔴 kritisch | – | ✅ |
| 2 | Zuordnungs-Modus hängt fest | 🔴 kritisch | – | ✅ |
| 3 | Notenschlüssel & Druckansichten | 🔴 kritisch | – | ✅ |
| 4 | Spiele (Arcade & Bilderquiz) | 🟠 Bug | – | ⬜ |
| 5 | Üben- & Test-Ablauf | 🟠 Bug | 1 | ⬜ |
| 6 | Lernstand, Fehlerwörter & Backup | 🟠 Bug | 2 | ⬜ |
| 7 | Vokabeldaten & Klassen-Bezeichnungen | 🟠 Bug | 1 | ⬜ |
| 8 | CSS, Schrift & Dunkelmodus | 🟠 Bug | – | ⬜ |
| 9 | Navigation & Bedienbarkeit | 🟡 UX | 5, 8 | ⬜ |
| 10 | PWA, Aufräumen & Abhängigkeiten | ⚪ Technik | – | ⬜ |

Die Blöcke 1–4 sind unabhängig voneinander und können in beliebiger Reihenfolge laufen.

---

## Block 1 – Antwortprüfung (Eintippen & Test) 🔴

**Problem:** `compareAnswers` in `src/utils/textComparison.js` bewertet viele richtige Antworten als falsch und manche Unsinns-Antworten als richtig. Betroffen sind die Übungsart *Eintippen* (`PracticeMode.jsx`) und der *Vokabeltest* (`TestMode.jsx`).

Gemessen über alle 2.676 Vokabeln:
- **Klammern (291 Einträge):** `stripPunctuation` entfernt nur die Klammerzeichen, der Inhalt bleibt. Die Eingabe ohne Klammerteil ist deshalb falsch:
  - „estar“ für `estar (irr.)`
  - „Herr“ für `(der) Herr`
  - „la bici“ für `la bici(cleta)`
  - „el agua“ für `el agua (f.)`
  - „unser“ für `unser(e)`
  - „poder hacer algo“ für `poder (ue) hacer algo`

  Als richtig gilt nur die unsinnige Eingabe „estar irr“.
- **Schrägstrich ohne Leerzeichen (19× `el/la …` und weitere):** Das `/` wird gelöscht, aus `el/la dentista` wird „ella dentista“. „el dentista“ und „la dentista“ gelten als falsch. Dasselbe passiert bei `er/sie/es ist`, `ab-/übergeben` und `el / la empleado/-a`.
- **Endungs-Alternativen (213 Einträge ≤ 2 Zeichen):** Bei `mucho, -a` wird am Komma getrennt, dadurch ist allein **„a“** eine richtige Antwort. Ebenso bei `erste, -r, -s` (dort genügt „r“ oder „s“) und `¿cuánto, -a, -os, -as?`.
- **Weitere Fälle:**
  - Die komplette Musterlösung „Guten Morgen! / Guten Tag!“ wird abgelehnt, weil nur einzelne Alternativen verglichen werden.
  - `ñ` wird zu `n` normalisiert: „ano“ für „año“ gilt als „richtig mit Akzentfehler“. Das sollte **falsch** sein, weil ñ ein eigener Buchstabe ist.
  - „Strasse“ für „Straße“ gilt als falsch; ß/ss sollte gleichwertig sein.
  - `jmd.` wird zu „jemand“, `alguien` aber zu „jemanden“ – das ist inkonsistent.

**Aufgaben**
- [x] Parser für Musterlösungen bauen, der aus einem Eintrag alle akzeptierten Varianten erzeugt:
  - [x] Klammern: Varianten **mit und ohne** Klammerinhalt. Beispiele: `unser(e)` → „unser“ und „unsere“; `(der) Herr` → „Herr“ und „der Herr“.
  - [x] Grammatik-Hinweise in Klammern komplett ignorieren, z. B. `(irr.)`, `(ue)`, `(ie)`, `(-g-)`, `(f.)`, `(+ infinitivo)`, `(+ Subst.)`, `(+ Adjektiv)`.
  - [x] Artikel-Paare `el/la X` → „el X“, „la X“, „X“. Geschlechtsendungen `empleado/-a` → „empleado“ und „empleada“.
  - [x] Endungen `, -a`, `, -r, -s`, `, -os, -as`: keine eigene Alternative daraus machen, sondern die Grundform (optional die abgeleitete Form) akzeptieren.
  - [x] Weiter trennen bei ` / `, `,` und `;`, aber niemals Fragmente unter 2 Buchstaben oder mit führendem `-` als Alternative zulassen.
- [x] `ñ` beim Akzentvergleich **nicht** zu `n` machen. á/é/í/ó/ú/ü bleiben „richtig mit Hinweis“.
- [x] `ß` ≙ `ss` als gleichwertig behandeln.
- [x] Abkürzungen vereinheitlichen: `jmd`, `jmdn`, `jmdm`, `alguien`, `algo`, `etw`.
- [x] Entscheiden und umsetzen, ob der Artikel bei Nomen optional ist. Empfehlung: ohne Artikel = „richtig, Artikel fehlt“ als Hinweis, analog zum Akzenthinweis. Dafür braucht die Rückgabe von `compareAnswers` ein neues Feld, z. B. `hint: 'accent' | 'article'`. Die Anzeige in `PracticeMode.jsx` (TypingMode, Feedback-Block) und `TestMode.jsx` (TestExam, Feedback-Block) entsprechend anpassen.
- [x] Prüfskript `scripts/check-answers.mjs` anlegen, das über **alle** Vokabeln in `src/data/vocab.js` läuft und meldet:
  - [x] jede Musterlösung, die sich selbst nicht akzeptiert;
  - [x] jede Variante ohne Klammerteil, die abgelehnt wird;
  - [x] jede akzeptierte Alternative mit weniger als 2 Buchstaben.

  Dazu `"check": "node scripts/check-answers.mjs"` in `package.json` eintragen.

**Umgesetzt (26.09.2026):** Artikel ist optional → „richtig, Artikel nicht vergessen“ (`hint: 'article'`, bei zusätzlichem Akzentfehler `'article-accent'`). `compareAnswers` liefert weiterhin `hasAccentWarning`. `getAcceptedAnswers()` zeigt alle akzeptierten Schreibweisen.

**Fertig, wenn**
- `npm run check` 0 Fehler meldet.
- Diese Beispiele stimmen:
  - „estar“ ✔
  - „el dentista“ ✔
  - „a“ für `mucho, -a` ✘
  - „ano“ für „año“ ✘
  - „Strasse“ ✔
  - „unsere“ ✔

---

## Block 2 – Zuordnungs-Modus hängt fest 🔴

**Datei:** `src/components/PracticeMode.jsx`, Funktion `MatchingMode` (ab ca. Zeile 578).

**Problem (im Browser nachgestellt):** Die Karten-IDs werden aus dem spanischen Wort gebildet (`es-${w.es}`, `de-${w.es}`). Steht dasselbe Wort zweimal in einer Runde, gibt es doppelte IDs. Ein Treffer blendet dann **beide** Paare aus, `roundMatched` steigt aber nur um 1. Am Ende ist das Brett leer, die Runde endet nie, und es geht nicht weiter.

Das passiert häufig:
- 246 Wörter sind sowohl in Klasse 7 als auch in 7n.
- 19 Wörter kommen doppelt innerhalb einer Klasse vor.
- Fehlerwörter können ebenfalls Duplikate enthalten.

**Aufgaben**
- [x] Beim Laden der Wortliste deduplizieren (nach `es`+`de`). Zusätzlich eindeutige IDs pro Karte über einen Index vergeben.
- [x] Wörter mit **gleicher deutscher Übersetzung** (z. B. „gut“ = bien / bueno) oder gleichem spanischem Text nicht in dieselbe Runde legen. Sonst sieht ein richtiges Paar wie ein Fehler aus.
- [x] Runde als beendet erkennen, wenn keine offenen Karten mehr übrig sind, statt einen separaten Zähler zu führen (robuster).
- [x] Ungenutzten State `matchedIds` entfernen.
- [x] Ergebnisse im Lernstand speichern: `recordWord(es, true/false)` pro Wort aufrufen. Ein Wort gilt als falsch, wenn es mindestens einmal falsch zugeordnet wurde. Am Ende `setMistakes(...)` aufrufen, wie in den anderen Modi.
- [x] „Nochmal“ soll neu mischen, statt dieselbe Reihenfolge zu wiederholen.
- [x] Schnelles Doppelklicken während der 400-ms-Rundenüberleitung darf nichts kaputt machen.

**Umgesetzt (26.09.2026):** Die Wortliste wird nach `es`+`de` dedupliziert. Karten-IDs laufen über einen Index. `buildRounds()` verteilt die Wörter so, dass kein spanischer und kein deutscher Text zweimal in einer Runde steht. Eine Runde endet, wenn keine offenen Karten mehr übrig sind. Bei einer falschen Zuordnung zählen **beide** beteiligten Wörter als falsch. `recordWord` läuft beim Treffer, `setMistakes` am Ende. Timer werden beim Verlassen abgebrochen, und während der Überleitung sind Klicks gesperrt. Im Browser getestet: kompletter Durchgang mit 7 + 7n (179 Runden), doppelte Fehlerwörter, „Nochmal“, Klick-Spam und Speichern der Fehler.

**Fertig, wenn**
- Mit Klasse 7 + 7n ausgewählt lassen sich mehrere komplette Durchgänge ohne Hänger spielen.
- Beim Test mit manuell gesetzten doppelten Fehlerwörtern (siehe unten) erscheint „Alle Paare gefunden“:
  ```js
  localStorage.setItem('vocab_mistakes', JSON.stringify([
    {es:'el perro',de:'der Hund'},{es:'el perro',de:'der Hund'},
    {es:'el gato',de:'die Katze'},{es:'la casa',de:'das Haus'},{es:'el oso',de:'der Bär'}]))
  ```

---

## Block 3 – Notenschlüssel & Druckansichten 🔴

**Problem:** Es gibt drei verschiedene Notenschlüssel:

| Wo | Datei | Schwellen für 1 / 2 / 3 / 4 / 5 |
|----|-------|------|
| Angezeigt im Test-Setup | `src/components/TestMode.jsx` ~Zeile 148 | 96 / 81 / 66 / 51 / 26 % |
| Tatsächlich vergeben | `getGrade()` in `src/data/vocab.js` (Dateiende) | 92 / 80 / 67 / 50 / 25 % |
| Gedruckter Klassentest | `src/utils/printTest.js` Zeile 3 | 90 / 75 / 60 / 45 / 20 % |

Wer 94 % hat, sieht im Schlüssel eine 2, bekommt aber eine 1.

**Aufgaben**
- [x] **Eine** gemeinsame Quelle schaffen, z. B. `src/utils/grading.js` mit `GRADE_SCALE` und `getGrade(pct)`. Alle drei Stellen nutzen sie, die Anzeige im Setup wird aus `GRADE_SCALE` erzeugt. Welcher Schlüssel gilt, **vorher den Nutzer fragen**; Vorschlag: 92/80/67/50/25.
- [x] Punktebereiche im Druck aus derselben Skala berechnen. Die Bereiche dürfen sich nicht überschneiden und nicht ungültig sein (bei 3 Wörtern entsteht aktuell „2–1 P.“). Mit 1, 3, 5, 7, 10, 20 und 30 Wörtern prüfen.
- [x] Kopfzeile des Druck-Tests (`TestMode.jsx` ~Zeile 171) korrigieren: Sie zeigt „Klasse 7n“ / „Klasse ks/7“. Stattdessen `vocabByGrade[g].label` verwenden (sinnvoll nach Block 7), sauber sortieren, und bei mehreren Klassen z. B. „Klasse 7 + 8“ schreiben.
- [x] HTML-Escaping für alle Vokabeltexte in `printTest.js` und in `handlePrint` von `src/components/VocabBrowser.jsx`.
- [x] Druck der Vokabelliste (`VocabBrowser.jsx`, `handlePrint`): bei aktiver Suche nur die Treffer drucken, oder eindeutig beschriften, dass alles gedruckt wird.
- [x] Wenn `window.open` blockiert wird (Popup-Blocker, iOS-Web-App), soll eine sichtbare Meldung erscheinen statt still nichts zu tun.
- [x] Toten Code entfernen: `src/components/PrintTest.jsx` wird nirgends importiert und hat einen eigenen, vierten Druckgenerator.

**Umgesetzt (26.09.2026):** Schlüssel laut Nutzer **96/81/66/51/26** (der bisher im Setup angezeigte). Einzige Quelle ist `src/utils/grading.js` (`GRADE_SCALE`, `getGrade`, `getGradeForPoints`, `getPointRanges`); `getGrade` in `vocab.js` wurde entfernt. Die Ergebnis-Note rechnet ohne Rundung, die angezeigte Prozentzahl wird abgerundet, damit sie nie über einer Notengrenze liegt. Die Punktebereiche im Druck werden Punkt für Punkt aus derselben Funktion erzeugt. Unerreichbare Noten erscheinen als „–“ (z. B. bei 3 Wörtern: 1 = 3 P., 2 = –, 3 = 2 P., 5 = 1 P., 6 = 0 P.). Mit 1/3/5/7/10/20/30 Wörtern geprüft: keine Überschneidungen. Kopfzeile über `formatGradeLabel()` („Klasse 7 + 8“). HTML-Escaping und Popup-Blocker-Meldung (`openPrintWindow`, `POPUP_BLOCKED_MSG`) liegen in `printTest.js`. Die Vokabelliste druckt bei aktiver Suche nur die Treffer und schreibt das in die Kopfzeile. `PrintTest.jsx` ist gelöscht.

**Fertig, wenn** Setup-Anzeige, Ergebnis-Note und Druck-Schlüssel bei denselben Prozentwerten dieselbe Note liefern.

---

## Block 4 – Spiele (Arcade & Bilderquiz) 🟠

**Datei:** `src/components/GamesHub.jsx`

**Aufgaben**
- [ ] **Leere Wortliste ohne Klassenwahl:** In Zeile 21 wird `buildWordPool([])` aufgerufen. Der Text sagt „Alle Vokabeln (keine Klasse ausgewählt)“, trotzdem sind drei Spiele gesperrt. Ohne Auswahl sollen alle Klassen genommen werden.
- [ ] **Contrarreloj-Uhr lässt sich austricksen:** Der `useEffect` der Uhr hat `score` in den Abhängigkeiten, deshalb startet das Intervall bei jedem Punkt neu. Wer schneller als in 1 Sekunde antwortet, verliert nie Zeit. Lösung: Endzeitpunkt (`deadline`) als Zeitstempel speichern, und `endGame` über eine Ref mit dem aktuellen Score aufrufen.
- [ ] **Nebenwirkungen in State-Updatern entfernen:** `timeout()` und `endGame()` werden innerhalb von `setTimeLeft(t => …)` bzw. `setTimeLeftSec(t => …)` aufgerufen. Im StrictMode läuft das doppelt (dann gehen 2 Leben verloren).
- [ ] **Supervivencia:** Timer anhalten, solange der Dialog „¿Abandonar el juego?“ offen ist. Derzeit verliert man dahinter Leben.
- [ ] **Doppelte richtige Antworten:** Ablenker werden in Zeile 127 nur nach `w.es` gefiltert. Ein Ablenker kann denselben Text wie die richtige Antwort haben (z. B. „gut“). Nach Antworttext filtern und deduplizieren.
- [ ] `question.cat` wird nie angezeigt, weil `buildWordPool` das Feld `topic` liefert, nicht `cat`. Richtiges Feld verwenden oder die Anzeige entfernen.
- [ ] `pool.sort(() => Math.random() - 0.5)` ist verzerrt und sortiert tausende Wörter pro Frage. Stattdessen 3 Zufallsindizes ziehen.
- [ ] Offene `setTimeout`s beim Verlassen des Spiels abbrechen (Cleanup, z. B. mit einer Ref-Liste).
- [ ] **Bilderquiz:** Wird während der Feedback-Pause der Modus gewechselt, ruft `next()` doppelt auf. Timer abbrechen. Ebenso beim Verlassen.
- [ ] Rekorde erst nach Spielende speichern und „¡NUEVO RÉCORD!“ auch im Racha-Modus anzeigen. Derzeit wird dort bei jedem Treffer gespeichert und nie ein Rekord angezeigt.

**Fertig, wenn**
- Contrarreloj bei schnellem Antworten trotzdem nach ≈ 60 s + Bonus endet.
- Spiele ohne Klassenauswahl startbar sind.
- Es keine doppelten Antwortoptionen gibt.

---

## Block 5 – Üben- & Test-Ablauf 🟠

**Dateien:** `src/components/PracticeMode.jsx`, `src/components/TestMode.jsx`

**Aufgaben**
- [ ] **Test abbrechen nach richtiger Antwort:** In `TestExam.submit` wird ein `setTimeout` von 900 ms nie abgebrochen. Bricht man beim letzten Wort ab, springt die App trotzdem zur Ergebnisseite. Timer in einer Ref speichern und bei Abbruch/Unmount löschen. Dasselbe in `MultipleChoiceMode` (1000 ms) und `TypingMode` (1200 ms).
- [ ] **Anzahl-Auswahl im Test:** Werte größer als `maxWords` ausblenden. Standardwert auf `min(20, maxWords)` setzen und bei Änderung der Themenauswahl nachführen.
- [ ] **Gemischte Richtung** in MC/Eintippen: `cardDir` wird erst per `useEffect` nach dem Rendern gesetzt, dadurch erscheint die neue Karte kurz in der alten Richtung. Richtung pro Karte beim Mischen festlegen, wie in `TestMode.startTest`.
- [ ] **„Nochmal“** in Karteikarten, Multiple Choice und Eintippen soll neu mischen bzw. neu nach Schwierigkeit sortieren.
- [ ] **Multiple Choice:** Ablenker untereinander deduplizieren (gleiche Texte) und mindestens 3 verschiedene sicherstellen. `useMemo` mit vollständigen Abhängigkeiten versehen.
- [ ] **Akzent-Knöpfe** (á é í ó ú ñ ü ¡ ¿):
  - [ ] an der Cursorposition einfügen statt am Ende;
  - [ ] danach den Fokus zurück ins Eingabefeld setzen, damit die Handy-Tastatur offen bleibt;
  - [ ] Großbuchstaben ermöglichen, z. B. mit Shift oder einem Umschalter.
- [ ] Eingabefeld mit `autoCapitalize="off" autoCorrect="off" spellCheck={false}` versehen, damit das Handy nicht automatisch korrigiert.
- [ ] Im Test gibt es direkt nach jeder Antwort Feedback. Klären, ob gewollt; optional „Prüfungsmodus“ mit Auswertung erst am Ende.
- [ ] Label „Themen“ im Test-Setup (`TestMode.jsx` ~Zeile 115) hat keine Dark-Variante.

---

## Block 6 – Lernstand, Fehlerwörter & Backup 🟠

**Dateien:** `src/utils/progress.js`, `src/utils/backup.js`, `src/components/VocabBrowser.jsx`, `src/components/HardWordsModal.jsx`, `src/components/HomePage.jsx`, `src/components/ProgressModal.jsx`

**Aufgaben**
- [ ] **Einheitliche Einstufung:** `getWordStatus` (progress.js: gut ab 75 % und 3 Versuchen) und `getProgressSummary` (backup.js: gut ab 80 % und 3× richtig) unterscheiden sich. Eine gemeinsame Funktion verwenden.
- [ ] **Fortschritts-Schlüssel:** Der Lernstand wird nur per spanischem Wort gespeichert. 112 Wörter haben aber je nach Klasse verschiedene Bedeutungen, z. B. `el tiempo` = Zeit oder Wetter, `como` = wie oder da/weil. Schlüssel auf `es|de` umstellen. **Migration** bestehender Daten: alte Einträge auf alle passenden neuen Schlüssel übertragen. Bestehende Lernstände dürfen nicht verloren gehen!
- [ ] **Fehlerwörter:**
  - [ ] nicht bei jeder Runde komplett überschreiben, sondern zusammenführen;
  - [ ] ein Wort erst entfernen, wenn es im Fehlerwörter-Modus richtig beantwortet wurde;
  - [ ] bei Abbruch mitten in der Runde die bisherigen Fehler trotzdem speichern;
  - [ ] Duplikate vermeiden.
- [ ] Text „Wörter aus letzter Session“ in `PracticeMode.jsx` entsprechend anpassen.
- [ ] Bleibt man nach dem Leeren der Fehlerliste im Fehlerwörter-Modus hängen, automatisch in den Normalmodus zurückspringen.
- [ ] **Leistung:** `WordCard` in `VocabBrowser.jsx` ruft `getWordStatus` pro Karte auf, und das liest jedes Mal den ganzen Lernstand aus localStorage. Bei „Alle“ sind das über 2.600 Mal pro Tastendruck in der Suche. Lernstand einmal pro Render laden und herunterreichen. Dasselbe in `HardWordsModal.jsx`.
- [ ] **HardWordsModal:** Wörter deduplizieren (gleiche Wörter aus mehreren Themen bzw. Klassen erscheinen doppelt).
- [ ] **Backup:**
  - [ ] Bilderquiz-Rekorde (`bq_*`) mit exportieren und importieren;
  - [ ] beim Import das Format prüfen (`vocab_progress` muss ein Objekt sein, `vocab_mistakes` ein Array);
  - [ ] „Fortschritt zurücksetzen“ klar beschriften: löscht es auch Spielrekorde oder nicht?
- [ ] `downloadProgress`: `URL.revokeObjectURL` erst verzögert aufrufen (Safari/Firefox brechen sonst manchmal den Download ab). Dateiname ohne `ñ`.
- [ ] Alle `localStorage`-Zugriffe (inkl. Inline-Skript in `index.html` und `darkMode.jsx`) in `try/catch` einpacken. Im privaten Modus bzw. bei voll belegtem Speicher stürzt die App sonst ab.

---

## Block 7 – Vokabeldaten & Klassen-Bezeichnungen 🟠

**Datei:** `src/data/vocab.js` (und `src/components/HomePage.jsx` für Labels)

**Aufgaben**
- [ ] **Klasse 7n** heißt ebenfalls `label: 'Klasse 7'`. Das führt zu „Klasse 7 + Klasse 7“, zwei gleichen Tabs in der Vokabelliste und mehrdeutigen Themen-Namen. Umbenennen, z. B. „Klasse 7 (Nueva Edición)“, mit Kurzform für enge Stellen.
- [ ] Sortierung der Auswahl-Zusammenfassung in `HomePage.jsx` (~Zeile 114): `localeCompare` sortiert „10“ vor „7“. Nach der Reihenfolge in `GRADE_GROUPS` sortieren.
- [ ] Doppelte Wörter innerhalb einer Klasse prüfen und bereinigen, **oder** als gewollte Wiederholung markieren. Liste:
  - 7: antiguo, -a · el alemán · septiembre
  - 8: los cereales
  - 9: el papel
  - 10: la forma · la fuente
  - ks: la solidaridad · la globalización · el cambio climático · la sostenibilidad · la inteligencia artificial · la automatización
  - 7n: el zapato · la clase · ya no · dibujar algo · normalmente · ¿Verdad?
- [ ] Mehrdeutige Einträge in Richtung Deutsch → Spanisch (gleiche deutsche Übersetzung für verschiedene spanische Wörter derselben Klasse). Im Test kann man nicht wissen, welches Wort gemeint ist. Unterscheidenden Hinweis ergänzen, z. B. „gut (Adverb)“ / „gut (Adjektiv)“. Liste:
  - 7: gut → bien / bueno · Das ist → Este es / Esta es · vor → antes de / delante de
  - 9: die Grenze → la frontera / el límite
  - 10: vielleicht → tal vez / quizá(s) · fleißig → estudioso / trabajador · jmdn. vor etw. warnen → alertar / advertir
  - ks: der Vertrag → el contrato / el tratado · das kulturelle Erbe → la herencia / el patrimonio cultural
  - 7n: etw. lernen → estudiar / aprender · alt → antiguo / viejo

  Alternativ in Block 1 **alle** spanischen Wörter mit gleicher Übersetzung als richtig akzeptieren.
- [ ] Die Anzahl „8 Kursthemen“ ist in `HomePage.jsx` ~Zeile 74 fest eingetragen. Aus `vocabByGrade.ks.topics.length` berechnen.
- [ ] Nach Block 1: `npm run check` erneut laufen lassen und Daten-Fehler beheben, die das Skript meldet.

---

## Block 8 – CSS, Schrift & Dunkelmodus 🟠

**Datei:** `src/index.css` (plus einzelne Komponenten)

**Aufgaben**
- [ ] **Tailwind-Klassen werden überschrieben:** `.card`, `.btn`, `.btn-*` stehen außerhalb eines CSS-Layers. In Tailwind v4 schlagen sie deshalb alle Utility-Klassen. Im Browser gemessen:
  - Die aktive Fehlerwörter-Karte (`border-rose-400 bg-rose-50`) bleibt grau.
  - `py-4` auf `.btn` wirkt nicht.
  - Die Startseiten-Karten brauchen deshalb Inline-`padding`.

  Lösung: die eigenen Klassen in `@layer components { … }` verschieben. Danach **alle Seiten visuell prüfen**, weil sich Abstände ändern können, und die Inline-Workarounds entfernen (z. B. `padding: '0.875rem'` in `HomePage.jsx` ActionCard).
- [ ] **Schrift „Inter“ wird nie geladen:** Der Build warnt „@import must precede all other statements“. Das `@import url(...)` für Google Fonts an den Dateianfang verschieben, oder besser per `<link>` in `index.html` laden. Alternativ die Schrift selbst hosten (offline-fähig, DSGVO).
- [ ] **Dark-Mode-Lücken ergänzen:**
  - Warnkasten in `ProgressModal.jsx` (`bg-amber-50 … text-amber-800`)
  - Fehlerwörter-Karte in `PracticeMode.jsx` (`bg-rose-50`, `bg-rose-100`)
  - Trennlinien `bg-gray-100` / `border-gray-100` in `VocabBrowser.jsx`, `PracticeMode.jsx` und `TestMode.jsx`
  - Zeitbalken `bg-gray-100` in `GamesHub.jsx` ~Zeile 232
  - Antwortkarten im Bilderquiz (`border-gray-100`, `bg-emerald-50`, `bg-red-50`)
  - Karteikarten-Texte `text-gray-300` / `text-indigo-600`
  - „TEST“-Badge im Test
- [ ] `theme-color` in `index.html` im Dunkelmodus anpassen (Statusleiste am Handy).
- [ ] Schwache Kontraste prüfen, z. B. `text-gray-300` auf Weiß bei „Tippen zum Aufdecken“ und bei den 🔊-Knöpfen.

**Fertig, wenn** `npm run build` keine CSS-Warnung mehr zeigt und alle Ansichten hell und dunkel sauber aussehen.

---

## Block 9 – Navigation & Bedienbarkeit 🟡

**Dateien:** `src/App.jsx` und die Komponenten

**Aufgaben**
- [ ] **Browser-/Handy-Zurück:** Die App nutzt keine History. Die Zurück-Geste bzw. -Taste unter Android schließt die ganze App.
  - [ ] Ansichten per `history.pushState` / `popstate` abbilden (oder Hash-Routing `#/practice` usw.).
  - [ ] Unteransichten (Übungsmodus, Spiel, Test) ebenfalls einbeziehen.
  - [ ] Bei laufendem Test bzw. Spiel den Abbruch-Dialog zeigen statt sofort zu verlassen.
- [ ] Klassenauswahl in `localStorage` merken; sie ist nach dem Neuladen weg.
- [ ] **Dialoge** (`FeedbackModal`, `ProgressModal`, `HardWordsModal`, Abbruch-Dialoge):
  - [ ] Schließen mit Esc;
  - [ ] Fokus in den Dialog setzen;
  - [ ] `role="dialog" aria-modal`;
  - [ ] Hintergrund nicht scrollen lassen.
- [ ] **Tastaturbedienung:** `ActionCard` auf der Startseite ist ein `div` mit `onClick`, der innere Button hat `tabIndex={-1}`. Das ganze Element zum Button machen. Dasselbe prüfen für `WordCard` (verschachtelte Buttons) und die Karteikarte.
- [ ] Icon-Buttons (🔊, 🚩, 🖨️, 📋, ×) mit `aria-label` versehen.
- [ ] **Vokabelliste (`VocabBrowser.jsx`):**
  - [ ] Suche akzent-unabhängig machen („espanol“ findet „español“).
  - [ ] Legende zeigt „Noch“ statt „Neu“: Zeile ~184 schneidet das Label beim Leerzeichen ab. Eigene Kurzlabels verwenden.
  - [ ] Knöpfe „Ab.“ / „Un.“ verständlich beschriften, z. B. „Nach Unidad gruppieren“; der `title` ist derzeit invertiert.
  - [ ] Beim Umschalten der Gruppierung `flipped` zurücksetzen, sonst sind falsche Karten aufgedeckt.
- [ ] Knopf „📋“ auf der Startseite hat keinen Text. Beschriften, z. B. „Wiederholen“.
- [ ] `FeedbackModal`: `navigator.clipboard` braucht einen Fehler-Fallback (unsicherer Kontext oder abgelehnt).

---

## Block 10 – PWA, Aufräumen & Abhängigkeiten ⚪

**Aufgaben**
- [ ] **Icons:** iOS unterstützt kein SVG als `apple-touch-icon`. PNG-Icons (180, 192, 512 px, plus maskable) aus `public/icon.svg` erzeugen und in `index.html` und `vite.config.js` (Manifest) eintragen.
- [ ] `apple-mobile-web-app-capable` ist veraltet; zusätzlich `mobile-web-app-capable` setzen.
- [ ] **Tote Dateien löschen:**
  - [ ] `src/utils/darkMode.js` (Duplikat von `darkMode.jsx`, JSX in einer .js-Datei);
  - [ ] `src/components/PrintTest.jsx`, falls nicht schon in Block 3 erledigt.
- [ ] Doppelten `shuffle`-Code (PracticeMode, TestMode, GamesHub) in `src/utils/shuffle.js` zusammenführen (Fisher-Yates).
- [ ] `npm audit fix` ausführen (6 Lücken, nur in Entwicklungs-Paketen), danach Build testen.
- [ ] GitHub-Action (`.github/workflows/deploy.yml`) um `npm run check` (aus Block 1) vor dem Build ergänzen.
- [ ] `README.md` mit Start-, Build- und Deploy-Anleitung anlegen.

---

## Offene Notizen

_(Hier tragen Sitzungen Funde außerhalb ihres Blocks ein.)_

- **Block 1 → Block 7:** Bei „etw. / a alguien“-Einträgen werden jetzt beide Varianten erzeugt („conocer algo“, „conocer a alguien“). Bei deutschen Einträgen wie `der / die Flüchtling/-in` erzeugt die Endungsregel auch „Flüchtlingin“ (harmlos, aber die Daten könnten `Flüchtling` ohne `/-in` schreiben).
- **Block 1 → Block 8:** `npm run build` zeigt weiterhin die CSS-Warnung „@import must precede all other statements“ (war schon vorher da, gehört zu Block 8).
- **Block 1 → Block 5:** Der Artikel-Hinweis verhindert wie der Akzent-Hinweis das automatische Weiterspringen (Nutzer muss „Weiter“ tippen). Falls das zu viele Klicks sind, in Block 5 überdenken.
- **Block 2 → Block 6:** Im Zuordnungs-Modus werden Fehlerwörter wie in den anderen Modi erst am Rundenende gespeichert und die Liste dabei überschrieben (bei 0 Fehlern gelöscht). Das Zusammenführen bzw. Speichern bei Abbruch gehört zu Block 6.
- **Block 3 → Block 7:** Die Druck-Kopfzeile nutzt jetzt `vocabByGrade[g].label`. Solange 7n ebenfalls „Klasse 7“ heißt, steht bei 7 + 7n dort „Klasse 7 + 7“. Das behebt die Umbenennung in Block 7 automatisch.
