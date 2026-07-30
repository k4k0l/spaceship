# Protokół weryfikacji — Etap 2

Data: 2026-07-30. Punkt startowy drzewa: `14c1c59` (w lokalnym klonie nie ma obiektu `20b20ed`, dlatego audyt wykonano na aktualnym HEAD zawierającym wdrożenie Etapu 1). Misja: `round-01`, seed `7319`, symulacja `flight-2`.

## Ponowna brama Etapu 1

Brama techniczna została ponownie sprawdzona, a brakującej bramy ludzkiej **nie uznano za zaliczoną**. Nie dostarczono surowych ani zagregowanych danych od 10 niezależnych testerów, więc nadal nie znamy rzeczywistego wyniku 8/10 ukończeń, mediany pierwszego doku ani liczby świadomych slingshotów. `stage-1-report.md` pozostaje prawdziwym protokołem oczekującego badania.

Wykryty realny brak fundamentu — brak dowodu ukończenia bez teleportowania statku w smoke — zamknięto testem sterującym wyłącznie wejściem `left/right/thrust/brake`. Kontroler przechodzi kolejno cztery doki, a stan zmienia tylko publiczne `step()` i `stationDecision()`: 60,35 s czasu symulacji, 4/4 doki, 3/3 decyzje, 100% kadłuba i 100% ładunku na seedzie onboardingowym. To dowód osiągalności, nie substytut ludzkiej oceny czy obietnica typowego czasu rundy. Dokowanie zachowuje limit prędkości i 0,65 s utrzymania.

**Decyzja wejściowa:** Etap 1 pozostaje warunkowy produktowo, ale fundament jest deterministyczny, osiągalny i jawnie oznaczony; zgodnie z poleceniem Etap 2 wykonano bez fabrykowania metryk ludzkich.

## Dowody automatyczne

- `npm test`: 33/33. Regresje fixed step/torusa oraz nowe testy obejmują dwa źródła grawitacji, predykcję, pełną input-only trasę, wszystkie trzy reguły ładunku, trzy decyzje stacji, pył, scoring, limit 24 obiektów, działko/czas życia pocisku, deterministyczny trace, ghost, ustawienia, telemetrię i lifecycle inputu/aplikacji.
- `npm run check`: składnia 21 plików JavaScript/MJS.
- `npm audit`: 0 podatności po podniesieniu Playwright powyżej wersji z GHSA-7mvr-c777-76hp.
- Headless Chromium: desktop 1366×768 i mobile 390×844, brak błędów konsoli; pięć retry na profil kończy się dokładnie jednym RAF-em i jednym zestawem listenerów. Osobno sprawdzono reduced motion oraz kredyty i dwa wejścia Easter Eggów.
- Screenshoty lokalne: po osiem stanów desktop/mobile (`contracts`, `briefing`, `safe-flight`, `gravity-route`, `dust-shortcut`, `collision-warning`, `docking`, `summary`) oraz mobile reduced-motion. Kontrolowane ustawienie stanu służy **wyłącznie** fixture'om obrazu, nigdy dowodowi grywalności.

## Własny playtest i strojenie

Własny, powtarzalny playtest wejściowy ukończył pełną sekwencję czterech stacji bez zapisu pozycji/teleportacji. Najkrótsza automatyczna linia zajęła 60,35 s, co ujawniło, że kryterium mediany 8–12 minut nie może zostać uczciwie potwierdzone automatem; początkujący wybór tras, błędy i decyzje stacyjne wymagają obserwacji ludzi. Trasa startowa została poszerzona (promień doku 138 px, limit 88 px/s), a kolejne doki stopniowo schodzą do 78 px/s. Bezpieczne linie i ryzykowne skróty są opisane oddzielnie na HUD/briefingu, ale ich czytelność pozostaje hipotezą do playtestu.

Seedy do badań:

| Profil | Seed | Oczekiwane decyzje |
|---|---:|---|
| onboarding | 7319 | pierwszy dok, bezpieczny objazd, wejście w pył lub nad nim, ciasny finał |
| standard | 18427 | wcześniejszy slingshot, wybór zabezpieczenia, skrót przez pył |
| trudny | 99041 | Assist Off, impuls ładunku przy doku, księżycowy łuk |

## Profilowanie i artefakty

Smoke używa realnych viewportów i pięciu retry; nie wykrył narastania listenerów, timerów ani pocisków (pocisk wygasa po 1,2 s, fire rate 0,55 s). Budżet świata zaczyna od 12 asteroid, a kontrakt limitu wynosi 24. Profil mobilny przeszedł funkcjonalnie; nie dysponowano fizycznym „średnim telefonem”, więc stabilnego 30/60 FPS na takim urządzeniu nie deklarujemy. Nakładka deweloperska pokazuje tick, ciało dominujące, przyspieszenie, prędkość i regułę ładunku. `artifacts/stage-2-smoke.json` i PNG są celowo ignorowane przez Git jako odtwarzalne binaria.

## Brama Etapu 2 — stan uczciwy

### Potwierdzone automatycznie / własnym testem

- pełna runda ma cztery odcinki i jest osiągalna samym inputem;
- trzy kontrakty mają odrębne, deterministyczne reguły bez odebrania kontroli;
- pył zwalnia miękko i nie zadaje losowych obrażeń;
- decyzje stacji, scoring, eksport lokalnej telemetrii, zapis ustawień, retry i reduced motion mają testy;
- desktop/mobile smoke, klasyk oraz oba Easter Eggi przechodzą.

### Oczekujące na zewnętrznych testerów / urządzenia

- mediana rundy 8–12 minut i pierwsza nagroda przed 60–90 s;
- 15 niezależnych rund: 60–80% sukcesu, <20% maksimum i zrozumiała przyczyna porażki;
- zdolność nazwania bezpiecznej trasy, ryzykownego skrótu i działania ładunku;
- subiektywna odczuwalność trzech kontraktów oraz decyzja co 20–30 s;
- stabilność na fizycznym średnim telefonie.

**Wniosek:** zakres implementacyjny 2.1–2.5 jest obecny, ale produktowa brama Etapu 2 pozostaje **warunkowa / NIEZAMKNIĘTA**. Nie wolno rozpoczynać Etapu 3, dopóki powyższe dane nie zostaną zebrane i parametry dostrojone do median.
