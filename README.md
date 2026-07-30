# Orbitalna Przesyłka

Grywalna, deterministyczna runda kurierskiej gry zręcznościowej Canvas 2D. Wybierz jeden z trzech ładunków, przeprowadź statek przez cztery doki, zdecyduj na stacjach między czasem, bezpieczeństwem i stylem, a następnie porównaj rozbity wynik. Dwie planety oferują różne slingshoty; chmura pyłu tworzy jawny skrót. Klasyczne Asteroids 0.4 i oba Easter Eggi nadal są dostępne przez menu.

## Uruchomienie

```bash
npm install
npm run serve
# http://localhost:4173
```

Nie jest wymagany bundler. Moduły ES są ładowane bezpośrednio przez przeglądarkę.

## Sterowanie

- `W` / `↑`: ciąg;
- `S` / `↓`: hamowanie przeciwne do prędkości;
- `A`, `D` / `←`, `→`: obrót;
- `Spacja`: powolne działko impulsowe odpychające lekki gruz;
- `Esc`: pauza;
- dotyk: osobne przyciski obrotu, impulsu, hamowania i ciągu.

Flight Assist Lite można wyłączyć na odprawie. Assist tłumi tylko składową boczną, gdy nie działa ciąg ani hamowanie. Pauza udostępnia regulację master/effects/UI i lokalną nakładkę developerską. Raport po rundzie można pobrać jako JSON; gra niczego nie transmituje.

## Architektura i sprawdzenia

- `src/simulation.mjs` — fixed step 60 Hz, lot, dominująca grawitacja, ładunki, pył, dokowanie, decyzje i scoring;
- `src/missions.mjs` — trzy kontrakty, walidowany schemat rundy i trzy jawne seedy testowe;
- `src/input.mjs`, `src/renderer.mjs`, `src/audio.mjs`, `src/storage.mjs` — odseparowane granice platformy;
- `src/app.mjs` — jawny automat ekranów i pojedynczy lifecycle;
- `classic.html` — zachowana gra Asteroids 0.4;
- `npm test`, `npm run check`, `npm run serve` oraz `node scripts/smoke.mjs mobile|desktop`.

Stan bram jakości, dowody automatyczne, własne playtesty i **oddzielnie** metryki czekające na zewnętrznych testerów opisują `docs/playtests/stage-1-report.md` i `docs/playtests/stage-2-report.md`. Etap 3 oraz real-time multiplayer nie są częścią tej wersji.
