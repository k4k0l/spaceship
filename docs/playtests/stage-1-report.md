# Protokół weryfikacji — Etap 1

Data: 2026-07-30. Commit bazowy audytu: `53edb07`. Misja: `license-01`, seed `7319`, symulacja `flight-1`.

## Audyt przed implementacją

Sprawdzono bieżące drzewo, 12 ostatnich commitów, `README.md`, całą wizję oraz pięć testów bazowych. Potwierdzono monolity `game.js`/`main.js`, działający fixed step, torus i matematykę szwów, menu, dotyk oraz osobne pliki Easter Eggów. Klasyczny kod nie został skompresowany ani usunięty: jego dokument został zachowany jako `classic.html`, a logika jako kompatybilne `game.js` i `main.js`.

## Dowody automatyczne

- `npm test`: 19/19 testów. Obejmują schemat/seed, px/s, fade i dominację grawitacji, centrum bez `NaN`, Assist On/Off, hamowanie, predykcję równą integracji, klasyfikację kolizji, dokowanie 0,65 s, cooldown obrażeń, identyczny input trace, ghost oraz lifecycle inputu i aplikacji. Pięć testów klasycznych szwów/fixed step nadal przechodzi.
- `npm run check`: kontrola składni wszystkich 20 plików JS/MJS.
- Headless Chromium: flow desktop 1366×768 i mobile 390×844; po sześć PNG: briefing, bezpieczny lot, wejście w grawitację, ostrzeżenie kolizji, dokowanie, summary. Brak `pageerror`/console error w sprawdzonym flow.
- Klasyczny `classic.html#credits`: ekran kredytów oraz oba wejścia Easter Egg są widoczne; brak błędu, również gdy zewnętrzny odtwarzacz MIDI nie jest dostępny.

## Ręczny smoke i ograniczenia

Wykonano własny smoke sterowania klawiaturą i emulowanym dotykiem oraz deterministyczne ustawienie sześciu kontrolowanych stanów wizualnych. Sprawdzono retry, pauzę/wznowienie i powrót do menu bez drugiej aktywnej pętli/listenerów. Screenshoty są generowane lokalnie do ignorowanego katalogu `artifacts/screenshots/`; nie są śledzone przez Git, ponieważ transport PR nie obsługuje plików binarnych. Pełny komplet można odtworzyć komendą `node scripts/smoke.mjs` przy uruchomionym serwerze.

**Niepotwierdzona część bramy:** nie było dziesięciu niezależnych zewnętrznych prób graczy bez instrukcji. Nie deklarujemy zatem „8/10 ukończeń”, mediany pierwszego doku ani pięciu świadomych prób slingshota jako wyniku ludzi. Własny smoke potwierdza osiągalność akcji, a testy potwierdzają mechanikę, lecz nie zastępuje badania zrozumiałości. Protokół dla testerów: uruchomić czysty profil, bez komentarza obserwatora wykonać 10 prób; zapisać czas pierwszego doku, ukończenie, użycie pola oraz pytanie po próbie „dlaczego wybrałeś tę trasę?”. Brama produktowa pozostaje warunkowa do uzyskania wymaganych 8/10, mediany <90 s i ≥5 świadomych slingshotów.

## Checklista obrazu

Na nieruchomych kadrach cel ma limonkowy port i linię trasy, pole/łuk jest cyjanowy, stan ostrzegawczy bursztynowy, a kolizja koralowa. Statek, dwie sylwetki stacji, warstwowa planeta i asteroidy są rozpoznawalne geometrycznie. Mobile zachowuje te same cztery decyzje sterowania; elementy dotykowe mają co najmniej 44 px. `prefers-reduced-motion` wyłącza animacje UI.
