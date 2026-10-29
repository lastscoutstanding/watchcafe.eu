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
| `watchrate/index.html` | Watch Rate Meter |
| `watchrate/viewer.html` | Backup Viewer |
| `watchrate/report.html` | Printbaar rapport (PDF via printvenster) |
| `watchrate/sample.js` | Voorbeeldhorloges, gedeeld door Rate Meter en Viewer |
| `powerreserve/index.html` | Power Reserve |
| `guide/index.html` + `glossary.txt` | Guide met twee tabs: handleiding per tool en woordenlijst EN/NL (`#glossary`) |
| `glossary/index.html` | Alleen doorverwijzing naar `/guide/#glossary` (oude bladwijzers) |
| `privacy/index.html` | Privacy, inspecteert live cookies/localStorage |
| `cafe/index.html` + `meetings.txt`, `meetings.js`, `events.txt`, `events.js`, `cafe-log.txt` | Café-pagina |
| `nav.js` | Gedeelde menubalk, taal-toggle, thema-keuze |
| `watchdata.js` | Gedeeld: apparaatnaam, back-upnaam, verwijder-tombstones, samenvoegen, `currentRate(w)` (Rate Meter, Power Reserve, Collection, rapport) |
| `theme.css` | Alle thema-overrides |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Favicon (klokje op 10:10) |

localStorage-keys (gedeeld over de hele site, altijd uitlezen, nooit hardcoden):
- `siouxWatchRateMeter`: alle horlogedata (metingen, timegrapher, gangreserve, gegevens, logboek, draagdagen).
- `siouxWatchRateMeterLang`: taal (EN standaard, NL).
- `siouxWatchTheme`: gekozen thema.
- `siouxWatchDevice`: apparaatnaam voor back-ups; alleen gezet als de gebruiker hem wijzigt, anders afgeleid uit de browser (iPhone, iPad, Mac, Windows, Android …).
- `siouxWatchLastBackup`: `{ at, file }` van de laatste back-up op dit apparaat, voor de back-upstatus en -herinnering.
- `siouxWatchReportPick`: welke horloges in het rapport aan/uit staan (alleen expliciete keuzes, alleen Rate Meter-bron).

Backup-JSON = de volledige opgeslagen data plus stempel (`WatchData.backupData`): `{ version, activeWatch, watches: [...], deleted?, exportedFrom? }`.
- Horloge: `{ id, name, measurements, timegrapher?, powerReserve?, prCurrent?, info?, edited?, log?, worn? }`.
- Meting: `{ id, t, offset, position, note, newStart? }` met `t` in epoch-ms en `offset` in seconden.
- `info`: gegevens uit de Collection (`brand, model, ref, caliber, year, serial, caseSize, lugWidth, boxPapers, serviceYears`, alle vrije tekst, alleen ingevulde velden); `edited` = tijdstip van de laatste wijziging van naam of gegevens.
- `log`: `[{ id, t, type, where?, cost?, note?, edited? }]`; `worn`: `[{ id, t }]`; bij beide is `t` de dag om 00:00 UTC.
- Prijzen en serienummers staan dus altijd in de back-up, ook als het rapport ze weglaat. De Backup Viewer toont alleen de meetgegevens; gegevens, logboek en draagdagen alleen via het rapport.

## Back-ups tussen apparaten

- Bestandsnaam `watchrate-<apparaat>-JJJJ-MM-DD-UUMM.json`, plus `exportedFrom: { device, at }` in de JSON (overleeft hernoemen). Apparaatnaam aanpasbaar naast de back-upknop; de Viewer toont apparaat en tijd op de bestandschip.
- Herstellen opent een paneel met per horloge wat de back-up toevoegt/verwijdert. Standaard Samenvoegen; "Alles vervangen" is secundair (gestippeld, met bevestiging).
- Samenvoegen op id. Toevoegen en verwijderen tellen. Bewerken kan alleen voor naam en gegevens (`w.info`, in de Collection); `w.edited` is het tijdstip daarvan en de laatste wijziging wint. Zonder `edited` aan beide kanten blijft de lokale naam. Het herstelpaneel toont dan "details updated".
- Verwijderingen: `state.deleted = { id: ms }`. Elke verwijderknop (horloge, meting, timegrapher-sessie, gangreserve-historie, voorbeelden wissen) moet `WatchData.markDeleted`/`markWatchDeleted` aanroepen, anders komt het item terug bij samenvoegen. Lopende gangreservemeting zonder id: `"pr:<start>"` bij opslaan of verwerpen.
- Items zonder id (oude voorbeelddata) krijgen een id uit hun inhoud (`ensureIds`), zodat ze op elk apparaat gelijk zijn.
- Delen-knop via Web Share API, alleen zichtbaar als de browser bestanden kan delen; bij een fout (geen annulering) valt hij terug op downloaden.
- Blok "Your data" onderaan het Collection-overzicht (verhuisd uit de Rate Meter, want een back-up bevat nu ook gegevens, logboek en draagdagen, en de Collection wordt het vaakst geopend): statusregel met stip, "Back up now" (getint) + Share + apparaatnaam; onder een stippellijn twee tegels met grijze knop en toelichting (Report, Browse backups); daaronder klein en gestippeld "Restore from backup…". De Rate Meter houdt alleen de statusregel met een link "Backup & restore in your Collection →" naar `/collection/?backup` (scrollt naar het blok).
- Back-upstatus (`WatchData.backupStatus`): grijs zonder eigen metingen (alleen voorbeelden of leeg), groen na een back-up, oranje als er iets nieuw is en er nooit een back-up was, de laatste ≥ 14 dagen oud is of ≥ 10 nieuwe items wachten. "Nieuw" = items (metingen, timegrapher-sessies, gangreservemetingen, logboekregels, draagdagen) met een `uid()`-id jonger dan de laatste back-up (de aanmaaktijd zit in de eerste 8 tekens van het id; voorbeelddata heeft id's uit de inhoud en telt niet).
- Een download valt niet te bevestigen: de klik telt als back-up, bij Delen alleen een geslaagde share.
- Herinnering (`bkNudge`) direct na "Record measurement", na opslaan in Power Reserve en na een tik bij "Wearing today" (in dat blok; × verbergt hem tot de volgende paginalading), alleen bij oranje, met "Back up now" en ×. Geen pop-up. Teksten spreken van "items", niet van metingen.
- `watchdata.js` staat met `?v=N` in Rate Meter en Power Reserve; ophogen bij wijzigingen.

## Homepage en Live Clock

- Site is tool-gericht; café-inhoud staat onder `/cafe/`.
- Merknaam buiten de café-pagina is `watchcafe.eu` (menubalk, paginatitels, footers, rapport); tool-ondertitels zonder achtervoegsel. "Sioux" alleen op `/cafe/` en in de regel onder de homepage-tegels, met uitleg ("a monthly meetup of watch fans at Dutch tech company Sioux"): buiten Sioux zegt de naam niemand iets en het is ook de naam van inheemse Amerikaanse volken.
- Menuvolgorde: Home, Collection, Rate Meter, Power Reserve, Guide, Watch Café (café bewust achteraan). Glossary is een tab van de Guide, om het menu kort te houden.
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
- `/collection/#<id>` toont één horloge met tabs Overview (gang, gangreserve, timegrapher, met links; de link zet `activeWatch`) en Details (merk, model, referentie, kaliber, jaar, serienummer, kastmaat, bandaanzet, doos & papieren in `w.info`; serienummer gemaskeerd tot je erop klikt). Bewerken incl. hernoemen zet `w.edited`. Verwijderen in twee stappen (5 s) met `markWatchDeleted`.
- Tab Logbook: `w.log = [{id, t, type, where?, cost?, note?, edited?}]`, `t` = de dag om 00:00 UTC (datum verschuift nooit met de tijdzone), kosten vrije tekst. Types: purchase, service, repair, strap, event, sold, note; labels van "where" en kosten verschillen per type. Klik op een regel = bewerken (zet `edited`) of verwijderen in twee stappen (`markDeleted`). `log` zit in `LISTS` van `watchdata.js`: samenvoegen op id, en bij hetzelfde id wint de hoogste `edited`.
- Type "Event" is bewust algemeen (geen "Watch Café"). Valt de datum op een café-datum (`meetings.txt`, titels in `cafe-log.txt`) of een evenement uit `events.txt`, dan verschijnt een suggestie-knop met die naam ("Watch Café, Sioux Labs" of "naam, plaats").
- Onderhoudsinterval (`info.serviceYears`) bij Details: volgende beurt = laatste service (anders aankoop) + interval; achterstallig geeft een oranje "service due" op de kaart. Aankoopdatum, -plaats en -prijs in Details komen uit het logboek.
- Verkocht of weggegeven (laatste van purchase/sold is sold) = eerder horloge: label bij de naam, kaart in een ingeklapte lijst "Former watches". Ze staan nog wel in de pulldowns van Rate Meter en Power Reserve.
- De voorbeeldhorloges hebben `info` (alleen gegevens die zeker kloppen) en een paar logboekregels (fictieve prijzen); de Tudor staat bewust op "service due".
- `[hidden]{display:none!important}`: zonder die regel blijven elementen met een eigen `display` (grid, pill) zichtbaar.
- "Wearing today" (NL "Vandaag om") bovenaan het overzicht, boven de kaarten, zodat het vanaf de homepage-tegel één tik is: chips met de huidige horloges (niet de eerdere), nog eens tikken = ongedaan, meerdere per dag mag. Daaronder een strook van 7 dagen om een vergeten dag te kiezen (smal scherm: alleen een stip per dag). Kaarten tonen "worn today"/"worn N d ago"; onder de kaarten de rotatie over 12 maanden.
- `w.worn = [{id, t}]`, `t` = de dag om 00:00 UTC; in `LISTS`, dus samenvoegen op id. Twee apparaten kunnen dezelfde dag met een ander id loggen: dagen tellen één keer, en ongedaan maken verwijdert (met tombstones) alle regels van die dag.
- Tab Worn: dagen gedragen (12 maanden), aandeel van de vastgelegde dagen, laatst gedragen, langste reeks, en een kalender van 53 weken (ma–zo) die op mobiel bij de huidige week begint.
- Voorbeeldhorloges krijgen draagdagen voor de 150 dagen vóór vandaag (vandaag zelf niet), afgeleid van het dagnummer (`withWorn` in `sample.js`).
- Het rapport neemt gegevens, logboek en draagdagen mee (zie Rapport).

## Watch Rate Meter

- Gang in s/dag via lineaire regressie over offsetmetingen.
- Horlogekeuze is een pulldown (zoals Power Reserve) met onderaan "+ Add watch" als snelle weg (alleen een naam); die zet een naamveld op de plek van de select (Enter/Escape). Zonder horloges staat het naamveld er meteen. Ernaast een i-knop naar het horloge in de Collection; hernoemen en verwijderen gebeuren daar, niet hier.
- Meten: groene "jouw horloge"-klok met ▲/▼ gelijkzetten, dan vastleggen. Hele seconden; tik-sync is bewust verwijderd.
- "Nieuwe start" is een handmatige checkbox. Geen automatische gat-detectie.
- Sessies worden afgeleid uit nieuwe-start-vlaggen (datastructuur ongewijzigd). Pulldown boven de grafiek bij >1 sessie, standaard de laatste, plus "Alle sessies" en "Alle sessies, zonder tussenpozen" (`allc`: sessies als aaneengesloten blokken op de tijd-as met gestippelde breuklijn).
- Rate- en offsetgrafiek delen dezelfde tijd-as.
- Grafieken worden op echte pixelbreedte getekend (viewBox = gemeten breedte, `ResizeObserver` tekent opnieuw), zodat as-labels altijd 12 px zijn. Hoogte 200 px, onder 600 px schermbreedte 170 px. Y-raster op ronde stappen, eenheid één keer in de titel, aantal datumlabels naar breedte. Nooit meer een vaste viewBox met `preserveAspectRatio="none"`.
- Timegrapher: "Timegrapher-sessie toevoegen" opent een grid (positie, gang, optioneel amplitude en beat error); posities van de vorige sessie staan klaar. Toont ruitjes in de grafiek, drie vergelijkingskaartjes en een sessielijst.
- Sample-data: Omega Speedmaster '69 op precies +1,969 s/dag (maanlanding-easter-egg, niet aanpassen), Omega Seamaster 300M met drie sessies met gaten ertussen (toont `allc`; per sessie één positie: worn, dial up, worn, voor een rustige ganggrafiek), drie timegrapher-sessies en drie gangreservemetingen (~55 u), Tudor Black Bay 58 met drie sessies (+7,2, −4,5, ~+1,2), drie timegrapher-sessies en twee gangreservemetingen (~70 u), Ancre 17 Jewels (vintage) met één sessie, per positie een blok van twee dagen (DU +18, DD +24, CD −8, CL +3, worn +10) zodat de positietabel van de Viewer een duidelijke spreiding toont, Casio A300U als kwarts-referentie. Staat in `watchrate/sample.js` (`WatchSample.watches()`), gedeeld door Rate Meter en Viewer; bij wijziging `?v=N` ophogen in beide pagina's.

## Rapport

- Tegel "Report"/"Rapport" in het blok "Your data" in de Collection, opent `watchrate/report.html` (terugknop naar de Collection). Leest `siouxWatchRateMeter`; zonder horloges toont hij de voorbeeldhorloges (met "sample data" in de kop).
- Ook een knop "Report of these backups" ("Rapport van deze back-ups") in de balk van de Viewer, bewust: zo maak je een rapport van een horloge dat alleen in een back-up staat (ander apparaat, oude back-up, een vriend). Die knop opent `report.html?src=viewer` (plus `&merge=1` als "Merge watches" aan staat). Het rapport leest dan de geladen back-ups uit `swcViewerFiles`, samengevoegd op id (anders naam) zoals de Viewer, of per bestand met apparaat en datum onder de naam. Bovenaan staan de bronbestanden in plaats van het apparaat; de terugknop gaat naar de Viewer.
- Indeling: titel links en knoppen rechtsboven ("← Collection"/"← Backup Viewer", "Print / Save as PDF"), daaronder één instellingenkader; titel, knoppen en kader zijn 948 px breed, gelijk met de menubalk. Het witte vel blijft bewust A4-breed (210 mm, ~ de breedte van de PDF-pagina) en staat gecentreerd met het onderschrift "Preview · same width as the PDF page", zodat het scherm een eerlijk voorbeeld van de PDF is. Printuitleg klein rechts onder het kader. Vanuit de Viewer zegt de ondertitel "…copy of your backups".
- Kader: rij "Include" (All measurements, Details/logbook/worn, en als sub-opties Prices en Serial numbers, gedimd als Details uit staat), stippellijn, eventueel rij "Sources" (Viewer met merge) en stippellijn, dan rij "Watches" met "N of M" en All · None, de chips en een voetregel (onthouden, samengevoegd of voorbeelddata).
- Horlogekeuze: chips in het kader (niet geprint), met "N of M" en All/None. Lege horloges (geen metingen, timegrapher of gangreserve) staan standaard uit. Geen horloges gekozen = melding in plaats van pagina's.
  - Vanaf de Rate Meter: één rij; keuze onthouden in `siouxWatchReportPick` (`{ watchId: bool }`, alleen expliciete keuzes, dus nieuwe horloges staan vanzelf aan).
  - Vanaf de Viewer: de live Rate Meter-data doet mee als bron "This device · now", standaard uit (staat vaak al in een back-up). Per bestand: een rij per bron met eigen All/None. Met merge: bronnen als chips aan/uit, daaronder de samengevoegde horloges (op id, anders naam). Keuze wordt hier niet onthouden.
- Leesbare back-up naast de JSON: PDF via het printvenster ("Opslaan als PDF"), geen PDF-library.
- Opbouw: overzichtspagina (kerncijfers + tabel per horloge), dan per horloge een nieuwe pagina met kerncijfers, offset- en ganggrafiek (sessies altijd aaneengesloten, zoals `allc`), sessies, gang per positie (laatste sessie), gangreserve, timegrapher en optioneel alle metingen.
- Opties in het kader (niet geprint, niet onthouden): "Details, logbook & worn" (aan), "Prices" en "Serial numbers" (uit, want een rapport wordt vaak gedeeld: verzekeraar, koper, horlogemaker; uitgeschakeld als het logboek uit staat), "Include all measurements" (aan).
- Per horloge onder de naam merk/model/ref/kaliber/jaar, en met "Serial numbers" aan ook het serienummer ("Serial …"). De meetdata (kerncijfers, grafieken, sessies, posities, gangreserve, timegrapher) blijft bewust bovenaan, zodat die samen op één pagina staat.
- Daarna het blok Details met dezelfde donkere lijn als de tabellen (`.detbox`, niet over een pagina gesplitst): gegevens in twee kolommen (alleen ingevulde velden, aankoop uit het logboek, volgende onderhoudsbeurt met "service due") en daaronder het draaggedrag (dagen, periode met datums, laatst gedragen, kalender met maandlabels; jaartal bij januari en het eerste label). Dan het Logboek (tabel, kostenkolom alleen met Prices).
- De draagperiode is de 12 maanden tot de rapportdatum, dus een horloge dat in de la ligt loopt zichtbaar leeg; bij een verkocht of weggegeven horloge eindigt hij op de verkoopdatum.
- Staat Prices of Serial numbers aan terwijl geen gekozen horloge er een heeft, dan staat er "· none filled in" (oranje) naast het vinkje. Verkochte horloges krijgen een tag. Overzichtstabel: kolom Worn, en met Prices de aankoopprijs.
- Samenvoegen van Viewer-bestanden neemt nu ook `info` (laatste `edited` wint), `log` en `worn` mee. Een horloge met alleen gegevens, logboek of draagdagen telt niet als leeg.
- Tabellen: koppen mogen afbreken, met de eenheid klein eronder ("Rate / s/day", "Worn / days, 12 mo", "Sess."); getallen en periodes blijven op één regel; in het overzicht krijgt de naamkolom minstens 44 mm. Op het scherm scrolt een tabel die toch te breed is binnen het vel, nooit erbuiten (eerder liep de overzichtstabel met prijs en draagdagen 84 px buiten het vel).
- Altijd licht (papier), los van het thema. Grafieken zijn vaste SVG met viewBox; schalen mee in print.
- Geen vaste papiermaat in `@page`: het printvenster kiest A4 of Letter (VS/Canada). Getest op beide met Chrome headless; Safari/iOS nog niet.
- Datums met maand in letters en 24-uurs tijd, zodat ze internationaal eenduidig zijn.

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

- Opwinden, gelijkzetten op de siteklok (systeemtijd), "Opgewonden & gelijk". "Loopt nog" legt een ondergrens vast en lost de 12-uurs-ambiguïteit op. "Gestopt" + afgelezen wijzertijd. "Terug" herstelt een per ongeluk gestopte meting.
- Bewust losgekoppeld van de Rate Meter-offset; opgeslagen metingen houden `offset: 0`.
- Meerdere horloges tegelijk, elk een kaart met live teller en historie.

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
- Eerdere bugs om op te letten: segment-dimming-CSS, viewer die reset-vlaggen negeerde, klok buiten beeld op mobiel.

## Open punten

- [x] Oude `viewer.html` in de root verwijderd (commit b46e201); `watchrate/viewer.html` is de enige viewer.
- [ ] Beslissen of een lichtere, beter leesbare variant nog gewenst is, nu alle thema's donker zijn.
