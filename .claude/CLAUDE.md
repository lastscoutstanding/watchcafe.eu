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
| `watchrate/index.html` | Watch Rate Meter |
| `watchrate/viewer.html` | Backup Viewer |
| `powerreserve/index.html` | Power Reserve |
| `glossary/index.html` + `glossary.txt` | Woordenlijst EN/NL |
| `guide/index.html` | Handleiding per tool |
| `privacy/index.html` | Privacy, inspecteert live cookies/localStorage |
| `cafe/index.html` + `meetings.txt`, `meetings.js`, `events.txt`, `events.js`, `cafe-log.txt` | Café-pagina |
| `nav.js` | Gedeelde menubalk, taal-toggle, thema-keuze |
| `watchdata.js` | Gedeeld: apparaatnaam, back-upnaam, verwijder-tombstones, samenvoegen (Rate Meter + Power Reserve) |
| `theme.css` | Alle thema-overrides |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Favicon (klokje op 10:10) |

localStorage-keys (gedeeld over de hele site, altijd uitlezen, nooit hardcoden):
- `siouxWatchRateMeter`: alle horlogedata (metingen, timegrapher, gangreserve).
- `siouxWatchRateMeterLang`: taal (EN standaard, NL).
- `siouxWatchTheme`: gekozen thema.
- `siouxWatchDevice`: apparaatnaam voor back-ups; alleen gezet als de gebruiker hem wijzigt, anders afgeleid uit de browser (iPhone, iPad, Mac, Windows, Android …).

Backup-JSON: `{ version, activeWatch, watches: [...], deleted?, exportedFrom? }`; horloge `{ id, name, measurements, timegrapher?, powerReserve?, prCurrent? }`; meting `{ id, t, offset, position, note, newStart? }` met `t` in epoch-ms en `offset` in seconden.

## Back-ups tussen apparaten

- Bestandsnaam `watchrate-<apparaat>-JJJJ-MM-DD-UUMM.json`, plus `exportedFrom: { device, at }` in de JSON (overleeft hernoemen). Apparaatnaam aanpasbaar onder de back-upknoppen; de Viewer toont apparaat en tijd op de bestandschip.
- Herstellen opent een paneel met per horloge wat de back-up toevoegt/verwijdert. Standaard Samenvoegen; "Alles vervangen" is secundair (gestippeld, met bevestiging).
- Samenvoegen op id. Toevoegen en verwijderen tellen; bewerken bestaat niet in de UI, dus geen "laatst bewerkt wint".
- Verwijderingen: `state.deleted = { id: ms }`. Elke verwijderknop (horloge, meting, timegrapher-sessie, gangreserve-historie, voorbeelden wissen) moet `WatchData.markDeleted`/`markWatchDeleted` aanroepen, anders komt het item terug bij samenvoegen. Lopende gangreservemeting zonder id: `"pr:<start>"` bij opslaan of verwerpen.
- Items zonder id (oude voorbeelddata) krijgen een id uit hun inhoud (`ensureIds`), zodat ze op elk apparaat gelijk zijn.
- Delen-knop via Web Share API, alleen zichtbaar als de browser bestanden kan delen; bij een fout (geen annulering) valt hij terug op downloaden.

## Homepage en Live Clock

- Site is tool-gericht; café-inhoud staat onder `/cafe/`.
- Eén kolom op de breedte van de menubalk (980 px): klokpaneel vult de breedte, wereldklok op één rij van negen (3×3 onder 940 px), vier tegels naast elkaar (2×2 onder 860 px, onder elkaar onder 520 px).
- Tegeliconen zijn inline SVG-lijniconen in `currentColor` (accentkleur), geen emoji.
- Kopstijl overal gelijk: titel links, 30 px/800 in accentkleur, subtitel 14 px, 4 px ertussen. Andere pagina's zetten die bovenin hun kaart; de homepage op de linkerrand van de kolom.
- Alle pagina's gebruiken dezelfde kolom als de menubalk: 948 px inhoud (980 px min 16 px padding), linkerrand gelijk met het logo.
- Lopende tekst blijft leesbaar smal binnen die kolom: Guide (zijbalk 190 px met meelopende inhoudsopgave + tekst 680 px), Privacy (tekst 720 px, slotsecties in twee kolommen), Glossary (begrippen in twee alfabetische kolommen), Café (welkom/onderwerpen naast een kolom van 320 px met de volgende datum, verslagen als raster van twee kaarten). Onder ~720–760 px valt alles terug op één kolom.
- Sectie-iconen (homepage-tegels, Guide) zijn SVG-lijniconen in `currentColor`, geen emoji.
- Taalkeuze alleen via de menubalk; pagina's luisteren naar het `swclang`-event.
- LED-klok: geen achtergrondvlakje per cijfer; onverlichte segmenten blijven zwak zichtbaar (`opacity:.28`).
- Wereldklok: San Francisco, New York, London, Cluj, Pune, Da Nang, Suzhou, Singapore, Sydney, met UTC-offset op halfuur-precisie.
- Live Clock staat op de homepage: zeven-segment LED, schaalt mee, lokale systeemtijd. Het paneel is geen link meer.
- Naast de datum twee knoppen in datumvak-stijl en accentkleur: links de 10-secondentik (bij elke paginalading uit, want browsers staan geluid pas na een klik toe; daarom niet in localStorage), rechts schermvullend via de Fullscreen-API (verborgen waar dat niet kan, zoals op iPhone).
- De Amsterdam-regel van de oude klokpagina is bewust niet meegenomen.

## Café-pagina

- Rechterkolom: blok "Next Café" met daaronder "Other watch events". Evenementen staan bewust alleen hier (Benelux-publiek), niet op de tool-gerichte homepage.
- Next Café (`meetings.js`): datumtegel (maand/dag/weekdag), volledige datum + tijd (dubbele datum is bewust), "Sioux Labs · during the Vrijmibo", pil "26 days to go", daaronder de vaste regel "every last Friday". Tijden in Europe/Amsterdam.
- Optioneel thema per meeting in `meetings.txt`: `YYYY-MM-DD HH:MM | EN | NL`. Met `;` wordt het een lijst ("On the table" / "Op tafel"), anders label "Theme". NL valt terug op EN. Zonder thema geen themavlak.
- Other watch events (`events.js`): `events.txt` met `datum[..einddatum] | naam | plaats | link`. Voorbije evenementen verdwijnen; vier zichtbaar, rest achter gestippelde "Show N more"; jaartal-scheiding vanaf een volgend jaar; "today/tomorrow/in N days" binnen twee weken. Sectie verborgen als er niets komt.
- Scripts staan met `?v=N` in de pagina; ophogen bij een wijziging zodat bezoekers geen oude versie uit de cache halen.

## Watch Rate Meter

- Gang in s/dag via lineaire regressie over offsetmetingen. Horloges worden hier aangemaakt.
- Meten: groene "jouw horloge"-klok met ▲/▼ gelijkzetten, dan vastleggen. Hele seconden; tik-sync is bewust verwijderd.
- "Nieuwe start" is een handmatige checkbox. Geen automatische gat-detectie.
- Sessies worden afgeleid uit nieuwe-start-vlaggen (datastructuur ongewijzigd). Pulldown boven de grafiek bij >1 sessie, standaard de laatste, plus "Alle sessies" en "Alle sessies, zonder tussenpozen" (`allc`: sessies als aaneengesloten blokken op de tijd-as met gestippelde breuklijn).
- Rate- en offsetgrafiek delen dezelfde tijd-as.
- Timegrapher: "Timegrapher-sessie toevoegen" opent een grid (positie, gang, optioneel amplitude en beat error); posities van de vorige sessie staan klaar. Toont ruitjes in de grafiek, drie vergelijkingskaartjes en een sessielijst.
- Sample-data: Omega Speedmaster '69 op precies +1,969 s/dag (maanlanding-easter-egg), Tudor Black Bay 58 met reset en twee sessies (+7,2 en −4,5), Casio A300U als kwarts-referentie.

## Backup Viewer

- Laadt één of meer JSON-backups; geladen bestanden blijven in localStorage.
- LED-gangweergave in DSEG7 Bold (base64 ingebed uit npm `dseg`).
- Dezelfde sessie-pulldown als de Rate Meter; geen pulldown bij één sessie. Ook "Alle sessies, zonder tussenpozen" (`allc`): elke sessie een eigen blok op de tijd-as, dode tijd ertussen weggesneden (gestippelde scheidingslijn), regressielijn per sessie.
- Grafieken: offset in de tijd en gang in de tijd. Gangpunten zoals op de Rate Meter: opeenvolgende metingen ≥ 6 uur uit elkaar, stip op het eindpunt van het interval (dus meestal bij de tweede meting), lijn breekt bij een nieuwe start, timegrapher-ruitjes erbij.
- Per-positie-gang met spreiding, offsetgrafiek met regressielijn, timegrapher-data, merge-toggle, sorteren, demo-modus.
- "Zo werkt het"-gids alleen in de lege toestand, terug te halen via `?`.

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
- Liever expliciete, door de gebruiker gezette vlaggen dan automatische detectie.
- Geen volledige DOM-rebuild op input-events (sloot de iOS-tijdkiezer).
- `applyStatic()` niet laten draaien nadat `renderStart()` elementen heeft vervangen.
- Eerdere bugs om op te letten: segment-dimming-CSS, viewer die reset-vlaggen negeerde, klok buiten beeld op mobiel.

## Open punten

- [x] Oude `viewer.html` in de root verwijderd (commit b46e201); `watchrate/viewer.html` is de enige viewer.
- [ ] Beslissen of een lichtere, beter leesbare variant nog gewenst is, nu alle thema's donker zijn.
