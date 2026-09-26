# Español Vokabeln

Web-App zum Lernen von Spanisch-Vokabeln für Klasse 7–12 (¡Vamos! ¡Adelante!, Nueva Edición und Kursstufe): Vokabelliste, Üben (Karteikarten, Multiple Choice, Eintippen, Zuordnung), Vokabeltest mit Note und Druckversion sowie Spiele.

Live: <https://spanisch-vokabeln.github.io>

Die App läuft komplett im Browser. Lernstand, Fehlerwörter, Rekorde und die Klassenauswahl liegen nur im `localStorage` des Geräts (Sicherung über „Lernstand sichern“). Als PWA funktioniert sie auch offline.

## Voraussetzungen

- Node.js 22 (mindestens 20.19)
- npm

## Starten

```bash
npm install
npm run dev
```

Die App läuft dann unter der Adresse, die Vite ausgibt (standardmäßig <http://localhost:5173>).

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Produktions-Build nach `dist/` (inkl. Service Worker) |
| `npm run preview` | Den Build lokal ansehen |
| `npm run check` | Prüft die Antwortprüfung gegen **alle** Vokabeln (muss 0 Fehler melden) |
| `npm run icons` | Erzeugt die PNG-Icons in `public/` neu aus `icon.svg` und `icon-maskable.svg` |

## Deploy

Jeder Push auf `main` startet die GitHub-Action [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm ci` → `npm run check` → `npm run build` → Veröffentlichung von `dist/` im Branch `gh-pages` (GitHub Pages).

Schlägt `npm run check` fehl, wird nichts veröffentlicht.

## Aufbau

- `src/data/vocab.js` – alle Vokabeln nach Klasse und Thema (`label`/`short` pro Klasse, `GRADE_ORDER`)
- `src/data/bilderquiz.js` – Wörter und Bilder für das Bilderquiz
- `src/components/` – Seiten und Bausteine (Startseite, Vokabelliste, Üben, Test, Spiele, Dialoge)
- `src/utils/textComparison.js` – Antwortprüfung (Klammern, Artikel, Akzente, Alternativen)
- `src/utils/answerCheck.js` – akzeptiert zusätzlich alle anderen Bedeutungen desselben Wortes
- `src/utils/grading.js` – Notenschlüssel (einzige Quelle für Anzeige, Ergebnis und Druck)
- `src/utils/progress.js` – Lernstand (pro Wortpaar `es|de`) und Fehlerwörter
- `src/utils/backup.js` – Export/Import des Lernstands
- `src/utils/storage.js` – abgesicherter Zugriff auf `localStorage`
- `src/utils/backStack.js` – Browser-/Handy-Zurück-Taste
- `scripts/check-answers.mjs` – Prüfskript für `npm run check`

## Vokabeln ändern

1. Eintrag in `src/data/vocab.js` anpassen (`{ es: '…', de: '…' }`).
2. `npm run check` ausführen und gemeldete Fehler beheben.
3. Hinweise in Klammern werden bei der Prüfung ignoriert, z. B. `gut (Adverb)` akzeptiert „gut“.
