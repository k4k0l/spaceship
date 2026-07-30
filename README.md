# Orbitalna Przesyłka

**Wersja 0.6.0** to jednoosobowa zręcznościowa gra kurierska wykorzystująca czytelne asysty grawitacyjne. Wybierz nietypowy ładunek, odwiedź stacje w kolejności, wykonaj slingshot i pobij lokalny rekord.

## Uruchomienie

Gra nie wymaga budowania ani zależności. Uruchom lokalny serwer i otwórz stronę:

```bash
python3 -m http.server 8000
```

## Pętla gry 0.6

- sześć ręcznie przygotowanych misji o rosnącej trudności oraz trzy ładunki z odmiennymi modyfikatorami: delikatna galaretka, ingerująca w sterowanie gęś i przyciągająca gruz osobliwość;
- deterministyczna trasa przez cztery stacje, dwie planety, pas asteroid i chmurę pyłu;
- dominujące, zmiękczone pole grawitacyjne, widoczne pierścienie wpływu i predykcja trajektorii na 2,5 sekundy;
- Flight Assist Lite, miękki limit prędkości, dokowanie przez dopasowanie prędkości;
- kadłub, integralność ładunku, obrażenia zależne od prędkości, mnożnik stylu i podsumowanie;
- lokalny rekord i wizualny ślad najlepszego poprzedniego lotu;
- responsywny HUD, pełne sterowanie dotykowe, minimapa trasy, pauza, mute i ograniczenie ruchu zgodne z ustawieniami systemu.

## Sterowanie

| Klawisz | Akcja |
|---|---|
| W / ↑ | ciąg do przodu |
| S / ↓ | ciąg wsteczny / hamowanie |
| A/D / ←/→ | obrót |
| Q / E | strafe |
| F | Flight Assist Lite on/off |
| H | klakson w próżni |
| Esc | pauza |

Na telefonie i tablecie te same funkcje udostępniają dwa zestawy przycisków dotykowych u dołu ekranu.

## Zakres

Wersja 0.5 celowo usuwa z głównej pętli losowe pickupy, ciągłą walkę, wzajemną grawitację asteroid i niedziałający prototyp sieciowy. Real-time multiplayer pozostaje kolejnym etapem po zweryfikowaniu lokalnego Ghost Race; szczegóły są w `docs/MULTIPLAYER.md`.

Testy czystych kontraktów fizyki uruchamia `node --test`.
