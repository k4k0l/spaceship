# Spaceship Game

Gra to zręcznościowa wariacja na temat klasycznych **Asteroids** napisana w HTML5 i JavaScripcie. Sterujemy kosmicznym kurierem, wykorzystujemy asysty grawitacyjne i dostarczamy absurdalne ładunki pomiędzy stacjami orbitalnymi.

Aktualna wersja gry: **0.5.0**

## Co to jest za gra
- Strzelanka zręcznościowa 2D z widokiem z góry.
- Sterowanie odbywa się za pomocą klawiatury: strzałki obracają i przyspieszają statek, spacja odpowiada za strzał.
- Asteroidy poruszają się w przewidywalnych pasach orbitalnych wokół dużych planet.
- Celem jest dokowanie przy kolejnych stacjach z bezpieczną prędkością, dostarczanie ładunków i uzyskanie jak najlepszego wyniku przed końcem czasu.

## Latest changes
- W wersji **0.5.0** dodano rzeczywisty cel singlowy: dostawy między czterema stacjami, premie czasu i wynik za dokowanie.
- Planety mają teraz duże, ręcznie rozmieszczone sylwetki, asteroidy poruszają się po czytelnych orbitach, a trajektoria statku jest przewidywana na ekranie.
- Uspokojono planszę, ograniczając liczbę asteroid, przeciwników i pickupów; usunięto również odrzut zwykłych pocisków i przyciąganie przez asteroidy.
- Przywrócono klasyczny widok z góry: usunięto pochylenie CSS i pseudoizometryczną projekcję.
- Symulacja korzysta ze stałego kroku 60 Hz, dzięki czemu sterowanie i grawitacja nie zależą od odświeżania monitora.
- Poprawiono paralaksę gwiazd, zachowanie na szwach toroidalnej mapy i cykl życia kolejnych sesji.
- WebRTC pozostaje eksperymentalne. Dotychczasowy publiczny endpoint Google Sheets obecnie odmawia dostępu, więc Host/Join nie jest funkcją gotową do wydania; plan migracji opisuje `docs/MULTIPLAYER.md`.
- Dodano animowane obracanie statku przy wyrównywaniu kierunku lotu.
- Usprawniono sterowanie na urządzeniach mobilnych: tapnięcie obraca i strzela w
  wybranym kierunku, a wirtualny joystick wskazuje aktualny ruch statku.
- Pole gry posiada teraz 10&nbsp;px margines wokół krawędzi okna.
- Zoptymalizowano viewport tak, aby w większych oknach widać było więcej planszy.
- Zmieniono dźwięk bonusu na dłuższy motyw "tuturututu".
- Kompletny refaktor kodu: cała logika została przeniesiona do klasy `Game` w pliku `game.js` i uruchamiana jest z modułu `main.js`.
- Dodano dokumentację w postaci komentarzy opisujących działanie poszczególnych metod i stałych.
- Poprawiono strukturę projektu tak, aby łatwiej było rozwijać go w przyszłości.
- Naprawiono błąd uniemożliwiający uruchomienie gry w przeglądarce (podwójna
  deklaracja zmiennych w funkcji rysującej minimapę).
- Dodano wrogie statki-emoji, poprawiono grawitację i minimapę oraz sygnały dźwiękowe.
- Uproszczone menu ustawień – parametry gry edytujemy teraz w polu tekstowym z JSON-em.
- Dodano współczynnik `gravityMultiplier` regulujący siłę grawitacji.
- Na minimapce pojawiła się strzałka prędkości statku oraz pulsujące okręgi namierzania przeciwników.
- Dodano ekran sterowania i sekcję "About" w menu.
- Pojawiła się nowa znajdźka `L` dająca laserowe pociski.
- Renderowanie świata i sterowanie używają jednego, klasycznego układu współrzędnych top-down.

## Możliwości gry i przebieg rozgrywki
- Sterowanie statkiem (obrót, przyspieszanie, strzał).
- Losowe generowanie asteroid na początku oraz w trakcie gry po ich rozbiciu.
- System punktów za niszczenie asteroid oraz bonusy zbierane przez gracza.
- Licznik czasu rundy oraz liczba żyć i poziom pancerza statku.
- Efekty cząsteczkowe przy wybuchach i wylocie gazów silników.
- Zbierane bonusy potrafią tymczasowo zmienić rozmiar statku (powiększenie lub pomniejszenie).

## Parametry gry i obiektów
- `DEFAULT_SHIP_RADIUS` – domyślny promień statku (20 pikseli).
- `DEFAULT_SHIP_MASS` – masa statku używana w obliczeniach kolizji.
- `BULLET_LIFE` – czas życia pojedynczego pocisku (3 sekundy).
- `SIZE_EFFECT_DURATION` – czas trwania efektu zmiany rozmiaru statku (30 sekund).
- `PICKUP_SIZE` – rozmiar bonusu na planszy.
- `EXHAUST_LIFE` – czas trwania cząsteczek spalin.
 - `ROUND_TIME` – czas trwania jednej rundy (150 sekund).
- `GRAVITY_MULT` – współczynnik siły grawitacji (0.2 domyślnie).
- `MIN_ASTEROID_RADIUS` – minimalny promień powstałych odłamków asteroidy.

Wszystkie powyższe wartości można teraz modyfikować w menu **Ustawienia**. Parametry zapisane są w małym pliku JSON wraz z komentarzami objaśniającymi znaczenie poszczególnych opcji.

## Zasady fizyki
- **Ruch statku i asteroid:** logika działa w stałych krokach 1/60 s. Historyczne wartości prędkości są wyrażone na krok symulacji; renderowanie może działać z dowolną częstotliwością bez przyspieszania gry.
- **Kolizje asteroid** wykorzystują uproszczoną zasadę zachowania pędu: po zderzeniu obiekty otrzymują przeciwnie skierowane składowe prędkości zależne od masy (`v1' = v1 - m2/m1 * Δv`).
- **Siła odrzutu pocisków** dodawana jest do prędkości obiektów w punkcie trafienia proporcjonalnie do ich masy.
- **Odbijanie się obiektów od krawędzi** realizowane jest przez przenoszenie pozycji na przeciwną stronę ekranu (toroidalna mapa).
- **Zmiana rozmiaru statku** skalowana jest liniowo, a jego masa rośnie lub maleje wprost proporcjonalnie do nowego promienia.

## Kierunek dalszego rozwoju

Docelową wizję angażującej kampanii singlowej, uproszczonej fizyki orbitalnej, stacji, pyłu, planet, czarnych dziur i trybów multiplayer opisuje [docs/GAME_VISION.md](docs/GAME_VISION.md). Dokument rozdziela fundamenty wymagane do pierwszego grywalnego prototypu od pomysłów na późniejsze etapy.

## Future ideas
- Lepsza oprawa graficzna i dźwiękowa.
- Rozbudowany system poziomów oraz nowych rodzajów przeciwników.
- Wsparcie dla sterowania dotykowego na urządzeniach mobilnych.
- Tryb wieloosobowy lokalny lub sieciowy.
- Zapis najlepszych wyników w pamięci przeglądarki.

## Problemy z udostępnianiem linków

We wcześniejszych wersjach gra generowała bardzo długie adresy URL z zakodowaną
konfiguracją sesji. Od wersji 0.5.0 wymieniamy jedynie krótki identyfikator
pokoju, więc problem długich linków praktycznie zniknął. Jeśli mimo to chcesz
używać pełnych linków z parametrem `session`, możesz je nadal skrócić np. przy
pomocy [cleanuri.com](https://cleanuri.com/).
