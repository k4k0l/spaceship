# Spaceship Game

Gra to prosta wariacja na temat klasycznych **Asteroids** napisana w HTML5 i JavaScripcie. Sterujemy małym statkiem kosmicznym i staramy się przetrwać jak najdłużej w polu asteroid. Projekt ma charakter demonstracyjny i służy jako baza do dalszych eksperymentów.

Aktualna wersja gry: **0.0.9**

## Co to jest za gra
- Strzelanka zręcznościowa 2D z widokiem z góry.
- Sterowanie odbywa się za pomocą klawiatury: strzałki obracają i przyspieszają statek, spacja odpowiada za strzał.
- Na planszy pojawiają się asteroidy i okazjonalne bonusy zmieniające rozmiar statku.
- Celem jest uzyskanie jak najwyższego wyniku zanim skończy się czas lub utracimy wszystkie życia.

## Latest changes
- Zaktualizowano do wersji **0.0.9**.
- Dodano animowane obracanie statku przy wyrównywaniu kierunku lotu.
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
- **Ruch statku i asteroid:** położenie aktualizowane jest według wzoru `x = x + v * dt`, gdzie `v` to aktualna prędkość, a `dt` to czas między klatkami.
- **Kolizje asteroid** wykorzystują uproszczoną zasadę zachowania pędu: po zderzeniu obiekty otrzymują przeciwnie skierowane składowe prędkości zależne od masy (`v1' = v1 - m2/m1 * Δv`).
- **Siła odrzutu pocisków** dodawana jest do prędkości obiektów w punkcie trafienia proporcjonalnie do ich masy.
- **Odbijanie się obiektów od krawędzi** realizowane jest przez przenoszenie pozycji na przeciwną stronę ekranu (toroidalna mapa).
- **Zmiana rozmiaru statku** skalowana jest liniowo, a jego masa rośnie lub maleje wprost proporcjonalnie do nowego promienia.

## Future ideas
- Lepsza oprawa graficzna i dźwiękowa.
- Rozbudowany system poziomów oraz nowych rodzajów przeciwników.
- Wsparcie dla sterowania dotykowego na urządzeniach mobilnych.
- Tryb wieloosobowy lokalny lub sieciowy.
- Zapis najlepszych wyników w pamięci przeglądarki.
