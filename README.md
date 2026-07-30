# Orbitalna Przesyłka

Grywalny pionowy wycinek zręcznościowej gry kurierskiej Canvas 2D. Domyślny tryb prowadzi przez ręcznie zaprojektowaną misję **Licencja kurierska: Pierwszy łuk**: bezpieczny start, dokowanie w Porcie Limonka, wybór trasy obok planety i dostawa do Błękitnej Przystani. Klasyczne Asteroids 0.4 i oba Easter Eggi pozostały dostępne przez menu.

## Uruchomienie

```bash
npm run serve
# http://localhost:4173
```

Nie jest wymagany bundler. Moduły ES są ładowane bezpośrednio przez przeglądarkę.

## Sterowanie

- `W` / `↑`: ciąg;
- `S` / `↓`: hamowanie przeciwne do bieżącej prędkości;
- `A`, `D` / `←`, `→`: obrót;
- `Esc`: pauza;
- na ekranie dotykowym: osobne przyciski obrotu, hamowania i ciągu.

Flight Assist Lite można wyłączyć na karcie kontraktu. Assist tłumi wyłącznie boczną składową ruchu, gdy nie działa ciąg ani hamowanie.

## Architektura i sprawdzenia

- `src/simulation.mjs` — deterministyczny fixed step 60 Hz, lot, dominująca grawitacja, predykcja, kolizje i dokowanie;
- `src/missions.mjs` — walidowany schemat oraz seed misji;
- `src/input.mjs`, `src/renderer.mjs`, `src/audio.mjs`, `src/storage.mjs` — odseparowane granice platformy;
- `src/app.mjs` — jawny automat ekranów i pojedynczy lifecycle pętli;
- `classic.html` — zachowana gra Asteroids 0.4 (`?mode=classic` jest dozwolone);
- `npm test`, `npm run check`, `npm run serve` oraz `node scripts/smoke.mjs mobile|desktop`.

Dokładny zakres, dowody i uczciwie niezamknięte metryki zewnętrznego playtestu opisano w `docs/playtests/stage-1-report.md`.
