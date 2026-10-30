# watchcafe.eu — logboek van wijzigingen

Samengesteld op 30 oktober 2026 uit de git-geschiedenis (182 commits).
Tot 29 september veelal "Add files via upload" (gebouwd in de claude.ai-chat, geüpload via GitHub); vanaf 1 oktober via Claude Code met beschrijvende commits.
Kleine tekst- en datumwijzigingen van de café-pagina zijn samengevoegd.

## Maart–april 2026: de café-site

- **28 mrt** Eerste site "Sioux Watch Café": één pagina met logo, volgende datum, CNAME.
- **7–8 apr** Opmaak en eerste café-verslag (cafe-log).
- **7 mei** Volgende datum bijgewerkt.

## Mei–juni 2026: klok en eerste Rate Meter

- **31 mei** Live klok op de homepage, LED-stijl met animaties.
- **1–2 jun** Contact-adres in de footer.
- **5 jun** Aparte klokpagina, LED-kleuren en gloed aangepast.
- **7 jun** Domein van watchcafe.nl naar **watchcafe.eu**.
- **12 jun** 10-secondentik (geluid aan/uit) bij de klok. Eerste versie van de **Watch Rate Meter**, met hulpknop en uitleg; site-taal Engels.

## Juli 2026: tools worden een toolset

- **5 jul** Rate Meter met twee grafieken (offset en gang) en een "nieuwe start"-vlag per meting. Gedeelde menubalk (`nav.js`) en eerste **Backup Viewer**. Donkere site met countdown naar het volgende café; verslagen in `cafe-log.txt`.
- **6 jul** **Glossary**, wereldklok-tijdzones, timegrapher-gegevens in de Rate Meter; homepagetegel voor de Glossary.
- **7 jul** **Privacy**-pagina; voorbeeldhorloges (Speedmaster, Black Bay, Casio A300U); opmaak.
- **9–10 jul** Eerste versie van **Power Reserve**.
- **15 jul, 9 aug** Café-datums bijgewerkt.

## September 2026: hub, guide en thema's

- **9 sep** Meetsessies in de Rate Meter afzonderlijk te bekijken (sessie-pulldown); bijwerkingen klok en Power Reserve.
- **10 sep** **Guide** (handleiding per tool).
- **12–13 sep** Homepage wordt de hub **"Watch Tools"**; café-inhoud verhuist naar `/cafe/`. Favicon (klokje op 10:10).
- **18–25 sep** Wereldklok-strip op de homepage met UTC-offsets; Backup Viewer krijgt sessies, gedeelde tijd-as en per-positie-cijfers; Rate Meter-verfijningen.
- **26–29 sep** **Thema's** over de hele site (`theme.css`, keuze in het menu); Pepsi-thema bijgesteld (later vervangen door Day-Date).

## Oktober 2026 (Claude Code)

**1 okt**
- Oude `viewer.html` in de root verwijderd; projectcontext in `.claude/CLAUDE.md`.
- Viewer: gang-in-de-tijd-grafiek en "Alle sessies, zonder tussenpozen". Hetzelfde aaneengesloten sessie-overzicht in de Rate Meter.

**3 okt** — homepage
- Klok en tegels op de breedte van de menubalk; SVG-lijniconen i.p.v. emoji; kop links in de gedeelde kopstijl.
- LED-klokken zonder vlakje per cijfer.
- Tik- en schermvullend-knop naast de datum; klokpagina wordt doorverwijzing naar de homepage.

**4 okt** — layout, back-ups, café
- Alle pagina's op 948 px; Glossary in twee kolommen, Guide met meelopende inhoudsopgave, Privacy met slotsecties naast elkaar, Café met volgende datum naast het welkom.
- Back-ups: apparaatnaam in bestand en JSON, **samenvoegen** bij herstellen met onthouden verwijderingen, **Delen**-knop.
- Café: nieuw "Next Café"-blok met datumtegel en optioneel thema; lijst **Other watch events**.
- Thema **Dark Side**.

**6 okt** — legenda in `theme.css` (PR #1).

**12 okt** — grafieken in Rate Meter en Viewer op echte pixelmaat (leesbare as-labels); Viewer-grafieken naast elkaar op brede schermen.

**13 okt**
- Hoofdknoppen en actieve chips getint i.p.v. vol.
- Voorbeelddata: Seamaster 300M, derde Black Bay-sessie, gangreservehistorie, vintage Ancre 17 Jewels; gedeeld tussen Rate Meter en Viewer (`sample.js`).
- **Printbaar rapport** (PDF via printvenster), ook vanuit de Viewer voor geladen back-ups.

**15 okt**
- Rate Meter: horlogekeuze als pulldown, actief horloge in elke sectiekop, minimumbereik voor vlakke grafieken, crash zonder metingen opgelost.
- Timegrapher-metingen ook in tabellen als ruitje.
- Blok **"Your data"** met back-upstatus en herinneringen.
- Rapport: kiezen welke horloges (en bronnen) erin komen.

**18 okt** — merknaam **watchcafe.eu** buiten de café-pagina; menu: tools eerst, Watch Café achteraan.

**27 okt**
- Rate Meter: "Saved"-bevestiging, timegrapher-knoplabel hersteld na opslaan/annuleren.
- Homepageklok toont de **echte tijd**, gecorrigeerd met de serverklok.
- Glossary wordt een tab van de Guide.
- Nieuwe pagina **Collection**: overzicht, gegevens, hernoemen en verwijderen per horloge; **logboek** per horloge; **"Wearing today"** met tab Worn.
- Back-up en herstel verhuizen naar de Collection.

**28 okt** — Viewer heet overal "Backup Viewer", balk opgeschoond. Rapport met gegevens, logboek en draagdagen per horloge.

**29 okt** — Rapport: één instellingenkader op paginabreedte, tabellen die op het papier passen. Café-datums bijgewerkt.

**30 okt** — Rapport: Details als duidelijk blok met draagdagen erin. Back-upformaat volledig beschreven in de projectnotities.
