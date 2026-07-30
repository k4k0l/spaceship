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

## Audyt stanu bazowego (punkt startowy dla trzech sesji)

Audyt wykonano na wersji `0.4.0` po commicie przywracającym klasyczne Asteroids. To ważne: repozytorium **nie zawiera obecnie niedokończonej Orbitalnej Przesyłki**, lecz starą grę i wizję docelową. Następna implementacja ma ewoluować działający kod małymi, sprawdzalnymi krokami, a nie ponownie zastąpić niemal całe `game.js`, `main.js` i `index.html` jednym skompresowanym prototypem.

### Co naprawdę już działa

| Obszar | Stan w kodzie | Ocena | Decyzja |
|---|---|---|---|
| Pętla techniczna | Canvas 2D, `requestAnimationFrame`, akumulator i stały krok 1/60 s, limit długiej klatki | dobry fundament | **zachować**, wydzielić z monolitu bez zmiany zachowania |
| Sterowanie desktop | obrót, ciąg przód/tył, strafe, strzał, wyrównanie do wektora ruchu | responsywne, lecz za dużo akcji dla rdzenia kurierskiego | **zachować ruch**, zmienić Enter w opcjonalną asystę; broń schować poza tutorialem |
| Sterowanie dotykowe | tap-to-aim/shoot, dotykowy joystick i wskaźnik | funkcjonalne w starej pętli, nie odpowiada jeszcze dokowaniu i asystom | **modyfikować**, nie wyrzucać obsługi pointer/touch |
| Ruch i kolizje | bezwładność, toroidalny świat, kolizje na szwach, grawitacja wielu ciał, pięć żyć × pancerz | testowalny zalążek, ale model nie realizuje wizji | **zastąpić semantykę**, zachować funkcje matematyczne i fixed step |
| Świat | losowe planety, 10–100 asteroid, 3–10 wrogów, losowe pickupy | dużo aktywności, brak trasy i hierarchii | **zastąpić** deterministyczną misją; stary generator zostawić czasowo za flagą `classic` do porównań |
| Walka | pociski, laser, odrzut, rozpad asteroid, emoji-wrogowie | działa jako Asteroids, odciąga od dostaw | **usunąć z głównej misji**; ewentualnie później odzyskać jako odpychanie gruzu/piratów |
| Kamera | klasyczny top-down, śledzenie statku, poprawione szwy | czytelna baza | **zachować top-down**, dodać look-ahead i ograniczony obszar misji zamiast torusa |
| HUD i minimapa | wynik, 150 s, życia, pancerz, liczba wrogów, ping; mapa wszystkich drobiazgów | technicznie działa, produktowo komunikuje złą grę | **zastąpić informację**, zachować canvas minimapy i responsywne pozycjonowanie |
| Menu/ustawienia | komplet ekranów, pauza/resume, edytor JSON, About/Credits, ekran trybu | bogate, ale wizualnie niespójne i zbyt techniczne | **modyfikować etapami**; nie usuwać Easter Eggów ani dostępności |
| Audio | Web Audio, krótkie tony/noise, intro, przestrzenne zdarzenia i mute w zalążku | użyteczny feedback, brak spójnego sound designu | **zachować mechanizm**, wymienić paletę dźwięków i dodać kategorie |
| Multiplayer | prototyp WebRTC, niedostępna sygnalizacja, niepełna synchronizacja; przyciski uczciwie wyłączone | niegotowy i poza krytyczną ścieżką | **zamrozić**; wrócić dopiero po deterministycznym Ghost Race |
| Testy | pięć testów matematyki/fixed step w `node:test` | dobre, ale zdecydowanie za mało | **rozbudować przed refaktorem** o fizykę, misję, dokowanie i zapis |
| Easter Egg | labirynt i „kieszeń rzeczywistości”, osobne pliki/sceny | niezależny, charakterystyczny dodatek | **zachować bez zmian**, pilnować regresji nawigacji |

### Audyt wizualny: co warto ocalić

**Dobre lub obiecujące:**

- prawdziwy widok top-down — kierunek statku i wektor lotu nie są zniekształcone;
- spokojne, wielowarstwowe pole gwiazd i prosty paralaksowy ruch dają głębię bez assetów;
- jasny kontur trójkątnego statku, kolorowe kontury asteroid oraz krótkie spaliny są natychmiast czytelne;
- ograniczona geometria Canvas 2D jest właściwą technologią dla stylu „kreskówkowej mapy”; nie ma powodu migrować do Three.js lub frameworka;
- minimapa i fizycznie osobny HUD są użytecznymi powierzchniami informacyjnymi;
- ekran menu z polem gwiazd oraz easter eggi budują charakter projektu i nie powinny zniknąć wskutek przebudowy.

**Do poprawy:**

- czyste `#000`, przypadkowa tęczowa paleta i jednakowe grubości linii dają wygląd demonstracji technicznej; potrzebna jest paleta semantyczna, hierarchia kontrastu, glow tylko dla celu i atmosfery;
- planety są płaskimi kołami bez atmosfery, pierścieni wpływu, powierzchni i rozpoznawalnej sylwetki;
- asteroidy są czytelne osobno, ale w liczbie do 100 zamieniają ekran i minimapę w szum;
- statek nie ma wyraźnej masy, thrusterów bocznych, hamowania ani wizualnego stanu uszkodzeń;
- emoji-wrogowie stylistycznie nie pasują do geometrycznej reszty; jeśli piraci wrócą, muszą dostać własną sylwetkę Canvas;
- kwadratowe pickupy z literą są czytelne, ale wyglądają jak placeholdery i nie mają roli w dostawie;
- HUD jest półprzezroczystą listą danych diagnostycznych, zasłania górę ekranu i nie buduje priorytetu „następna stacja → stan ładunku → czas”;
- menu używa ogromnych domyślnych przycisków i mieszanki polskiego/angielskiego; brak kart kontraktów, layoutu małych ekranów i spójnych stanów focus/hover;
- alarm grawitacji zmienia border canvasu i odtwarza alarm z renderera minimapy — jest natarczywy, zależny od klatek i nie wyjaśnia kierunku zagrożenia;
- pełnoekranowy błysk `difference` i drgania nie respektują jeszcze konsekwentnie `prefers-reduced-motion`.

### Dług techniczny, który może wykoleić kolejną implementację

1. `game.js` łączy stan misji, input, fizykę, spawn, kolizje, audio-hooki, render i sieć w jednej klasie liczącej prawie 1800 linii.
2. `main.js` łączy routing ekranów, audio, dotyk, ustawienia, easter eggi i WebRTC; przebudowa wszystkiego naraz ma olbrzymi promień regresji.
3. Historyczne prędkości są zapisane jako „piksele na tick”, podczas gdy nowa wizja podaje `px/s`. Przed strojeniem trzeba ustalić jednostki SI-podobne (`px`, `s`, `px/s`, `px/s²`) i testami zabronić ponownego pomieszania.
4. Losowość korzysta z `Math.random()`, więc błędy i ghosty nie są odtwarzalne. Każda misja musi mieć jawny seed i wstrzykiwany PRNG.
5. Aktualny torus jest dobry dla Asteroids, ale kłóci się z ręcznie zaprojektowaną mapą, wskaźnikami celu i predykcją. Nowy tryb powinien mieć ograniczony świat i łagodne zawracanie/ostrzeżenie na obrzeżu; funkcje szwów zostają dla `classic` i testów.
6. Renderowanie wywołuje efekt audio alarmu, a aktualizacja mutuje tablice przez `splice` wewnątrz `forEach`; rozdzielenie symulacji od efektów i bezpieczne kolejki zdarzeń jest warunkiem deterministyczności.
7. Brakuje automatycznych testów przepływu UI i zrzutów referencyjnych. Każdy etap musi kończyć się uruchomieniem w realnej przeglądarce desktop/mobile, nie tylko `node --test`.
8. Poprzednia próba przebudowy usunęła tysiące linii i zastąpiła je około 150 liniami gęsto skompresowanego prototypu. Miała wiele właściwych pomysłów, lecz bez izolacji modułów, etapowych commitów, testów regresji i kontroli jakości wizualnej była niemożliwa do bezpiecznej recenzji. **Zakazujemy powtórzenia strategii „rewrite w jednym pliku/commicie”.**

## Kontrakt wykonawczy dla Codex

Te zasady obowiązują we wszystkich trzech kolejnych sesjach:

1. **Najpierw stan i test, potem wygląd, potem zawartość.** Nie stroić efektów na niestabilnej fizyce.
2. Każda sesja zaczyna się od `git status`, lektury tego dokumentu i uruchomienia testów bazowych. Nie zakładać, że poprzednia sesja ukończyła wszystko — zweryfikować kryteria odbioru.
3. Pracować w małych logicznych commitach lokalnie, ale na końcu sesji pozostawić jeden spójny, uruchamialny stan. Nigdy nie kasować działających Easter Eggów ani klasycznego trybu bez jawnego zamiennika i testu.
4. Nowy kod dzielić co najmniej na: deterministyczny model/symulację, dane misji, renderer, input oraz UI/aplikację. `Game` może być fasadą przejściową, nie nowym miejscem na całą logikę.
5. Wszystkie parametry gameplayowe trzymać w jednym opisanym obiekcie konfiguracji; żadnych „magic numbers” rozrzuconych między update i draw.
6. Symulacja nie czyta DOM, czasu ściennego, `Math.random()` ani audio. Zwraca zdarzenia (`dock`, `damage`, `slingshot`, `finish`), które konsumują UI/renderer/audio.
7. Każda nowa mechanika otrzymuje test jednostkowy lub deterministyczny scenariusz. Każda perceptualna zmiana UI otrzymuje screenshot desktop i mobile oraz ręczną checklistę czytelności.
8. Respektować `devicePixelRatio`, resize, sterowanie klawiaturą i dotykiem, focus-visible, mute oraz `prefers-reduced-motion` od pierwszego etapu, nie jako „polish na koniec”.
9. Nie dodawać zależności ani assetów sieciowych, jeżeli Canvas/CSS/Web Audio wystarczą. Gra ma działać po prostym `python3 -m http.server` także bez Google Fonts/CDN (fallbacki muszą być poprawne).
10. Nie implementować real-time multiplayera, ekonomii, craftingu, proceduralnego świata, wielu wrogów ani czarnej dziury przed przejściem bram jakości Etapów 1–2.
11. Po każdym większym podzadaniu wykonać: testy, lint/syntax check, krótki smoke test w przeglądarce i kontrolę `git diff --stat`. Jeśli diff rośnie bez proporcjonalnych testów, przerwać i podzielić pracę.
12. Nie deklarować sukcesu na podstawie samego uruchomienia. Raport końcowy ma podać wykonane kryteria, świadomie odłożone elementy, screenshoty i wyniki testów/playtestu.

## Plan w trzech dużych etapach (trzy kolejne sesje)

### ETAP 1 — Bezpieczny pionowy wycinek: „lot ma sens”

**Cel sesji:** dostarczyć jedną kompletną, 2–4-minutową misję stacja–planeta–stacja, w której cel, grawitacja, trajektoria i dokowanie są czytelne. To ma być solidny fundament, a nie miniaturowa atrapa całej wizji.

#### 1.1. Zabezpieczenie stanu bazowego i architektury

- dodać skrypty/komendy developerskie bez wymuszania bundlera: `node --test`, sprawdzenie składni wszystkich JS oraz prosty serwer lokalny;
- dopisać testy obecnych kontraktów: fixed step, input mapping, cleanup listenerów, resize, restart, szwy torusa;
- wprowadzić osobny katalog modułów (np. `src/`) ładowanych jako ES modules: `simulation.js`, `missions.js`, `input.js`, `renderer.js`, `storage.js`; pozostawić `game.js` jako kompatybilną fasadę tylko tak długo, jak potrzebne;
- zdefiniować jawny automat stanów aplikacji: `menu → contract → briefing → playing → paused → summary`; upewnić się, że ponowny start nie duplikuje pętli/listenerów;
- stworzyć seedowany PRNG oraz schemat misji z walidacją wymaganych pól. W tej sesji istnieje tylko `license-01`, ale format ma pomieścić następne misje;
- dodać flagę developerską `?mode=classic`, jeśli zachowanie starego Asteroids jest potrzebne do regresji. Domyślny produkt przechodzi na nowy wycinek dopiero po przejściu bramy 1.

#### 1.2. Deterministyczny model lotu

- przejść w nowej symulacji na jednostki `px/s`; stworzyć test scenariusza, że 160 px/s przez sekundę przesuwa statek o 160 px niezależnie od klatek renderera;
- zaimplementować obrót, ciąg, ciąg wsteczny i Flight Assist Lite wygaszający tylko składową boczną; tryb Assist Off i jego stan muszą być jawne;
- zastosować miękki limit 160 px/s i zezwolić grawitacji na chwilowe ~200 px/s; hamowanie do zera stroić na 1,5–2 s;
- dodać dominujące źródło grawitacji, softening, limit przyspieszenia i łagodne wejście przez zewnętrzne 20% pierścienia;
- predykcję trajektorii liczyć tą samą funkcją integracji co statek (2,5 s, 30 punktów), bez inputu przyszłego i bez modyfikowania świata;
- zbudować testy dla: granicy wpływu, wyboru dominującego ciała, braku `NaN` w centrum, klasyfikacji kolizji, zgodności predykcji z rzeczywistym lotem oraz Assist On/Off;
- broń, pickupy, wrogów, wzajemną grawitację asteroid i losowy spawn wyłączyć w tej misji, ale nie wycinać pochopnie kodu klasycznego.

#### 1.3. Jedna ręcznie zaprojektowana misja

- mapa 4200–4800 px: jedna duża planeta-landmark, dwie stacje i dokładnie 8 asteroid na deterministycznych orbitach; bez pyłu i przeciwników;
- start w bezpiecznej bańce; pierwsza stacja/łuk widoczne natychmiast; optymalna trasa wymaga jednego świadomego slingshota, a bezpieczna trasa nadal pozwala ukończyć misję;
- stacje poruszają się deterministycznie po orbitach albo — jeśli utrudnia to onboarding — pierwsza pozostaje nieruchoma, a ruch wchodzi dopiero po pierwszym doku;
- dokowanie: szeroki stożek/okrąg, czytelny limit prędkości względnej, pasek 0,65 s i komunikaty `PODEJDŹ / ZWOLNIJ / UTRZYMAJ`;
- małe otarcie zabiera kadłub/ładunek według względnej prędkości, odpycha i daje 0,5 s cooldown; brak natychmiastowej utraty rundy od jednego błędu;
- lokalny ghost zapisuje wersję symulacji, seed, tryb assist i próbki pozycji; nie odtwarzać niezgodnego formatu.

#### 1.4. Pierwszy pass wizualny i UX

- zachować top-down, paralaksę i geometryczny statek, ale ustalić tokeny palety CSS/JS: tło granatowe, cel limonkowy, grawitacja cyjanowa, ostrzeżenie bursztynowe, kolizja koralowa;
- rozbudować planetę o atmosferę, 2–3 warstwy koloru, subtelny terminator/pasy i pierścień wpływu; stacje otrzymują dwie różne sylwetki, port i obracający się element;
- dodać velocity look-ahead do maks. 12% krótszego wymiaru, z wygładzeniem i natychmiastowym ograniczeniem przy celu/kolizji;
- trajektoria kropkowana z semantycznymi kolorami; trasa cieńsza, mniej kontrastowa i wygaszona blisko statku; nie mogą wyglądać identycznie;
- nowy HUD pokazuje tylko cel+dystans, kadłub, ładunek, czas, styl i Assist. Trzy maksymalne wskaźniki off-screen, dostępne także kształtem/ikoną, nie wyłącznie kolorem;
- uprościć minimapę do planety, orbit, stacji, trasy, statku i ghosta; ukryć drobiny;
- zbudować ekran karty jednego kontraktu i summary z czasem, integralnością, slingshotem oraz `Spróbuj ponownie`;
- dostosować dotyk: osobny obszar kierunku/ciągu i dostępne hamowanie/assist; nie łączyć obowiązkowego strzału z tapnięciem w nowym trybie;
- dodać subtelne audio wejścia w grawitację, ciągu, hamowania, dokowania i slingshota; wszystkie efekty zdarzeniowe, nigdy z `draw()`.

#### 1.5. Brama jakości Etapu 1

Etap jest zakończony tylko, gdy:

- `node --test` przechodzi i obejmuje deterministyczność, lot, grawitację, predykcję, kolizję, dokowanie, ghost oraz lifecycle;
- ta sama misja z tym samym input trace kończy się identycznym stanem i wynikiem co najmniej w dwóch uruchomieniach;
- pełny flow `menu → kontrakt → gra → pauza → gra → summary → retry → menu` działa bez błędów konsoli i podwójnej pętli;
- desktop 1366×768 oraz mobile 390×844 nie mają nachodzącego HUD-u, uciętych przycisków ani nieosiągalnej akcji;
- screenshoty dokumentują: briefing, bezpieczny lot, wejście w grawitację, ostrzeżenie kolizji, dokowanie i summary w obu viewportach;
- ręczny playtest 10 prób: minimum 8 ukończeń bez czytania instrukcji poza UI, mediana pierwszego doku <90 s, minimum 5 świadomych prób slingshota;
- stary tryb/easter eggi nadal dają się otworzyć albo zostały świadomie oznaczone jako poza produktem — bez przypadkowego martwego ekranu.

**Nie robić w Etapie 1:** sześciu misji, pyłu, piratów, czarnej dziury, daily seed, real-time multiplayera ani szerokiej przebudowy ustawień.

---

### ETAP 2 — Pełna angażująca runda: „cel–ryzyko–nagroda”

**Warunek wejścia:** brama Etapu 1 jest faktycznie spełniona. Jeśli nie, sesję rozpocząć od naprawy braków; nie budować zawartości na niestabilnym locie.

**Cel sesji:** rozwinąć wycinek do jednej dopracowanej rundy 8–12 minut z 3–4 dostawami, trzema ładunkami, dwiema wyrazistymi planetami, pyłem i decyzją co 20–30 sekund.

#### 2.1. Kontrakty i dramaturgia rundy

- ekran wyboru dokładnie 3 kart: nazwa, prosta ikona, zasada ładunku, trudność, trasa, potencjalna nagroda; wybór klawiaturą, dotykiem i screen readerem;
- kontrakty: delikatna galaretka (limit przeciążeń), zła gęś (rzadki, zapowiedziany impuls/odchylenie, nigdy odebranie kontroli bez ostrzeżenia) oraz mini-osobliwość (okresowo przyciąga pobliski lekki gruz);
- jedna runda składa się z 3–4 odcinków: nauka → wybór skrótu → komplikacja → ekspresowy finał; trudność dokłada najwyżej jeden nowy bodziec naraz;
- stacje: kurierska, warsztat i kiosk; po dokowaniu krótki wybór `naprawa kosztem czasu / zabezpieczenie ładunku / bonus stylu`, nie modal zasłaniający sytuację bez pauzy;
- wynik rozbić na czas, integralność, styl i premie kontraktu. Pokazać graczowi, co konkretnie poprawić przy retry.

#### 2.2. Ryzyko czytelne przed decyzją

- dodać drugą planetę o zupełnie innej sylwetce i dynamice: gazowy olbrzym z mocnym szerokim slingshotem oraz mały księżyc z ciasnym łukiem;
- 12 asteroid startowych, maksimum 24: 70–80% na zaprojektowanych orbitach, reszta jako zdarzenia z telegraphingiem; rozpad maks. na 2–3 fragmenty;
- chmura pyłu ma miękką krawędź, smugi kierunku, przygaszenie dalszych warstw i odsłanianie bliskich sylwetek; spowalnia, ale nie zadaje losowych obrażeń;
- utworzyć dwie trasy między celami: dłuższą bezpieczną i krótszą przez jawne ryzyko. Wskaźnik trasy nie wybiera za gracza — pokazuje koszt i kierunek;
- podstawowe działko do odpychania małych odłamków wraca dopiero tutaj: niski fire rate, brak odrzutu statku, wyraźny impuls celu. Nie tworzyć bullet-hell;
- opcjonalny pojedynczy pirat może wejść wyłącznie po playteście bez walki; telegraph, zasięg i sposób uniknięcia muszą być widoczne. Jeśli psuje pętlę, odłożyć go bez szkody dla etapu.

#### 2.3. Feel, art pass i dźwięk

- statek otrzymuje kadłub, cockpit, tylne/boczne/przednie dysze i 3 poziomy wizualnego uszkodzenia; zachować prostą czytelną sylwetkę w małej skali;
- każda planeta dostaje spójną paletę regionu, atmosferę i detal poruszający się wolniej niż gameplay; żadnych losowych kolorów per obiekt;
- stacje i ładunki dostają ikony/sylwetki Canvas lub SVG w repozytorium; nie używać emoji jako final artu;
- efekty: kierunkowe iskry według wektora uderzenia, squash/pulse portu przy doku, krótki whoosh slingshota, smugi prędkości tylko powyżej progu; limity cząstek i redukcja ruchu;
- dynamiczny miks audio: silnik zależny od ciągu, ton pola od siły dominującej grawitacji, osobne krótkie motywy stacji, ducking ważnego komunikatu; kontrolki master/effects/UI;
- humor w krótkich zdarzeniach sterownika lotu i skutkach ładunku; maksymalnie jeden komunikat naraz, kolejka z priorytetem, zero dowcipów zasłaniających akcję;
- ujednolicić polski język menu i mikrocopy; angielskie nazwy techniczne tylko tam, gdzie są świadomym elementem świata.

#### 2.4. Telemetria lokalna i strojenie

- raport JSON zgodny z sekcją telemetrii poniżej, z wersją schematu i przyciskiem eksportu; żadnej transmisji bez zgody;
- narzędzie developerskie do odtwarzania input trace/seed oraz nakładka: FPS, tick, dominujące ciało, przyspieszenie, prędkość względna, aktualna reguła ładunku;
- przygotować trzy ręczne seedy: onboarding, standard, trudny; każdy ma jawnie opisane oczekiwane punkty decyzji;
- wykonać serię krótkich playtestów, zapisać wyniki w `docs/playtests/` (zanonimizowane podsumowanie, nie surowe dane osobowe) i stroić parametry na podstawie median, nie pojedynczej opinii;
- sprawdzić wydajność przy maks. 24 asteroidach na średnim telefonie/emulowanym CPU; ograniczać efekty, nie stały krok symulacji.

#### 2.5. Brama jakości Etapu 2

- jedna pełna runda trwa medianowo 8–12 minut, a pierwsza nagroda/dok pojawia się przed 60–90 s;
- w minimum 15 testowych rundach 60–80% kończy się sukcesem, <20% maksymalnym wynikiem, a większość porażek ma poprawnie wskazaną przyczynę;
- gracze potrafią po rundzie wskazać bezpieczną trasę, ryzykowny skrót i działanie swojego ładunku;
- trzy kontrakty są mechanicznie odczuwalne, lecz żaden nie odbiera kontroli ani nie tworzy nieuniknionych obrażeń;
- stabilne 60 FPS na desktop i akceptowalne stabilne 30/60 FPS na profilu mobilnym; brak narastania listenerów, cząstek i timerów po pięciu retry;
- porównawcze screenshoty wszystkich kluczowych stanów przechodzą checklistę kontrastu, hierarchii, semantyki kolorów i reduced motion;
- automatyczne testy obejmują każdą regułę ładunku, decyzję stacji, scoring, pył, limit fragmentów, zapis ustawień i eksport telemetrii.

**Nie robić w Etapie 2:** trzech statków, sześciu pełnych misji, czarnej dziury, online leaderboardu ani WebRTC.

---

### ETAP 3 — Powód do powrotu i finalny polish: „gra, nie prototyp”

**Warunek wejścia:** pełna runda z Etapu 2 jest angażująca bez obietnicy przyszłej zawartości. Jeśli gracze nie naciskają retry, najpierw poprawić decyzje, feedback i tempo.

**Cel sesji:** zbudować małą, spójną kampanię pierwszej godziny, trwałą progresję poziomą, Ghost Race/daily seed offline oraz finałowy set piece; doprowadzić całość do jakości wydania webowego.

#### 3.1. Kampania i progresja bez grindu

- sześć misji z sekcji „Pierwsza godzina”, każda z unikalną lekcją i jednym nowym problemem; ponowne wykorzystanie regionów jest dozwolone, kopiowanie identycznej trasy nie;
- mapa wyboru misji pokazuje ukończenie, medal, najlepszy czas, najlepszy slingshot i tryb Assist; następna misja odblokowuje się za ukończenie, nie za grind;
- trzy statki jako sidegrade: lekki, holownik, budżetowy. Wspólne zasady fizyki, jawne różnice na maks. 3 osiach i osobne ghost/rekordy;
- kosmetyczne nagrody: 3–6 smug, naklejki/kolory i wariant głosu; zapis wersjonowany, migracja z wcześniejszego localStorage, przycisk reset/eksport/import;
- onboarding kontekstowy zamiast ściany tekstu; gracz doświadczony może go pominąć, a sterowanie zawsze dostępne z pauzy.

#### 3.2. Ghost Race, daily seed i replayability

- lokalny ghost jako pełnoprawny rywal: interpolowany, półprzezroczysty, ni koliduje, nie zasłania trajektorii; różnica czasu na stacjach;
- deterministyczny daily seed wyliczany lokalnie z daty UTC i wersji generatora; bez udawania globalnego rankingu lub serwera;
- osobne rekordy dla Assist On/Off, kontraktu, statku i wersji fizyki; zmiana balansu nie może porównywać niezgodnych czasów;
- retry w jednym kliknięciu zachowuje seed/kontrakt; „nowa trasa” jest osobną świadomą akcją;
- replay/input trace służy również jako test deterministyczności całej kampanii. Dodać fixture przynajmniej jednej ukończonej misji.

#### 3.3. Finałowa czarna dziura jako set piece

- występuje tylko w finale/specjalnym kontrakcie po poznaniu grawitacji planet;
- warstwy: ograniczony, jawny gameplayowy zasięg; dysk akrecyjny; soczewkowanie wyłącznie warstwy gwiazd; ostrzeżenie przeciążenia zależne od ładunku;
- daje największy legalny skrót i mnożnik, ale zawsze istnieje dłuższa droga; predykcja jasno pokazuje przechwycenie/kolizję;
- przekroczenie horyzontu uruchamia zaprojektowaną konsekwencję i checkpoint/karę czasu, nie tani losowy game over;
- efekt musi mieć ścieżkę reduced-motion, limit kosztu renderowania i testy numeryczne braku osobliwości/`NaN`.

#### 3.4. Finalna jakość produktu

- spójny art pass menu, kart, HUD, świata, summary i kampanii; usunąć placeholdery, emoji-wrogów i martwe elementy starego HUD z domyślnego trybu;
- responsywność: 320 px szerokości, typowy telefon portrait/landscape, tablet, 1366×768 i 1920×1080; safe areas i czytelny dotyk ≥44 px;
- dostępność: focus order, obsługa klawiatury, etykiety kontrolek, niepoleganie tylko na kolorze, `prefers-reduced-motion`, regulacja błysków/drgań/audio;
- offline-resilience: lokalne font fallbacki, łagodne zachowanie przy niedostępnych CDN-ach easter eggów, brak blokowania głównej gry przez sieć;
- profiling pamięci/CPU, test pięciu pełnych rund z retry, test background/resume, resize, utraty focusu i czyszczenia AudioContext/listenerów;
- zaktualizować README do faktycznie wydanej funkcjonalności, sterowania, uruchomienia i ograniczeń. Nie reklamować online multiplayera;
- Easter Eggi zachować dostępne z Credits, ale nie ładować ciężkich bibliotek przed wejściem do nich, jeśli można je załadować leniwie.

#### 3.5. Brama wydania Etapu 3

- wszystkie sześć misji można ukończyć na desktopie i dotyku, zapis i migracja działają, a brak localStorage nie blokuje gry;
- deterministyczne replaye przechodzą po czystym uruchomieniu; daily seed jest identyczny w dwóch przeglądarkach tej samej wersji;
- co najmniej 30% testerów rozpoczyna retry w 30 s od summary, a mediana sesji obejmuje minimum dwie rundy;
- zero błędów konsoli w pełnym flow; automatyczne testy i smoke/E2E przechodzą; brak poważnych regresji dostępności;
- finalny zestaw screenshotów desktop/mobile pokazuje każdą misję, trzy statki, kontrakty, pył, slingshot, obrażenia, summary, kampanię i czarną dziurę;
- lista świadomie odłożonych tematów powstaje w osobnym backlogu. Real-time multiplayer staje się dopiero kandydatem na **Etap 4**, zgodnie z `MULTIPLAYER.md`.

## Definicja „ładna i angażująca” — checklista recenzji

Przed końcem każdej sesji odpowiedzieć `tak/nie` z dowodem:

- czy w nieruchomym screenie wiadomo, gdzie lecieć, co jest niebezpieczne i jaki jest stan ładunku;
- czy sylwetki statku, stacji, planety, asteroidy, pyłu i zagrożenia są rozpoznawalne bez etykiet;
- czy najjaśniejszy/najbardziej nasycony element jest aktualnie najważniejszy, a tło nie konkuruje z celem;
- czy prędkość jest odczuwalna przez spaliny, pył, audio i look-ahead, ale nieruchomy statek nie generuje fałszywego ruchu;
- czy każde obrażenie ma widoczną przyczynę, kierunek, konsekwencję i krótkie okno ochronne;
- czy gracz co 20–30 s podejmuje decyzję, a nie tylko trzyma ciąg;
- czy porażka sugeruje możliwą poprawę, a summary prowokuje do retry;
- czy efekt jest nadal czytelny bez dźwięku, bez rozróżniania czerwieni/zieleni i przy reduced motion;
- czy mobile oferuje te same decyzje, a nie tylko okrojoną wersję sterowania;
- czy nowa zawartość wzmacnia cel dostawy — jeśli nie, usunąć ją mimo kosztu implementacji.

## Stan realizacji — 2026-07-30

**Etap 2 zaimplementowany technicznie; bramy produktowe Etapów 1 i 2 pozostają warunkowe.** Etap 1 ponownie zweryfikowano i dodano dowód przejścia pełnej trasy samym inputem, bez teleportowania stanu. Nadal nie istnieje 10 niezależnych playtestów Etapu 1. `round-01` rozwija grę do czterech dostaw, dokładnie trzech kontraktów, dwóch planet, pyłu, trzech typów stacji i wyniku czas–integralność–styl–premia; zawiera lokalną telemetrię, narzędzia debug/replay, audio, dotyk i reduced motion. Automaty oraz własny test nie zastępują kryteriów 15 rund i fizycznego telefonu, dlatego Etapu 3 nie wolno rozpoczynać. Dowody i pełna lista oczekujących danych znajdują się w `docs/playtests/stage-1-report.md` oraz `docs/playtests/stage-2-report.md`.

## Prompty startowe dla kolejnych sesji

Każdy prompt zakłada pracę na bieżącej gałęzi po poprzedniej sesji. Wklej dokładnie prompt właściwego etapu; Codex ma sam przeczytać pełny plan, sprawdzić stan repozytorium i nie ufać bez weryfikacji deklaracjom poprzednika.

### Prompt — sesja 1/3

> Kontynuuj realizację `docs/GAME_VISION.md`. Wykonaj w całości **ETAP 1 — Bezpieczny pionowy wycinek: „lot ma sens”**, łącznie z podzadaniami 1.1–1.5 i bramą jakości. Najpierw przeprowadź ponowny audyt aktualnego drzewa, historii i testów; zachowaj dobre elementy wskazane w planie, nie wykonuj skompresowanego rewrite'u ani nie usuwaj Easter Eggów. Pracuj długo i autonomicznie: rozdziel deterministyczną symulację, misje, renderer, input i UI, buduj małymi sprawdzalnymi krokami, uruchamiaj testy oraz realne smoke testy desktop/mobile. Zrób screenshoty wszystkich wymaganych stanów. Jeśli czegoś z bramy nie da się uczciwie potwierdzić bez zewnętrznych testerów, wykonaj maksymalny test własny, zapisz dokładny protokół i oznacz brak zamiast udawać wynik. Na końcu zaktualizuj dokumentację stanem wykonania, podaj dowody testów i pozostaw grywalny, spójny commit oraz PR.

### Prompt — sesja 2/3

> Kontynuuj realizację `docs/GAME_VISION.md`. Zweryfikuj artefakty i **bramę jakości Etapu 1** na aktualnym kodzie; najpierw napraw wszystkie realne braki fundamentu, a następnie wykonaj w całości **ETAP 2 — Pełna angażująca runda: „cel–ryzyko–nagroda”**, podzadania 2.1–2.5. Nie dodawaj zakresu Etapu 3 ani multiplayera. Zachowaj czytelne elementy oprawy z Etapu 1, ale bez litości popraw placeholdery i chaos. Pracuj autonomicznie i metodycznie, testuj każdą regułę ładunku i mechanikę ryzyka, profiluj desktop/mobile, twórz screenshoty porównawcze i lokalne raporty playtestowe. Nie deklaruj metryk od ludzi, których nie było; rozdziel wyniki automatyczne, własny playtest i kryteria oczekujące na testerów. Na końcu zaktualizuj plan stanem i decyzjami, pozostaw pełną 8–12-minutową rundę w działającym commicie oraz utwórz PR.

### Prompt — sesja 3/3

> Kontynuuj realizację `docs/GAME_VISION.md`. Najpierw zweryfikuj **bramę jakości Etapu 2** i napraw fundamenty zamiast obchodzić kryteria. Następnie wykonaj w całości **ETAP 3 — Powód do powrotu i finalny polish: „gra, nie prototyp”**, podzadania 3.1–3.5: sześć misji pierwszej godziny, trzy statki-sidegrade, progresję i zapis, pełny lokalny Ghost Race/daily seed, finałową czarną dziurę oraz finalny art/audio/accessibility/performance pass. Nie implementuj real-time multiplayera. Pracuj długo, autonomicznie i etapowo; chroń deterministyczność, mobile, reduced motion, Easter Eggi i istniejące dobre elementy. Uruchom pełny zestaw testów, replaye, wielokrotne retry/profiling oraz smoke/E2E w wymaganych viewportach i wykonaj finalny komplet screenshotów. Uczciwie oddziel potwierdzone wyniki od metryk wymagających zewnętrznych testerów. Zaktualizuj README i dokumentację do faktycznego stanu, zapisz backlog po wydaniu, pozostaw release-ready commit i utwórz PR.

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
