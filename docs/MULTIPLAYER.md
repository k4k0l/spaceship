# Multiplayer: stan i plan migracji

## Stan obecny

Kod zawiera prototyp WebRTC DataChannel, ale nie należy traktować go jako działającego multiplayera. Publiczny Google Apps Script zapisujący offer/answer zwraca obecnie `403 Access Denied`. Sam kanał synchronizuje głównie pozycję drugiego statku; nie synchronizuje kompletnej, autorytatywnej rozgrywki (pocisków, trafień, wyników i efektów gracza). Konfiguracja ma tylko publiczny STUN i nie ma TURN, więc część par za CGNAT/firewallem nie połączy się nawet po naprawieniu sygnalizacji.

Przyciski Host/Join pozostają wyłącznie oznaczeniem eksperymentalnego prototypu. Nie publikujemy obietnicy, że ta funkcja działa.

## Rekomendowany darmowy MVP Cloudflare

1. Worker tworzy kryptograficznie losowy identyfikator pokoju i osobne sekrety host/join.
2. SQLite Durable Object utrzymuje maksymalnie dwa WebSockety tylko na czas wymiany offer, answer i trickle ICE. Pokój ma krótki TTL, limit rozmiaru wiadomości, limit tempa oraz kontrolę `Origin`.
3. Po zestawieniu WebRTC sygnalizacja jest zamykana. Dane gry płyną P2P.
4. Backend generuje krótkotrwałe dane Cloudflare Realtime TURN; klucz API nigdy nie trafia do przeglądarki.
5. Host wykonuje autorytatywną symulację. Klient wysyła wersjonowane inputy 20–30 Hz, host snapshoty 10–20 Hz. Snapshot ma tick/sequence, walidowany rozmiar i schemat; klient interpoluje z buforem około 100 ms.
6. Osobne kanały: reliable/ordered dla zdarzeń krytycznych i unordered z ograniczoną retransmisją dla inputów/snapshotów. Stare snapshoty są porzucane przy `bufferedAmount`.

Cloudflare udostępnia Workers i SQLite Durable Objects w planie Free, a WebSocket Hibernation ogranicza koszt bezczynnych pokoi. Realtime TURN ma wspólny darmowy próg, ale jest usługą rozliczaną po jego przekroczeniu — trzeba ustawić alerty i nie obiecywać „zawsze bez kosztu”. Aktualne limity należy sprawdzić przed wdrożeniem.

Źródła pierwotne:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Durable Objects WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Workers WebSockets API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
- [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/)
- [Realtime pricing](https://developers.cloudflare.com/realtime/sfu/pricing/)
- [Generating TURN credentials](https://developers.cloudflare.com/realtime/turn/generate-credentials/)

## Kryteria odbioru następnego etapu

- dwa konteksty przeglądarki widzą te same pociski, trafienia, pickupy, timer i wynik;
- 30 minut rozgrywki bez trwałego desynchronizowania świata;
- test wymuszający `iceTransportPolicy: "relay"` przechodzi przez TURN;
- jawne stany łączenia, timeout, błąd, rozłączenie i ponowne połączenie;
- testy dwóch realnych sieci (Wi‑Fi ↔ LTE/CGNAT) w Chrome, Firefox i Safari;
- brak sekretów usług w kodzie klienta, pokoje wygasają, wiadomości są walidowane i limitowane.

## Framework

Canvas 2D jest wystarczający dla tej skali. Phaser może uporządkować sceny i assety, a Matter/Planck zapewnić rigid bodies, ale żadna z tych migracji sama nie naprawi toroidalnej fizyki ani netcode. Najpierw należy wydzielić deterministyczną symulację, input, renderer i wersjonowany protokół; dopiero potem ocenić koszt frameworka.
