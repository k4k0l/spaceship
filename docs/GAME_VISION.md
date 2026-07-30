# Wizja gry: **Orbitalna Przesyłka**

## Jednozdaniowy pitch

**Zręcznościowa gra o kosmicznym kurierze, który wykorzystuje czytelne asysty grawitacyjne, aby w 8–12 minut dostarczać absurdalne ładunki między stacjami, ryzykować skróty i bić własne rekordy; drugi gracz ściga się lub współpracuje w dokładnie tych samych misjach.**

To nie powinien być ani surowy symulator, ani kolejny klon Asteroids. Fizyka orbitalna ma być źródłem decyzji i widowiskowych manewrów, ale gracz powinien rozumieć sytuację po jednym spojrzeniu i odzyskać kontrolę po błędzie.

## Diagnoza obecnej wersji

Obecna gra ma kilka ciekawych zabawek — bezwładność, grawitację, strafe, strzelanie, pickupy i minimapę — ale nie układa ich w jeden cel:

- 10–100 asteroid, do 3 planet i 3–10 przeciwników pojawia się jednocześnie na świecie 3000×3000;
- wszystkie systemy konkurują o uwagę, choć żaden nie buduje wyraźnej pętli rozgrywki;
- grawitacja zachowuje się jak nieustanna kara, zamiast jak przewidywalne narzędzie;
- pociski i kolizje dokładają chaos, ale nie pomagają w realizacji celu;
- wynik i licznik 150 sekund nie mówią graczowi, co jest dobrą decyzją;
- multiplayer nie może być substytutem brakującej kampanii lub celu singlowego.

Najważniejsza zmiana nie polega więc na dodaniu czarnych dziur. Najpierw trzeba zbudować **czytelną pętlę celu–ryzyka–nagrody**, a dopiero potem dodawać nowe obiekty.

## Trzy filary

### 1. „Jeszcze jeden idealny slingshot”

Planeta ma dawać okazję do rozpędzenia statku i skrócenia trasy. Gra pokazuje przewidywaną trajektorię na 2–3 sekundy do przodu oraz bezpieczny korytarz orbity. Dobry przelot blisko powierzchni napełnia mnożnik stylu.

### 2. „Dowieź ten głupi ładunek”

Każda runda ma konkretną trasę przez 3–6 stacji. Ładunek zmienia zasady: galaretka nie lubi przeciążeń, tort weselny nie może zostać ostrzelany, a klatka z miniaturową czarną dziurą okresowo przyciąga śmieci. Cel jest czytelny nawet bez fabuły.

### 3. „Ryzyko widać przed podjęciem decyzji”

Niebezpieczeństwa mają wyraźne sylwetki, kolory, zasięgi i zapowiedzi. Gracz wybiera bezpieczną dłuższą trasę albo widowiskowy skrót. Przypadkowa śmierć od obiektu spoza ekranu nie jest śmieszna — śmieszne jest świadome podjęcie złej decyzji i spektakularne konsekwencje.

## Pętla pojedynczej rozgrywki

1. **Kontrakt (10–15 s):** wybór jednego z trzech ładunków. Karta pokazuje trasę, modyfikator i nagrodę.
2. **Start przy stacji:** krótka, bezpieczna strefa pozwala sprawdzić sterowanie.
3. **Przelot:** gracz odwiedza stacje w kolejności, wykorzystując planety i bramy kontrolne.
4. **Decyzja co 20–30 s:** bezpieczna orbita, skrót przez pył, naprawa na stacji albo ryzyko bonusu.
5. **Narastanie trudności:** kolejne dostawy zmieniają układ lub aktywują jedno nowe zagrożenie — nigdy wszystko naraz.
6. **Finał po 8–12 min:** ostatni ekspresowy kontrakt, podsumowanie czasu, integralności ładunku, stylu i najlepszego slingshota.
7. **Nagroda:** nowy wariant statku, naklejka, kontrakt lub kosmetyczny ślad silnika; nie surowe zwiększenie statystyk.

Pierwsze 30 sekund musi zawierać start, pierwszy łuk grawitacyjny i dokowanie. Pierwsza sensowna nagroda powinna pojawić się przed 60 sekundą.

## Fizyka podporządkowana gameplayowi

### Model sterowania

- Zachować bezwładność, ale dodać domyślny **Flight Assist Lite**: gdy gracz nie przyspiesza, bardzo powoli wygasza wyłącznie prędkość poprzeczną względem kierunku statku. Nie jest to hamulec w przestrzeni, tylko pomoc pilota.
- Przycisk hamowania uruchamia czytelny ciąg wsteczny. Pełne wyzerowanie prędkości powinno trwać około 1,5–2 s, a nie następować natychmiast.
- Obrót pozostaje szybki i responsywny; maksymalna prędkość jest miękkim limitem, aby asysta grawitacyjna mogła chwilowo go przekroczyć o około 25%.
- Usunąć odrzut zwykłych pocisków. Może wrócić jako osobny, wyraźnie opisany „działkowy dopalacz” lub broń komediowa.
- Podstawowa broń służy do odsuwania małych odłamków, nie do prowadzenia ciągłej strzelaniny. Ma niski fire rate, mocny dźwięk i czytelny impuls celu.

### Grawitacja

- Na statek działa tylko **jedno dominujące źródło grawitacji**: ciało o największym wpływie w danym miejscu. Eliminuje to niezrozumiałą sumę wielu sił.
- Każda planeta ma widoczny pierścień wpływu. W zewnętrznych 20% siła łagodnie narasta, zamiast włączać się skokowo.
- Zastosować zmiękczony wzór `a = μ / (r² + softening²)` oraz limit maksymalnego przyspieszenia. Nie ma niewidzialnej osobliwości przy powierzchni.
- Wewnątrz atmosfery/niebezpiecznego promienia pojawia się jednoznaczny sygnał wizualny, a nie ciągły alarm na pół mapy.
- Pokazywać krótką linię predykcji trajektorii. Kolor: biały — swobodny lot, niebieski — przechwycenie orbity, żółty — niebezpieczny przelot, czerwony — kolizja.
- Opcja **Assist Off** zachowuje pełną bezwładność dla graczy szukających symulatora i ma osobną tabelę rekordów.

### Asteroidy

- Zamiast 10–100 losowych ciał: zwykle 8–20 istotnych asteroid na scenie.
- 70–80% asteroid należy do stabilnych, zaprojektowanych pasów orbitalnych wokół konkretnej planety. Mają wspólny kierunek, różne fazy i niewielki jitter.
- 20–30% to czytelne odłamki dynamiczne powstałe wskutek wydarzeń lub działań gracza.
- Asteroidy nie powinny wzajemnie przyciągać się w podstawowym trybie. To kosztowne obliczeniowo i wizualnie chaotyczne, a decyzje gracza na tym nie zyskują.
- Kolizje asteroid mają być rzadkim wydarzeniem zapowiedzianym pyłem i dźwiękiem. Po rozpadzie powstają maksymalnie 2–3 fragmenty, nie lawina.

### Kolizje i obrażenia

- Małe otarcie zabiera integralność ładunku i odpycha statek, ale nie przerywa natychmiast rundy.
- Statek ma 100 punktów kadłuba zamiast pięciu żyć × pięciu punktów pancerza. Stacja naprawia część uszkodzeń kosztem czasu lub wyniku.
- Po trafieniu działa 0,5 s odporności na kolejne obrażenia, aby pojedynczy kontakt nie naliczał szkody w każdej klatce.
- Obrażenia zależą od względnej prędkości i masy, a nie od samego faktu przecięcia kształtów.

### Parametry do pierwszego prototypu

| Parametr | Propozycja | Cel |
|---|---:|---|
| Rozmiar świata | 4200–5200 px | miejsce na 3–4 czytelne regiony |
| Aktywne planety | 2 duże + 1 mała | łatwe rozpoznanie dominującej grawitacji |
| Asteroidy | 12 start, maks. 24 | czytelność i przewidywalność |
| Wrogowie | 0 w tutorialu, 1–3 później | zagrożenie jako przyprawa |
| Runda | 8–12 min | pełny łuk kontraktów |
| Predykcja trajektorii | 2,5 s / 30 próbek | planowanie bez autopilota |
| Cooldown obrażeń | 0,5 s | brak obrażeń co klatkę |
| Prędkość przelotowa | ok. 160 px/s | czas na reakcję |
| Chwilowy boost orbitalny | do 200 px/s | nagroda za slingshot |

Wartości są hipotezą do playtestu, nie nowym zestawem świętych stałych. Stroimy je na podstawie czasu pierwszej dostawy, liczby kolizji i częstotliwości użycia asysty grawitacyjnej.

## Obiekty świata

### Stacje orbitalne — rdzeń gry

- Stacje wyznaczają trasę i są bezpiecznymi punktami oddechu.
- Każda orbituje wokół planety po czytelnym torze. Dokowanie polega na zrównaniu prędkości w szerokim stożku, a nie trafieniu w pojedynczy piksel.
- Typy: stacja kurierska, warsztat, bar z kontraktami, laboratorium i podejrzany kiosk „absolutnie legalnych dopalaczy”.
- Dokowanie daje wybór jednej korzyści, więc stacja jest decyzją, a nie wyłącznie checkpointem.

### Chmury pyłu — miękkie przeszkody

- Pył ogranicza widoczność i lekko tłumi prędkość, ale nie zadaje losowych obrażeń.
- Ujawnia turbulencje smugami oraz podświetla sylwetki asteroid tuż przed graczem.
- Może ukrywać skrót, pickup lub pirata. Kształt i animacja chmury pokazują kierunek przepływu.
- Pył jest dobrą zmianą tempa: przez kilka sekund lot staje się bardziej „manualny”, po czym następuje szybkie wyjście z chmury.

### Większe planety — landmarki, nie kule chaosu

- Każda planeta zajmuje znaczną część ekranu przy bliskim przelocie i ma unikalną paletę, pierścienie, atmosferę oraz zestaw orbit.
- Planeta lodowa daje długi, łagodny slingshot; gazowy olbrzym mocny boost; księżyc zapewnia ciasny techniczny zakręt.
- Planety nie poruszają się w trakcie krótkiej rundy. Ich stacje i asteroidy orbitują deterministycznie.
- Powierzchnia jest bezwzględną przeszkodą, lecz prognoza trajektorii ostrzega wystarczająco wcześnie.

### Czarne dziury — rzadki set piece

- Nie są losowym stałym elementem każdej mapy. Pojawiają się w finałowym kontrakcie lub specjalnym regionie.
- Mają ogromny, czytelny dysk akrecyjny i zakrzywiają warstwę gwiazd. Zasięg gameplayowy pozostaje ograniczony i widoczny.
- Pozwalają na największy skrót i mnożnik stylu, ale przeciążenie może uszkodzić delikatny ładunek.
- Po przekroczeniu horyzontu nie następuje zwykły ekran „game over”: statek zostaje wypluty w absurdalnym miejscu/czasie, dostaje karę i zabawną zmianę kontraktu. Śmierć jest rzadsza i bardziej pamiętna.

## Dynamika i humor

Humor powinien wynikać z mechaniki, nie z losowych żartów zasłaniających ekran:

- ładunki: „antymateria — nie potrząsać”, „jedna bardzo zła gęś”, „Wi‑Fi dla samotnej planety”, „pizza, wciąż teoretycznie ciepła”;
- kontroler lotu komentuje wyłącznie ważne zdarzenia jednym krótkim zdaniem;
- system ocenia manewry nazwami: `Elegancki Łuk`, `O włos`, `To miało tak być`, `Dokowanie bokiem`;
- statek może zatrąbić w próżni; opis przyznaje, że nikt tego nie słyszy;
- uszkodzenia mają czytelne, komediowe konsekwencje: odpada panel, radio łapie reklamę, ładunek zaczyna piszczeć;
- rekord przejazdu pokazuje ducha poprzedniego najlepszego lotu. To daje namiastkę rywalizacji jeszcze przed multiplayerem.

Dynamikę budujemy kontrastem: 15–25 sekund planowania i budowania łuku, 3–5 sekund szybkiego slingshota, chwila ulgi przy stacji. Ciągły hałas nie jest dynamiką.

## Oprawa wizualna

### Kierunek artystyczny

„Czytelna kreskówkowa mapa kosmiczna”: ciemne tło, płaskie nasycone kolory, jasne kontury i kilka dużych landmarków. Nie potrzebujemy realistycznych tekstur ani pseudo-3D.

- ograniczyć paletę regionu do koloru planety, koloru zagrożenia i koloru celu;
- warstwa gwiazd pozostaje spokojna; prędkość pokazują przede wszystkim spaliny, pył i mijane obiekty;
- dodać miękki velocity look-ahead kamery (maks. 10–15% ekranu), aby gracz widział przestrzeń przed statkiem;
- stacje, bramy i cele mają unikalne sylwetki, nie tylko litery lub kolory;
- linia trasy jest cienka i zanika blisko statku; trajektoria jest kropkowana, aby nie myliła się z trasą;
- poza ekranem pokazywać maksymalnie trzy priorytetowe wskaźniki: następna stacja, dominujące zagrożenie i opcjonalny bonus;
- eksplozje krótkie, kierunkowe i zależne od energii uderzenia; ograniczyć liczbę cząsteczek;
- minimapa zostaje uproszczona do strategicznej mapy trasy i orbit, bez każdej drobiny pyłu.

### Informacja na HUD

HUD powinien pokazywać: następny cel i odległość, integralność kadłuba/ładunku, czas kontraktu, mnożnik stylu oraz aktywną asystę. Liczba wrogów i alarm grawitacyjny znikają z głównego HUD, dopóki naprawdę nie są potrzebne.

### Dźwięk

- wysokość silnika zależy od ciągu, nie od prędkości;
- wejście w pole grawitacyjne dostaje subtelny narastający ton zamiast alarmu;
- dobry slingshot ma krótki, satysfakcjonujący „whoosh” i reakcję kontrolera;
- stacje mają własne dwusekundowe motywy;
- obsłużyć mute, głośności kategorii i `prefers-reduced-motion` dla błysków/drgań.

## Progresja singlowa

### Pierwsza godzina

1. **Licencja kurierska:** lot i łagodne dokowanie bez grawitacji.
2. **Pierwszy łuk:** jedna planeta, dwie stacje, widoczna predykcja.
3. **Kruchy ładunek:** uczy kontroli przeciążeń.
4. **Pas gruzu:** uczy wyboru trasy i użycia działka do odpychania.
5. **Pył i pirat:** pierwsze mieszane zagrożenie.
6. **Ekspres przez olbrzyma:** pierwszy pełny slingshot i tabela wyniku.

### Meta-progresja

Odblokowania powinny poszerzać styl, nie tylko zwiększać liczby:

- lekki statek: szybki obrót, delikatny ładunek;
- holownik: wolniejszy, może przesuwać asteroidy;
- statek „budżetowy”: niestabilny dopalacz, większy mnożnik stylu;
- moduły boczne: skaner trajektorii, mocniejsze hamowanie, wabik na piratów;
- kosmetyka: kolory spalin, naklejki, głos kontrolera.

## Multiplayer jako rozszerzenie działającego singla

Każdy tryb używa tych samych map, kontraktów, fizyki i kryteriów wyniku:

- **Ghost Race:** najpierw lokalny lub zapisany duch; nie wymaga synchronizacji w czasie rzeczywistym i jest najlepszym pierwszym krokiem.
- **Race:** dwóch graczy dostarcza ten sam ładunek przez te same bramy. Kolizje statków są miękkie lub wyłączone.
- **Co-op Delivery:** jeden statek holuje, drugi osłania/oznacza trasę; wspólny ładunek i wynik.
- **Sabotage Party:** krótki wariant imprezowy z ograniczonymi gadżetami, dopiero po dopracowaniu uczciwego wyścigu.

Nie budować osobnego „multiplayerowego świata”. Host uruchamia tę samą deterministyczną misję z seedem, a sieć synchronizuje inputy i autorytatywne zdarzenia. Szczegóły transportu opisuje `MULTIPLAYER.md`.

## Czego teraz nie dodawać

- pełnej symulacji N-body dla asteroid;
- proceduralnie generowanych 100 obiektów tylko dlatego, że silnik je obsłuży;
- kolejnych pickupów bez związku z kontraktem;
- drzewka 30 statystyk statku;
- craftingu, ekonomii i otwartego świata;
- permanentnej czarnej dziury na każdej mapie;
- frameworka fizycznego przed ustaleniem modelu sterowania;
- real-time multiplayera przed powstaniem deterministycznego Ghost Race.

## Plan realizacji

### Milestone 1 — „Czy latanie jest przyjemne?” (1 mapa)

- jedna duża planeta, dwie stacje, 8 asteroid na zaprojektowanych orbitach;
- Flight Assist Lite, miękka grawitacja dominującego ciała i trajektoria 2,5 s;
- brak wrogów, pickupów, czarnej dziury i losowego spawnu;
- jeden kontrakt oraz czas przejazdu;
- ghost najlepszego lokalnego wyniku.

**Odbiór:** 8/10 próbnych graczy dociera do drugiej stacji bez instrukcji słownej; co najmniej połowa świadomie używa slingshota; mediana pierwszej dostawy <90 s.

### Milestone 2 — „Pełna 10-minutowa runda”

- 3–4 stacje, dwa typy planet, pył i trzy typy ładunku;
- kadłub/integralność, naprawa, wynik stylu i podsumowanie;
- kamera look-ahead, nowy HUD, audio feedback;
- trzy ręcznie przygotowane seedy trudności.

**Odbiór:** 70% rund kończy się dostawą, ale mniej niż 20% maksymalnym wynikiem; gracze potrafią wskazać ryzykowny skrót i powód porażki.

### Milestone 3 — „Powód do powrotu”

- sześć krótkich kontraktów, trzy statki, rekordy i daily seed;
- czarna dziura jako finałowy set piece;
- balans na podstawie telemetryki lokalnej/playtestowej.

**Odbiór:** mediana sesji obejmuje co najmniej dwie rundy; minimum 30% testerów samodzielnie ponawia kontrakt, aby poprawić rekord.

### Milestone 4 — „Multiplayer bez pustki”

- online Ghost Race, następnie real-time Race;
- Cloudflare signaling/TURN i host-authoritative protocol zgodnie z `MULTIPLAYER.md`;
- co-op dopiero po stabilnym wyścigu.

## Telemetria playtestu

Bez wysyłania danych można generować lokalny raport JSON:

- czas do pierwszej stacji i ukończenia kontraktu;
- liczba kolizji oraz ich względna prędkość;
- czas spędzony w polu każdej planety;
- liczba udanych/nieudanych slingshotów;
- użycie hamowania, strafe i Flight Assist;
- przyczyna końca rundy;
- wybrana trasa i pominięte skróty;
- restart w ciągu 30 sekund od podsumowania.

Strojenie powinno odpowiadać na te dane. „Więcej obiektów” nie jest poprawką, jeśli gracz nie rozumie celu albo przyczyny porażki.

## Decyzja produktowa

Rekomendacja: nazywać projekt roboczo **Orbitalna Przesyłka**, zbudować Milestone 1 jako mały pionowy wycinek i czasowo usunąć z głównej rundy wrogów, losowe pickupy oraz wzajemną grawitację asteroid. Jeżeli sam lot stacja–planeta–stacja z ghostem nie jest satysfakcjonujący, żaden multiplayer ani czarna dziura tego nie uratuje. Jeżeli jest — wszystkie dalsze systemy mają już jasną rolę.
