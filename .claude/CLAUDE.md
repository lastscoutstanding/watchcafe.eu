# watchcafe.eu

Website en toolset voor de Sioux Watch Café, een maandelijkse horloge-meetup bij Sioux.
Repo: github.com/lastscoutstanding/watchcafe.eu, gehost op GitHub Pages (watchcafe.eu).
Stand: 1 oktober 2026, overgenomen uit de claude.ai-chat "Watch Rate Meter".

## Werkwijze in Claude Code

- Werk direct in deze lokale repo. Begin een taak met `git pull`, zodat je op de live stand zit.
- Eén logische wijziging = één commit met een duidelijke message. Laat zien wat er verandert.
- Push pas na akkoord van Bas: de site staat live. Na de push deployt GitHub Pages zelf; Bas ververst met Cmd+Shift+R.
- Testen vóór commit:
  - Start een lokale server (`python3 -m http.server 8000`). Absolute paden zoals `/theme.css` en `/nav.js` werken niet via `file://`.
  - jsdom voor runtime-fouten en rekenlogica, Playwright voor screenshots per pagina/thema. Installeer ze als ze ontbreken.
- Werk dit bestand bij na elke grotere wijziging, vooral de secties per onderdeel en "Open punten".

## Architectuur

Dependency-free vanilla HTML/CSS/JS. Geen backend, cookies of analytics; alle data in localStorage van de bezoeker. UI standaard Engels met NL-toggle.

| Pad | Rol |
| --- | --- |
| `index.html` | Homepage "Watch Tools": hub met live klok en wereldklok-strip |
| `clock/index.html` | Alleen doorverwijzing naar `/` (oude bladwijzers); de klok staat op de homepage |
| `collection/index.html` | Collection: overzicht van alle horloges, aanmaken, gegevens, hernoemen, verwijderen |
| `collection/brands.html` | Merktekens: alle merken uit `brands.txt` (woordmerk + badge) en een tester; alleen via de verborgen Tools-sectie |
| `watchrate/index.html` | Watch Rate Meter |
| `watchrate/viewer.html` | Backup Viewer |
| `watchrate/report.html` | Printbaar rapport (PDF via printvenster) |
| `watchrate/sample.js` | Voorbeeldhorloges, gedeeld door Rate Meter en Viewer |
| `powerreserve/index.html` | Power Reserve |
| `moonphase/index.html` | Moon Phase (NL "Maanstand"): maanstand-complicatie gelijkzetten |
| `guide/index.html` + `glossary.txt` | Guide met twee tabs: handleiding per tool en woordenlijst EN/NL (`#glossary`; `#glossary/<term>` vult de zoekbalk, zoals de link "How the rate is calculated" in de Rate Meter-uitleg naar `#glossary/regression`). Losse termen in de handleiding (offset, kaliber, positie, "één lijn", amplitude, slagfout, "volledig opgewonden", servicebeurt) linken als `a.gl` (gestippelde onderstreping) naar een zoekterm die een klein cluster begrippen toont; de zoekopdracht doorzoekt namen en definities in beide talen, dus geen te algemene woorden als "rate" |
| `glossary/index.html` | Alleen doorverwijzing naar `/guide/#glossary` (oude bladwijzers) |
| `flyer/index.html` + `watchcafe-flyer.pdf` | A4-flyer (Engels, `noindex`, niet in het menu): tools voorop, QR naar watchcafe.eu, Sioux Watch Café alleen in de voetregel. Licht papier met donker kopblok in Watch Café-oranje; PDF gemaakt met headless Chromium (`page.pdf`, `printBackground`) |
| `privacy/index.html` | Privacy, inspecteert live cookies/localStorage |
| `cafe/index.html` + `meetings.txt`, `meetings.js`, `events.txt`, `events.js`, `cafe-log.txt` | Café-pagina |
| `nav.js` | Gedeelde menubalk, taal-toggle, thema-keuze, verborgen Tools-sectie |
| `watchdata.js` | Gedeeld: apparaatnaam, back-upnaam, verwijder-tombstones, samenvoegen, `currentRate(w)`, `wearOrder` (keuzelijsten), gangberekening `rateOf`/`pieces`/`fitPieces` (Rate Meter, Power Reserve, Collection, rapport, Viewer) |
| `brands.js` + `brands.txt` | Merk-woordmerken (Collection-kaarten), plus een wijzerplaat-badge voor later |
| `standards.js` + `standards.txt` | Nauwkeurigheidsnormen (COSC, METAS …) voor "How it compares" in de Rate Meter en het veld "Accuracy spec" in de Collection |
| `theme.css` | Alle thema-overrides |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Favicon: koffiemok met wijzers op 10:10 in Kermit-kleuren (groen, goud asje). `favicon-32.png` is 64 px met transparante hoeken, `apple-touch-icon.png` 360 px zonder afgeronde hoeken (iOS rondt zelf af). PNG's gerenderd met headless Chromium |

localStorage-keys (gedeeld over de hele site, altijd uitlezen, nooit hardcoden):
- `siouxWatchRateMeter`: alle horlogedata (metingen, timegrapher, gangreserve, gegevens, logboek, draagdagen).
- `siouxWatchRateMeterLang`: taal (EN standaard, NL).
- `siouxWatchTheme`: gekozen thema.
- `siouxWatchDevice`: apparaatnaam voor back-ups; alleen gezet als de gebruiker hem wijzigt, anders afgeleid uit de browser (iPhone, iPad, Mac, Windows, Android …).
- `siouxWatchLastBackup`: `{ at, file }` van de laatste back-up op dit apparaat, voor de back-upstatus en -herinnering.
- `siouxWatchReportPick`: welke horloges in het rapport aan/uit staan (alleen expliciete keuzes, alleen Rate Meter-bron).
- `siouxWatchCollectionSort`: gekozen sortering van de Collection-kaarten (standaard `smart`).
- `siouxWatchStdOpen`: `"1"` als "How it compares" in de Rate Meter openstaat (per apparaat; standaard dicht).
- `siouxWatchMoonType`: `"prec"` als in Moon Phase het type Precision is gekozen (per apparaat; standaard Standard).
- `siouxWatchWearClosed`: dag (00:00 UTC, ms) waarop het blok "Wearing today" met de hand is gesloten; alleen die dag geldig.

Backup-JSON = de volledige opgeslagen data plus stempel (`WatchData.backupData`): `{ version, activeWatch, watches: [...], deleted?, restored?, exportedFrom? }`.
- Horloge: `{ id, name, measurements, timegrapher?, powerReserve?, prCurrent?, rateEnd?, info?, edited?, log?, worn?, sample? }`.
- `sample: true`: voorbeeldhorloge (zie Voorbeeldhorloges).
- `rateEnd`: `{ at, edited }` van "End session" in de Rate Meter; `at` = null na Undo. Samenvoegen: hoogste `edited` wint.
- Meting: `{ id, t, offset, position, note, newStart?, restart? }` met `t` in epoch-ms en `offset` in seconden. `restart` = Doorstart (zie Watch Rate Meter).
- `info`: gegevens uit de Collection (`brand, model, ref, caliber, spec, year, serial, caseSize, lugWidth, boxPapers, serviceYears`, alle vrije tekst, alleen ingevulde velden); `edited` = tijdstip van de laatste wijziging van naam of gegevens.
- `log`: `[{ id, t, type, where?, cost?, note?, edited? }]`; `worn`: `[{ id, t }]`; bij beide is `t` de dag om 00:00 UTC.
- Prijzen en serienummers staan dus altijd in de back-up, ook als het rapport ze weglaat. De Backup Viewer toont alleen de meetgegevens; gegevens, logboek en draagdagen alleen via het rapport.

## Back-ups tussen apparaten

- Bestandsnaam `watchrate-<apparaat>-JJJJ-MM-DD-UUMM.json`, plus `exportedFrom: { device, at }` in de JSON (overleeft hernoemen). Apparaatnaam aanpasbaar naast de back-upknop; de Viewer toont apparaat en tijd op de bestandschip.
- Herstellen opent een paneel met per horloge wat de back-up toevoegt/verwijdert. Standaard Samenvoegen; "Alles vervangen" is secundair (gestippeld, met bevestiging).
- Samenvoegen op id. Toevoegen en verwijderen tellen. Bewerken kan alleen voor naam en gegevens (`w.info`, in de Collection); `w.edited` is het tijdstip daarvan en de laatste wijziging wint. Zonder `edited` aan beide kanten blijft de lokale naam. Het herstelpaneel toont dan "details updated".
- Verwijderingen: `state.deleted = { id: ms }`. Elke verwijderknop (horloge, meting, timegrapher-sessie, gangreserve-historie, voorbeelden wissen) moet `WatchData.markDeleted`/`markWatchDeleted` aanroepen, anders komt het item terug bij samenvoegen. Lopende gangreservemeting zonder id: `"pr:<start>"` bij opslaan of verwerpen.
- Selectief importeren: elk horloge in het herstelpaneel heeft een vinkje. Nieuwe horloges staan standaard aan, behalve voorbeeldhorloges als er al eigen horloges zijn. Bestaande horloges (ook "deleted on the other device") staan vast aan en grijs: een half samengevoegd horloge lost niets op, en een tombstone haalt hem bij de volgende import toch weg. "Only on this device" heeft geen vinkje. Uitgevinkte horloges worden vóór `WatchData.merge` uit de back-up gefilterd, zonder tombstone: ze komen bij een volgende import weer als nieuw (bewust: "nu niet" is niet "weg"). De hoofdknop telt mee ("Merge 1 of 2 new and restore 1"); "Replace everything" staat uit zolang er iets is uitgevinkt, met uitleg in de hint. `merge` geeft per rij ook het `id` mee.
- Terugzetten: het herstelpaneel toont onder een stippellijn "Deleted on this device · in the backup" met per horloge (alleen hele horloges, bewust geen losse metingen) datum van verwijderen, aantal items en een vinkje, standaard uit (→ "will be restored"; hoofdknop wordt "Merge and restore N"). Pas bij die knop zet `WatchData.markRestored` `state.restored = { id: ms }` en wordt opnieuw samengevoegd. Een id telt als verwijderd zolang `deleted[id] > restored[id]` (`WatchData.deletedAt`); beide lijsten worden bij samenvoegen gecombineerd (hoogste tijd). Zo neemt een ander apparaat met een oude tombstone het teruggezette horloge over, en wint een latere verwijdering toch. Items die na de back-up zijn toegevoegd komen niet terug.
- Verwijderen in de Collection zegt na "Click again…" of een back-up het horloge kan terughalen: geen back-up of de laatste is ouder dan het horloge (`idTime` van het id) → "isn't in any backup yet" plus gestippelde knop "Back up first" (maakt de back-up en annuleert het verwijderen); anders "from your last backup (…)", met het aantal items van daarna als die er zijn. Dit gaat over de laatste back-up op dít apparaat; dat het bestand nog bestaat, kan de pagina niet weten.
- Items zonder id (oude voorbeelddata) krijgen een id uit hun inhoud (`ensureIds`), zodat ze op elk apparaat gelijk zijn.
- Delen-knop via Web Share API, alleen zichtbaar als de browser bestanden kan delen; bij een fout (geen annulering) valt hij terug op downloaden.
- Blok "Your data" onderaan het Collection-overzicht (verhuisd uit de Rate Meter, want een back-up bevat nu ook gegevens, logboek en draagdagen, en de Collection wordt het vaakst geopend): statusregel met stip, "Back up now" (getint) + Share + apparaatnaam; onder een stippellijn twee tegels met grijze knop en toelichting (Report, Browse backups); daaronder klein en gestippeld "Restore from backup…". De Rate Meter houdt alleen de statusregel met een link "Backup & restore in your Collection →" naar `/collection/?backup` (scrollt naar het blok).
- Back-upstatus (`WatchData.backupStatus`): grijs zonder eigen metingen (alleen voorbeelden of leeg), groen na een back-up, oranje als er iets nieuw is en er nooit een back-up was, de laatste ≥ 14 dagen oud is of ≥ 10 nieuwe items wachten. "Nieuw" = items (metingen, timegrapher-sessies, gangreservemetingen, logboekregels, draagdagen) met een `uid()`-id jonger dan de laatste back-up (de aanmaaktijd zit in de eerste 8 tekens van het id; voorbeelddata heeft id's uit de inhoud en telt niet).
- Een download valt niet te bevestigen: de klik telt als back-up, bij Delen alleen een geslaagde share.
- Herinnering (`bkNudge`) direct na "Record measurement", na opslaan in Power Reserve en na een tik bij "Wearing today" (in dat blok, of onder de titelregel als het blok is ingeklapt; × verbergt hem tot de volgende paginalading), alleen bij oranje, met "Back up now" en ×. Geen pop-up. Teksten spreken van "items", niet van metingen.
- `watchdata.js` staat met `?v=N` (nu 12) in Collection, Rate Meter, Power Reserve, Viewer en rapport; ophogen bij wijzigingen.

## Homepage en Live Clock

- Site is tool-gericht; café-inhoud staat onder `/cafe/`.
- Merknaam buiten de café-pagina is `watchcafe.eu` (menubalk, paginatitels, footers, rapport); tool-ondertitels zonder achtervoegsel. "Sioux" alleen op `/cafe/` en in de regel onder de homepage-tegels, met uitleg ("a monthly meetup of watch fans at Dutch tech company Sioux"): buiten Sioux zegt de naam niemand iets en het is ook de naam van inheemse Amerikaanse volken.
- Menuvolgorde: Home, Collection, Rate Meter, Power Reserve, Moon Phase, Guide, Watch Café (café bewust achteraan). Glossary is een tab van de Guide, om het menu kort te houden.
- Verborgen sectie "Tools" onderaan het tandwielmenu (`TOOLS` in `nav.js`, één regel per tool, alleen Engels): verschijnt alleen bij rechtsklik/ctrl-klik op het tandwiel (`contextmenu`, ook lang drukken op Android) of lang drukken (500 ms, eigen touch-timer, want iOS kent geen `contextmenu`). Een gewone klik opent het menu zonder Tools; niets in localStorage. Nu "Brand marks" en "Add samples". Easter egg voor hulppagina's die niet in de menubalk horen.
- Homepage-tegels: Collection, Rate Meter, Power Reserve, Guide.
- Eén kolom op de breedte van de menubalk (980 px): klokpaneel vult de breedte, wereldklok op één rij van negen (3×3 onder 940 px), vier tegels naast elkaar (2×2 onder 860 px, onder elkaar onder 520 px).
- Tegeliconen zijn inline SVG-lijniconen in `currentColor` (accentkleur), geen emoji.
- Kopstijl overal gelijk: titel links, 30 px/800 in accentkleur, subtitel 14 px, 4 px ertussen. Andere pagina's zetten die bovenin hun kaart; de homepage op de linkerrand van de kolom.
- Alle pagina's gebruiken dezelfde kolom als de menubalk: 948 px inhoud (980 px min 16 px padding), linkerrand gelijk met het logo.
- Lopende tekst blijft leesbaar smal binnen die kolom: Guide (zijbalk 190 px met meelopende inhoudsopgave + tekst 680 px), Privacy (tekst 720 px, slotsecties in twee kolommen), Glossary-tab (begrippen in twee alfabetische kolommen), Café (welkom/onderwerpen naast een kolom van 320 px met de volgende datum, verslagen als raster van twee kaarten). Onder ~720–760 px valt alles terug op één kolom.
- Sectie-iconen (homepage-tegels, Guide) zijn SVG-lijniconen in `currentColor`, geen emoji.
- Taalkeuze alleen via de menubalk; pagina's luisteren naar het `swclang`-event.
- LED-klok: geen achtergrondvlakje per cijfer; onverlichte segmenten blijven zwak zichtbaar (`opacity:.28`).
- Wereldklok: San Francisco, New York, London, Cluj, Pune, Da Nang, Suzhou, Singapore, Sydney, met UTC-offset op halfuur-precisie.
- Live Clock staat op de homepage: zeven-segment LED, schaalt mee. Het paneel is geen link meer.
- De homepage toont de echte tijd: de apparaatklok gecorrigeerd met de `Date`-header van watchcafe.eu zelf (`syncClock()`, HEAD op `/favicon.svg`). Verzoeken worden rond een secondegrens getimed tot de afwijking op ~25 ms bekend is; bij laden en elk uur. Geen melding of icoon; lukt het niet (offline), dan blijft het de apparaattijd. Lokaal is de correctie altijd ~0, want dan is de server de eigen Mac. Klok, wereldklok en tik lopen op deze tijd en verspringen net na elke echte secondegrens.
- Rate Meter en Power Reserve rekenen bewust op de apparaatklok: een vaste afwijking valt weg in de gang, en de klok daar corrigeren zou lopende metingen laten verspringen.
- Naast de datum twee knoppen in datumvak-stijl en accentkleur: links de 10-secondentik (bij elke paginalading uit, want browsers staan geluid pas na een klik toe; daarom niet in localStorage), rechts schermvullend via de Fullscreen-API (verborgen waar dat niet kan, zoals op iPhone).
- De Amsterdam-regel van de oude klokpagina is bewust niet meegenomen.

## Café-pagina

- Rechterkolom: blok "Next Café" met daaronder "Other watch events". Evenementen staan bewust alleen hier (Benelux-publiek), niet op de tool-gerichte homepage.
- Next Café (`meetings.js`): datumtegel (maand/dag/weekdag), volledige datum + tijd (dubbele datum is bewust), "Sioux Labs · during the Vrijmibo", pil "26 days to go", daaronder de vaste regel "every last Friday". Tijden in Europe/Amsterdam.
- Optioneel thema per meeting in `meetings.txt`: `YYYY-MM-DD HH:MM | EN | NL`. Met `;` wordt het een lijst ("On the table" / "Op tafel"), anders label "Theme". NL valt terug op EN. Zonder thema geen themavlak.
- Other watch events (`events.js`): `events.txt` met `datum[..einddatum] | naam | plaats | link`. Voorbije evenementen verdwijnen; vier zichtbaar, rest achter gestippelde "Show N more"; jaartal-scheiding vanaf een volgend jaar; "today/tomorrow/in N days" binnen twee weken. Sectie verborgen als er niets komt.
- Scripts staan met `?v=N` in de pagina; ophogen bij een wijziging zodat bezoekers geen oude versie uit de cache halen.

## Collection

- Eerste menu-item. Overzicht: een kaart per horloge (naam, merk/model/referentie, gang van de laatste sessie, gemiddelde gangreserve) plus kaart "+ Add watch" (naam verplicht, merk en model optioneel). Leeg: uitleg, "Add watch" en "Show sample watches".
- `/collection/#<id>` toont één horloge met tabs Overview (tegels gang, gangreserve, timegrapher; de hele tegel is een link, met "Open in … →" als gedimde hint die bij hover de accentkleur krijgt; de klik zet `activeWatch`) en Details (merk, model, referentie, kaliber, nauwkeurigheidsnorm, jaar, serienummer, kastmaat, bandaanzet, doos & papieren in `w.info`; serienummer gemaskeerd tot je erop klikt). Bewerken incl. hernoemen zet `w.edited`. Verwijderen in twee stappen (5 s) met `markWatchDeleted`.
- Merknaam op de kaarten als woordmerk boven de horlogenaam (`brands.js`, lijst in `brands.txt`: `naam | aliassen | stijl | monogram`), in een typografische stijl per merk (roman, didone, grotesk, wide, italic, led) en in de accentkleur. Bewust géén nagetekende echte logo's (onnauwkeurig en merkrechtelijk beschermd). Merk uit `info.brand`, anders het merk waarmee de naam begint (langste match: "Grand Seiko" vóór "Seiko"); onbekend merk = grijs woordmerk; geen merk = lege regel, zodat de namen gelijk blijven staan. Met woordmerk toont de regel eronder alleen model · referentie. `brands.js` kan ook een wijzerplaat-badge met monogram tekenen (`Brands.badge`, 10:10-wijzers bij onbekend merk); die stond eerst op de kaarten, maar was te druk en zei met één letter weinig. Bewaard voor krappe plekken. "Ancre" staat bewust niet in de lijst: op oude Zwitserse horloges betekent het ankergang, geen merk.
- Stijl `led` (eigen "watchcafe"-stijl): 14-segment LED-tekens als SVG-lijnen in `brands.js`, recht, geen lettertypebestand. Gekozen boven 7 segmenten (schets): die kunnen geen M, W, K, V, X, en "Watch Café" werd "UUATCH". Uit-segmenten worden altijd getekend (`class="off"`) maar zijn verborgen; een container met `led-dim` toont ze zwak (.18), alleen waar de letters ≥ ~20 px zijn (kleiner worden ze een grijze waas). De badge doet dat zelf op grootte (monogram ≥ 20 px, dus 64 px wel, 40 px niet). Namen met tekens die de segmenten niet kennen (cyrillisch) vallen terug op grotesk; een monogram als Ω valt terug op tekst. Accenten vallen weg (É = E), "&" wordt een +, overige leestekens vervallen.
- `/collection/brands.html` (niet in de menubalk, `noindex`; ingang via de verborgen Tools-sectie in het tandwielmenu): alle merken uit `brands.txt` als badge + woordmerk met aliassen, stijl en monogram, te filteren op naam/alias en stijl, plus "Onbekend merk" als referentie. Erboven een tester: naam, aliassen, stijl, monogram (leeg = wijzers op 10:10), horlogenaam en model; toont badge in vier maten, een nagebootste Collection-kaart, een strook met het merk in alle zes stijlen naast elkaar (klik = die stijl kiezen) en de regel in `brands.txt`-formaat met Kopieer-knop. Een klik op een merk laadt het in de tester; een melding zegt of de regel nieuw is, gelijk aan of een wijziging van een bestaande regel, of dat naam/alias al op een ander merk past. Bij de Collection omdat de woordmerken daar horen; zo blijft de root schoon.
- Tab Logbook: `w.log = [{id, t, type, where?, cost?, note?, edited?}]`, `t` = de dag om 00:00 UTC (datum verschuift nooit met de tijdzone), kosten vrije tekst. Types: purchase, service, repair, strap, event, sold, note; labels van "where" en kosten verschillen per type. Klik op een regel = bewerken (zet `edited`) of verwijderen in twee stappen (`markDeleted`). `log` zit in `LISTS` van `watchdata.js`: samenvoegen op id, en bij hetzelfde id wint de hoogste `edited`.
- Type "Event" is bewust algemeen (geen "Watch Café"). Valt de datum op een café-datum (`meetings.txt`, titels in `cafe-log.txt`) of een evenement uit `events.txt`, dan verschijnt een suggestie-knop met die naam ("Watch Café, Sioux Labs" of "naam, plaats").
- Onderhoudsinterval (`info.serviceYears`) bij Details: volgende beurt = laatste service (anders aankoop) + interval; achterstallig geeft een oranje "service due" op de kaart. Aankoopdatum, -plaats en -prijs in Details komen uit het logboek.
- Gang op kaart en Overview: de laatste sessie. Heeft die nog maar één meting, dan de gang van de vorige sessie met een gang, gedimd en gemarkeerd ("+2.0 s/day · previous"; Overview: "Previous session, ended …"; `WatchData.previousRate`). Zonder eerdere gang "1 measurement", zonder metingen "no measurements yet".
- Actief: een kaart krijgt een accentrand en een getinte pil ("Rate · 5 d", "Reserve · 31 h"; beide de tijd sinds de start, onder 3 dagen in uren, daarna d/wk/mo). Dezelfde pillen staan rechtsboven in de tegels Rate en Power Reserve op de tab Overview, zolang er een gangreservemeting loopt (`prCurrent`) of de laatste rate-sessie niet is afgerond en niet stil is. Stil (`WatchData.rateSession`) = ≥ 3 metingen en langer geen meting dan 3× de mediane tussentijd van die sessie (minstens een dag): een automaat die je dagelijks meet is na ~3 dagen stil, een maandelijks gemeten quartz pas na ~3 maanden. Daarom geen vlag analoog/digitaal. Stil geeft alleen een gestippelde pil "Rate · last 9 d ago", geen accentrand en geen herinnering; de data verandert niet.
- Sorteren via een gestippelde pil naast het aantal (onzichtbare native select erover, dus op iPhone het wiel): Smart (standaard), Last worn, Most worn (12 mnd), Purchase date, Price, Brand, Name, Service due, Added (opgeslagen volgorde). Smart = actieve horloges eerst (meest recent gemeten of bevestigd bovenaan), scheidingslijn "Others", dan de rest op laatst gedragen. Andere sorteringen trekken actieve horloges niet naar boven. Prijs = eerste bedrag uit de vrije tekst van de laatste aankoop ("€ 3.200" = 3200, "12,50" = 12,5), zonder bedrag onderaan; valuta worden niet omgerekend. "Wearing today" blijft bovenaan, los van de sortering. Eerdere horloges blijven in opgeslagen volgorde.
- Verkocht of weggegeven (laatste van purchase/sold is sold) = eerder horloge: label bij de naam, kaart in een ingeklapte lijst "Former watches". Ze staan nog wel in de pulldowns van Rate Meter en Power Reserve.
- De voorbeeldhorloges hebben `info` (alleen gegevens die zeker kloppen) en een paar logboekregels (fictieve prijzen); de Tudor staat bewust op "service due".
- `[hidden]{display:none!important}`: zonder die regel blijven elementen met een eigen `display` (grid, pill) zichtbaar.
- "Wearing today" (NL "Vandaag om") bovenaan het overzicht, boven de kaarten, zodat het vanaf de homepage-tegel één tik is: chips met de huidige horloges (niet de eerdere), nog eens tikken = ongedaan, meerdere per dag mag. Daaronder een strook van 7 dagen om een vergeten dag te kiezen (smal scherm: alleen een stip per dag). Het blok staat open tot er voor vandaag een horloge is gekozen; de eerste keuze van vandaag klapt het na 450 ms in (zodat het vinkje zichtbaar is). Rechts naast de titel staat dan een getinte pil "✓ Today: <naam>" (zonder keuze gestippeld "Wearing today?"), die het blok opent en sluit; × rechtsboven sluit het ook, ook zonder keuze. Met de hand sluiten (× of pil) zonder horloge voor vandaag wordt onthouden tot het eind van de dag (`siouxWatchWearClosed`), zodat het blok op een dag zonder horloge dicht blijft; de volgende dag staat het weer open. Chips staan in `WatchData.wearOrder`: meest gedragen over 365 dagen tot en met gisteren (vandaag telt niet, zodat een chip niet verspringt terwijl je tikt), daarna op naam; het rapport gebruikt dezelfde volgorde, met eerdere horloges achteraan. Bewust niet Smart of laatst gedragen: die verspringen dagelijks, en chips tik je op gevoel. Bewust geen chip "geen horloge": dat zou data worden die meetelt en samengevoegd moet worden. Correcties op eerdere dagen en een tweede horloge klappen het niet in. Ingeklapt staat de back-upherinnering onder de titelregel. Bewust geen "Today"-knop op elke kaart: herhaling op elke kaart, en een kaart is een link. Kaarten tonen "worn today"/"worn N d ago"; onder de kaarten de rotatie over 12 maanden.
- `w.worn = [{id, t}]`, `t` = de dag om 00:00 UTC; in `LISTS`, dus samenvoegen op id. Twee apparaten kunnen dezelfde dag met een ander id loggen: dagen tellen één keer, en ongedaan maken verwijdert (met tombstones) alle regels van die dag.
- Tab Worn: dagen gedragen (12 maanden), aandeel van de vastgelegde dagen, laatst gedragen, langste reeks, en een kalender van 53 weken (ma–zo) die op mobiel bij de huidige week begint.
- Voorbeeldhorloges krijgen draagdagen voor de 150 dagen vóór vandaag (vandaag zelf niet), afgeleid van het dagnummer (`withWorn` in `sample.js`).
- Het rapport neemt gegevens, logboek en draagdagen mee (zie Rapport).

## Watch Rate Meter

- Gang in s/dag via lineaire regressie over offsetmetingen.
- Horlogekeuze is een pulldown (zoals Power Reserve) met onderaan "+ Add watch" als snelle weg (alleen een naam); die zet een naamveld op de plek van de select (Enter/Escape). Zonder horloges staat het naamveld er meteen. Ernaast een i-knop naar het horloge in de Collection; hernoemen en verwijderen gebeuren daar, niet hier.
- Een ● achter de naam in de pulldown = lopende rate-sessie (niet afgerond en niet stil, dezelfde definitie als de accentrand in de Collection). Power Reserve doet hetzelfde voor een lopende gangreservemeting. Een `<option>` is niet op te maken, dus het is een teken (`LIVE_MARK`, en-spatie + U+25CF).
- Meten: groene "jouw horloge"-klok met ▲/▼ gelijkzetten, dan vastleggen. Bevestiging "✓ Recorded" / "Vastgelegd" (niet "Saved": de knop heet Record). Hele seconden; tik-sync is bewust verwijderd.
- "Nieuwe start" is een handmatige checkbox. Geen automatische gat-detectie. Bedoeld voor een nieuwe meetperiode (na een service, na een tijd in de la).
- "Doorstart" / "Reset, same session" is een tweede checkbox eronder (sluiten elkaar uit). Bij de eerste meting van een horloge en na "End session" staat "Nieuwe start" vast aangevinkt en is "Doorstart" grijs; de eerste meting krijgt geen `newStart`-vlag (begint toch een sessie): voor gelijkzetten (ook zomer-/wintertijd) of na stilstand, als de sessie moet doorlopen. Zet `restart: true` op de meting. Aanvinken zet de groene klok op ±0 s, met eronder "Green clock set to ±0 s (was +4 s)" + gestippelde Undo (uitvinken zet hem ook terug); heb je de klok al met ▲/▼ bijgesteld (vinkje ná het gelijkzetten), dan blijft die waarde staan en verschijnt er niets; de offset mag een paar seconden afwijken (horloge zonder stopseconde), die afwijking wordt gewoon gemeten. Bewust niet achteraf te markeren.
- Betrouwbaarheid van de gang (`fitPieces`): `spread` = standaardafwijking van de residuen (s), `margin` = ~95%-marge op de gang (s/dag) = Student-t(dof) × max(spread, 1/√12 s) ÷ √Σ(t−t̄)²; dof = metingen − stukken − 1, bij dof 0 (twee metingen) beide null. De ondergrens 1/√12 s is de afrondingsruis van aflezen op hele seconden, zodat een toevallig mooie reeks geen te kleine marge krijgt. `r2` wordt nog berekend maar nergens getoond: hij groeit vooral met het verloop van de offset (lange sessie = 1.000) en is bij twee metingen altijd 1. Uitleg staat in `glossary.txt` (Linear regression, Spread, Rate margin, R²).
- Gang met doorstarts (`WatchData.rateOf`): de sessie valt uiteen in stukken (`pieces`), elk met een eigen beginpunt, en de gang is één gemeenschappelijke helling over alle stukken (gepoolde kleinste kwadraten, `fitPieces`; zonder doorstart gelijk aan de gewone regressie). Hoe lang het horloge stilstond doet er niet toe. Rate Meter, Viewer, rapport en Collection gebruiken dezelfde functie; de Viewer laadt daarvoor nu ook `watchdata.js`. Offsetlijn, gangpunten en ganglijn lopen nooit over een doorstart heen; gang per positie ook per stuk. Label "doorstart"/"reset" gestippeld in de metingenlijst en het rapport.
- "End session" / "Sessie afronden" in een eigen gestippeld venster "Rate session" / "Gangsessie" in het meetblok, onder het Timegrapher-venster (zelfde stijl): lopend "Rate session · since 18 Oct · 9 measurements" + End session, afgerond "Rate session ended 30 Oct" + Undo en de regel dat de volgende meting een nieuwe sessie start. Eerst stond het tussen de samenvatting en de grafieken; daar zat het in de weg. "Rate session" in het label, omdat de timegrapher ook "sessions" heeft. Expliciete vlag `w.rateEnd`, in twee stappen (5 s), daarna Undo. Een sessie is afgerond zolang de laatste meting niet na `rateEnd.at` ligt; tot dan staat "Nieuwe start" aangevinkt en vast, dus de volgende meting start een nieuwe sessie. Bedoeld voor de Collection (actief/niet actief); bewust geen automatisch afronden.
- Sessies worden afgeleid uit nieuwe-start-vlaggen (datastructuur ongewijzigd). Pulldown boven de grafiek bij >1 sessie, standaard de laatste, plus "Alle sessies" en "Alle sessies, zonder tussenpozen" (`allc`: sessies als aaneengesloten blokken op de tijd-as met gestippelde breuklijn). In die twee weergaven gaat de samenvattingsregel (gang, metingen, periode) over de laatste sessie, met "(latest session)" erachter; bij een gekozen sessie staat er niets achter.
- Rate- en offsetgrafiek delen dezelfde tijd-as. Timegrapher-ruitjes alleen binnen de getoonde periode, maar een timegrapher-sessie tot een dag vóór de eerste of na de laatste meting van een sessie hoort erbij en rekt de tijd-as op (`TG_GRACE`; vaak de laatste meting en dan op de timegrapher). Bewust geen ruimere marge: een timegrapher-sessie na weken in de la zou het sessieblok uitrekken. De Viewer doet hetzelfde; de ganggrafiek alleen met minstens één gangpunt, dus bij een sessie met één meting geen grafieken.
- Grafieken worden op echte pixelbreedte getekend (viewBox = gemeten breedte, `ResizeObserver` tekent opnieuw), zodat as-labels altijd 12 px zijn. Hoogte 200 px, onder 600 px schermbreedte 170 px. Y-raster op ronde stappen, eenheid één keer in de titel, aantal datumlabels naar breedte. Nooit meer een vaste viewBox met `preserveAspectRatio="none"`.
- Metingen- en timegrapher-lijst (`table.mtab`): onder 600 px geen tabelkop maar twee regels per rij (tijd + tag | offset, daaronder positie · notitie | delete), zodat niets rechts buiten het scherm loopt en de pagina niet opzij schuift. De notitie staat daarvoor ook als `.mnote` in de derde cel (`withNote`); de notitiekolom is op mobiel verborgen. Desktop blijft een gewone tabel.
- "How it compares" / "Vergelijking met normen" onder de grafieken: bewust ingeklapt (gestippelde knop), zodat de informatie gedoseerd blijft; ingeklapt staat rechts alleen "✓ Within <eigen norm>" als het horloge een eigen norm heeft. Open (onthouden in `siouxWatchStdOpen`): tabel met per norm een minischaal (symmetrisch, minstens ±10 s/dag, ruimere bereiken lopen van de rand), oranje streep = gang van de getoonde sessie, ✓/–; daarnaast pas dan een groene band in de ganggrafiek met een oranje stippellijn op de sessiegang, en de verdict achter de samenvattingsregel. De eigen norm van het horloge (`info.spec`) staat bovenaan en is de standaardband; een klik op een rij toont die norm (niet onthouden). Een heel brede band stopt 8 s/dag voorbij de data, zodat de grafiek niet plat wordt. Disclaimer (normen zijn labtests, dit is een indicatie) en "klik op een norm" staan achter een ?-knop rechts in de balk, alleen zichtbaar als het blok open is; de uitleg opent direct onder de balk, niet onder de tabel (daar viel hij op een telefoon buiten beeld).
- Toelichtingen bij grafieken staan achter een ?-knop (zoals bij Nieuwe start/Doorstart), niet als vaste tekst: op een telefoon namen ze meerdere regels in. De uitleg over gangpunten staat in de ganggrafiek (? rechts in de titel). Alleen de legenda van de timegrapher-ruitjes staat vast onder de grafiek.
- Normen staan in `standards.txt` (`Label | Name | min | max | aliassen`), in te lezen door `standards.js`; de tabel volgt de volgorde van het bestand. Namen alleen Engels. Nu: COSC −4/+6, METAS 0/+5, Superlative (Rolex) ±2, Performance Control (Tudor, interne norm, door Bas nagezocht) −2/+4, Grand Seiko mechanisch −3/+5, Seiko 6R −15/+25, Seiko 4R −35/+45. Bewust weggelaten: NH35 (spec onzeker).
- `info.spec` ("Accuracy spec" / "Nauwkeurigheidsnorm" bij Details, vrije tekst met suggesties uit `standards.txt` via een datalist, plus een ▾-knop ernaast met een onzichtbare native select van de normen, want iOS toont een datalist niet als pulldown; de datalist-pijl van Chrome is verborgen, zodat er één pijl is): een label, naam of alias uit de lijst, of een eigen bereik ("-2/+4", "±2", "±15 s/month"; per maand/jaar wordt omgerekend naar per dag). Onleesbare tekst wordt gewoon getoond en telt niet mee. Het rapport toont de norm (zie Rapport); de Viewer nog niet.
- Timegrapher: "Timegrapher-sessie toevoegen" opent een grid (positie, gang, optioneel amplitude en beat error); posities van de vorige sessie staan klaar. Toont ruitjes in de grafiek, drie vergelijkingskaartjes en een sessielijst.
- Sample-data: Omega Speedmaster '69 op precies +1,969 s/dag (maanlanding-easter-egg, niet aanpassen), Omega Seamaster 300M met drie sessies met gaten ertussen (toont `allc`; per sessie één positie: worn, dial up, worn, voor een rustige ganggrafiek; in de laatste sessie halverwege een doorstart, gelijkgezet van +4,6 naar +0,3 s, als demo van de zaagtand; gang blijft ~+1,2), drie timegrapher-sessies en drie gangreservemetingen (~55 u), Tudor Black Bay 58 met drie sessies (+7,2, −4,5, ~+1,2), drie timegrapher-sessies en twee gangreservemetingen (~70 u), Ancre 17 Jewels (vintage) met één sessie, per positie een blok van twee dagen (DU +18, DD +24, CD −8, CL +3, worn +10) zodat de positietabel van de Viewer een duidelijke spreiding toont, Casio A300U als kwarts-referentie. Staat in `watchrate/sample.js` (`WatchSample.watches()`), gedeeld door Rate Meter en Viewer; bij wijziging `?v=N` ophogen in beide pagina's.

## Voorbeeldhorloges

- Laden kan alleen bij een lege lijst ("Show sample watches" in de Collection, "Load sample data" in de Rate Meter-gids). `WatchSample.watches()` zet `sample: true` op elk horloge.
- Uitzondering, alleen om te testen: "Add samples" in de verborgen Tools-sectie opent `/collection/?samples` en zet de voorbeelden naast de eigen horloges (alleen als er nog geen voorbeelden zijn; actief horloge blijft staan; daarna wordt `?samples` uit de URL gehaald). Bewust geen extra afscherming: zolang ze er staan tellen hun draagdagen mee in rotatie en sortering, en een back-up neemt ze mee naar andere apparaten. Dus eerst "Remove sample watches", dan back-uppen. Bewust niet in de gewone UI: bezoekers horen hun collectie niet te vervuilen met niet-bestaande horloges.
- Een voorbeeldhorloge blijft een voorbeeld, ook als je er metingen, gegevens of logboekregels aan toevoegt: het is nooit een echt horloge uit je collectie.
- `WatchSample.isSample(w)`: de vlag, of (voor samples van vóór de vlag) een voorbeeldnaam plus minstens één van de eigen voorbeeldmetingen (id uit de inhoud). Een eigen horloge met dezelfde naam als een voorbeeld telt dus niet.
- "Remove samples" (Rate Meter-gids, alleen zichtbaar als er voorbeelden zijn) en "Remove sample watches (N)" (gestippeld onder de kaarten in de Collection) verwijderen alleen voorbeeldhorloges, met tombstones; eigen horloges blijven. Vroeger wiste de knop álle horloges, en via de tombstones bij samenvoegen ook op andere apparaten.
- In de Collection: feit "sample" op de kaart en pil "sample watch" naast de naam.

## Rapport

- Tegel "Report"/"Rapport" in het blok "Your data" in de Collection, opent `watchrate/report.html` (terugknop naar de Collection). Leest `siouxWatchRateMeter`; zonder horloges toont hij de voorbeeldhorloges (met "sample data" in de kop).
- Ook een knop "Report of these backups" ("Rapport van deze back-ups") in de balk van de Viewer, bewust: zo maak je een rapport van een horloge dat alleen in een back-up staat (ander apparaat, oude back-up, een vriend). Die knop opent `report.html?src=viewer` (plus `&merge=1` als "Merge watches" aan staat). Het rapport leest dan de geladen back-ups uit `swcViewerFiles`, samengevoegd op id (anders naam) zoals de Viewer, of per bestand met apparaat en datum onder de naam. Bovenaan staan de bronbestanden in plaats van het apparaat; de terugknop gaat naar de Viewer.
- Indeling: titel links en knoppen rechtsboven ("← Collection"/"← Backup Viewer", "Print / Save as PDF"), daaronder één instellingenkader; titel, knoppen en kader zijn 948 px breed, gelijk met de menubalk. Het witte vel blijft bewust A4-breed (210 mm, ~ de breedte van de PDF-pagina) en staat gecentreerd met het onderschrift "Preview · same width as the PDF page", zodat het scherm een eerlijk voorbeeld van de PDF is. Printuitleg klein rechts onder het kader. Vanuit de Viewer zegt de ondertitel "…copy of your backups".
- Kader: rij "Include" (All measurements, Details/logbook/worn, en als sub-opties Prices en Serial numbers, gedimd als Details uit staat), stippellijn, eventueel rij "Sources" (Viewer met merge) en stippellijn, dan rij "Watches" met "N of M" en All · None, de chips en een voetregel (onthouden, samengevoegd of voorbeelddata).
- Horlogekeuze: chips in het kader (niet geprint), met "N of M" en All/None. Lege horloges (geen metingen, timegrapher of gangreserve) staan standaard uit. Volgorde van chips en pagina's: `WatchData.wearOrder` (meest gedragen, dan naam, eerdere horloges achteraan), per bron en ook na samenvoegen. Geen horloges gekozen = melding in plaats van pagina's.
  - Vanaf de Rate Meter: één rij; keuze onthouden in `siouxWatchReportPick` (`{ watchId: bool }`, alleen expliciete keuzes, dus nieuwe horloges staan vanzelf aan).
  - Vanaf de Viewer: de live Rate Meter-data doet mee als bron "This device · now", standaard uit (staat vaak al in een back-up). Per bestand: een rij per bron met eigen All/None. Met merge: bronnen als chips aan/uit, daaronder de samengevoegde horloges (op id, anders naam). Keuze wordt hier niet onthouden.
- Leesbare back-up naast de JSON: PDF via het printvenster ("Opslaan als PDF"), geen PDF-library.
- Opbouw: overzichtspagina (kerncijfers + tabel per horloge), dan per horloge een nieuwe pagina met kerncijfers, offset- en ganggrafiek (sessies altijd aaneengesloten, zoals `allc`), sessies, gang per positie (laatste sessie), gangreserve (kolom Notitie alleen als een meting van dat horloge een notitie heeft), timegrapher en optioneel alle metingen.
- Opties in het kader (niet geprint, niet onthouden): "Details, logbook & worn" (aan), "Prices" en "Serial numbers" (uit, want een rapport wordt vaak gedeeld: verzekeraar, koper, horlogemaker; uitgeschakeld als het logboek uit staat), "Include all measurements" (aan).
- Per horloge onder de naam merk/model/ref/kaliber/jaar, en met "Serial numbers" aan ook het serienummer ("Serial …"). De meetdata (kerncijfers, grafieken, sessies, posities, gangreserve, timegrapher) blijft bewust bovenaan, zodat die samen op één pagina staat.
- Daarna het blok Details met dezelfde donkere lijn als de tabellen (`.detbox`, niet over een pagina gesplitst): gegevens in twee kolommen (alleen ingevulde velden, aankoop uit het logboek, volgende onderhoudsbeurt met "service due") en daaronder het draaggedrag (dagen, periode met datums, laatst gedragen, kalender met maandlabels; jaartal bij januari en het eerste label). Dan het Logboek (tabel, kostenkolom alleen met Prices).
- De draagperiode is de 12 maanden tot de rapportdatum, dus een horloge dat in de la ligt loopt zichtbaar leeg; bij een verkocht of weggegeven horloge eindigt hij op de verkoopdatum.
- Staat Prices of Serial numbers aan terwijl geen gekozen horloge er een heeft, dan staat er "· none filled in" (oranje) naast het vinkje. Verkochte horloges krijgen een tag. Overzichtstabel: kolom Worn, en met Prices de aankoopprijs.
- Samenvoegen van Viewer-bestanden neemt nu ook `info` (laatste `edited` wint), `log` en `worn` mee. Een horloge met alleen gegevens, logboek of draagdagen telt niet als leeg.
- Tabel Sessions: gang met de marge klein erachter ("+1.19 ±0.10"), kolom Spread (s, één decimaal) in plaats van R², en een vaste voetregel die beide uitlegt en naar de woordenlijst verwijst. Zonder marge (twee metingen) "—".
- Tabellen: koppen mogen afbreken, met de eenheid klein eronder ("Rate / s/day", "Worn / days, 12 mo", "Sess."); getallen en periodes blijven op één regel; in het overzicht krijgt de naamkolom minstens 44 mm. Op het scherm scrolt een tabel die toch te breed is binnen het vel, nooit erbuiten (eerder liep de overzichtstabel met prijs en draagdagen 84 px buiten het vel).
- Altijd licht (papier), los van het thema. Grafieken zijn vaste SVG met viewBox; schalen mee in print.
- Geen vaste papiermaat in `@page`: het printvenster kiest A4 of Letter (VS/Canada). Getest op beide met Chrome headless; Safari/iOS nog niet.
- Datums met maand in letters en 24-uurs tijd, zodat ze internationaal eenduidig zijn. Kerncijfer Periode op de voorpagina met jaartal ("2 Jun –" / "20 Oct 2026", twee regels; beide jaren als ze verschillen). Paginavoet alleen "watchcafe.eu" en de datum; het tijdstip staat onder de titel.
- Normen (`standards.js`): altijd, als een horloge een leesbare eigen norm heeft (`info.spec`), de regel "✓ Within Performance −2 / +4" / "Outside …" onder de huidige gang (kerncijfer), een groene band in de ganggrafiek (zelfde 8 s/dag-regel als de Rate Meter) met oranje stippellijn op de gang over het laatste sessieblok, en in de overzichtstabel ✓/– + norm klein onder de gang. Bewust geen eigen kolom: met Prices en Worn liep de tabel buiten het vel. Optie "Accuracy standards" (standaard uit, niet onthouden; een ✓ COSC leest al snel als certificaat) voegt onder Sessions de tabel "How it compares" toe: eigen norm bovenaan (tag "own spec"), minischaal ±10 s/dag of ruimer, ✓/–, met vaste disclaimer (geen ?-knop op papier). Korte sessie (< 3 dagen of < 3 metingen): "short session" erbij, niet weggelaten. Onleesbare norm: alleen de tekst in het overzicht en bij Details ("Accuracy spec").

## Backup Viewer

- Heet overal "Backup Viewer" (titel, kop, voet). Het voorbeeldbestand heet `sample-backup.json`.
- Balk in twee lagen: bovenaan "Loaded:" met de bestandschips; onder een stippellijn Merge en Sort links, de rapportknop (getint, met rapporticoon) rechts. Geen aparte "+ Add file": het sleepvak blijft altijd zichtbaar.

- Laadt één of meer JSON-backups; geladen bestanden blijven in localStorage.
- LED-gangweergave in DSEG7 Bold (base64 ingebed uit npm `dseg`).
- Dezelfde sessie-pulldown als de Rate Meter; geen pulldown bij één sessie. Ook "Alle sessies, zonder tussenpozen" (`allc`): elke sessie een eigen blok op de tijd-as, dode tijd ertussen weggesneden (gestippelde scheidingslijn), regressielijn per sessie.
- Grafieken: offset in de tijd en gang in de tijd, vanaf 860 px schermbreedte naast elkaar. Net als op de Rate Meter op pixelmaat getekend (`drawCharts()` na elke render en bij resize), 230 px hoog, onder 600 px 180 px. Gangpunten zoals op de Rate Meter: opeenvolgende metingen ≥ 6 uur uit elkaar, stip op het eindpunt van het interval (dus meestal bij de tweede meting), lijn breekt bij een nieuwe start, timegrapher-ruitjes erbij.
- Per-positie-gang met spreiding, offsetgrafiek met regressielijn, timegrapher-data, merge-toggle, sorteren, demo-modus.
- "Zo werkt het"-gids alleen in de lege toestand, terug te halen via `?`; `?` togglet (tweede klik sluit), net als op de Rate Meter.

## Power Reserve

- Zelfde opzet als de Rate Meter: één horlogekeuze bovenaan (pulldown met "+ Add watch", i-knop naar de Collection, gedeelde `activeWatch`), dan een blok "Measuring — <horloge>" en de historie van datzelfde horloge. "?"-gids (staat open zonder horloges) en de back-upstatusregel zoals op de Rate Meter.
- Het meetblok toont één genummerde stapgroep voor de stand van het gekozen horloge: 1 Gelijkzetten en opwinden (groene siteklok; bewust eerst gelijkzetten, dan opwinden, beter voor het horloge) + 2 Starten ("Gelijk & opgewonden" / "Set & wound"); daarna Loopt (LED-teller, "Loopt nog", "Gestopt") en Gestopt (wijzertijd + dag, Opslaan/Terug/Verwerpen), zonder nummer: na het starten zijn stap 1 en 2 weg, dus een 3 of 4 verwart. Tekst bij stap 1 zonder "then tap" (dat is stap 2).
- Notitie per meting: een veld naast "Gelijk & opgewonden" (concept per horloge in het geheugen tot de start), daarna op `prCurrent.note`, aan te passen tijdens het lopen en na "Gestopt"; opslaan schrijft hem in `note` van de gangreservemeting. Opslaan bij elke toetsaanslag zonder het blok opnieuw te tekenen (focus blijft). De historie toont een kolom Notitie. Opgeslagen notities zijn bewust niet achteraf te bewerken.
- "Loopt nog" legt een ondergrens vast en lost de 12-uurs-ambiguïteit op. "Terug" herstelt een per ongeluk gestopte meting.
- Bewust losgekoppeld van de Rate Meter-offset; opgeslagen metingen houden `offset: 0`.
- Meerdere horloges tegelijk meten kan: elk horloge met een lopende meting krijgt een ● achter de naam in de pulldown. Bewust geen looptijd in de pulldown en geen lijst met alle lopende metingen; dat overzicht staat in de Collection.

## Moon Phase

- Losse pagina zonder horlogedata: rekent alleen, slaat alleen het gekozen type op (`siouxWatchMoonType`).
- Echte nieuwe en volle manen volgens Meeus (*Astronomical Algorithms*, hfst. 49, hoofdtermen), binnen een minuut of twee; getoetst op bekende data (o.a. 25 jan 2024, zonsverduistering 8 apr 2024). Geen dependency.
- Bovenaan een dagstrook (14 dagen terug, 60 vooruit) met een maantje per dag (accentring = dag met nieuwe of volle maan, op het echte tijdstip in de lokale tijdzone) en een tijdschuif per kwartier. Strook blijft onder de menubalk staan (`sticky`, `top:53px` = vaste balk van `nav.js`); onder 760 px staat er een klein maanvenster naast de schuif, zodat je de maan ziet bewegen waar je ook op de pagina bent. Bewust geen native datumkiezer: die klapt open over de plaatjes. Gekozen uit drie mockups (pijltjes+schuif, maankalender, dagstrook).
- Links "The moon now": de hemelmaan (noordelijk halfrond), fasenaam (nieuw/vol binnen 12 uur van het echte moment, de rest op leeftijd), leeftijd, % verlicht, laatste volle en volgende nieuwe/volle maan.
- Standaard (59 tanden, 29,5 dag per maan): stap 1 volle maan in het midden, stap 2 N keer drukken. N komt uit `watchPos`: lineair tussen de echte volle en nieuwe maan (die liggen 13,9–15,6 dagen uit elkaar, het horloge rekent altijd 14,75), zodat nieuwe en volle maan allebei precies kloppen; eerst was het dagen sinds volle maan, en dan stak bij een korte helft op het moment van nieuwe maan nog een randje maan boven de bult uit. Bulten (r 35) iets groter dan de manen (r 29): rond nieuwe maan is de maan ~een dag helemaal weg, zoals op een echt horloge; daaronder het maanvenster zoals het eruit hoort te zien. Precision (135 tanden of meer): geen aantal (verschilt per kaliber), alleen het plaatje.
- Maanvenster als SVG: schijf met twee manen die achter twee bulten draaien; volle maan midden bovenaan, nieuwe maan achter een bult. Vaste kleuren (blauw/goud), alleen het streepje bovenaan in accentkleur.
- Waarschuwing: corrector niet tussen ~21:00 en 03:00 (handleiding). Driftregel: standaard loopt ~elke 2 jaar en 8 maanden een dag achter.
- Bewust geen homepage-tegel (te weinig gebruikt; de vier tegels blijven rustig) en geen tabbladen met Rate/Reserve (die hebben een horlogekeuze, Moon Phase niet; kost bovenin schermruimte op de telefoon). Alleen een menu-item. Komt er een tweede zelden gebruikte tool (datumcorrectie, chronograafschalen), dan een groep "More" in het menu of één pagina "Complications"; Rate en Reserve blijven direct in de balk.
- Nog niet: sectie in de Guide, koppeling met de Collection (type bij Details, logboekregel "maan ingesteld" met drift-herinnering).

## Thema's

Zeven donkere thema's met iconische accentkleur, merkvrije namen:
Watch Café (standaard, `#d96a41`), Day-Date (`#d4af52`, verving Pepsi), Snowflake (`#5b9bff` + goud), Speedy (`#e2483d`), Monster (`#ff8a2a`), Kermit (`#48c777` + goud), Dark Side (`#f2c230` op zwart/antraciet).

- Alleen decoratieve "chrome" themet mee. Functionele kleuren (rode referentieklok, groene horlogeklok, positiekleuren, grafiekschaal) nooit.
- Overrides alleen in `theme.css`; standaardkleuren blijven inline per pagina tegen een kleurflits bij laden.
- Elk themablok zet alle variabelen (`--bg` en `--page` gelijk).
- Thema toevoegen/wijzigen = `theme.css` (kleuren) + `nav.js` (menunaam).
- Nooit Rolex/Omega/Seiko/Tudor als naam gebruiken.

## Ontwerp en lessen

- Modern en donker, niet oud-bollig. Progressive disclosure, minimale UI, hulp impliciet. Zelden gebruikte functies niet prominent.
- Gestippelde randen voor secundaire acties, genummerde stapgroepen voor meetworkflows.
- Hoofdknoppen en actief-markeringen (`button.primary`, `.pillbtn.solid`, `.chip.active`, `.actchip`) zijn getint, niet vol: `color-mix` van `--accent` 18% als achtergrond, 55% als rand, tekst in accentkleur. Vol gevuld met wit erop was te fel, vooral in Kermit.
- Liever expliciete, door de gebruiker gezette vlaggen dan automatische detectie.
- Geen volledige DOM-rebuild op input-events (sloot de iOS-tijdkiezer).
- `applyStatic()` niet laten draaien nadat `renderStart()` elementen heeft vervangen.
- Terugknop: browsers (vooral Safari/iOS) zetten een pagina uit de back-forward cache terug met de oude data in het geheugen. Collection, Rate Meter en Power Reserve lezen daarom bij `pageshow` met `persisted` de data opnieuw in; anders toont de pagina oude data en overschrijft de volgende `save()` wijzigingen van een andere pagina. Nieuwe pagina's die data opslaan hebben dit ook nodig.
- Eerdere bugs om op te letten: segment-dimming-CSS, viewer die reset-vlaggen negeerde, klok buiten beeld op mobiel.

## Open punten

- [ ] Moon Phase: sectie in de Guide.

- [x] Oude `viewer.html` in de root verwijderd (commit b46e201); `watchrate/viewer.html` is de enige viewer.
- [ ] Beslissen of een lichtere, beter leesbare variant nog gewenst is, nu alle thema's donker zijn.
- [x] Doorstart in de voorbeelddata: Seamaster 300M, laatste sessie (`sample.js?v=7`).
