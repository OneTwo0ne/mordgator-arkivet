# Mordgåtor — Claude Code Instruktioner

## Vad detta projekt är

En webbaserad plattform för mordgåtor och detektivfall. Målet är att skapa ett **digitalt utredningsarkiv** — inte ett spel. Spelarna får tillgång till dokument, fotografier, förhörsprotokoll och bevis, och analyserar materialet självständigt för att lösa ett mordfall.

Tänk: digital kriminalakt, inte quiz, inte escape room, inte poängbaserat spel.

---

## Arbetsdelning

- **Claude Code (du):** Bygger all kod — komponenter, routing, service-lager, layout, styling.
- **Claude Cowork:** Skapar allt innehåll — JSON-filer med fall, karaktärer, material, ledtrådar, lösningar.

Du ska aldrig behöva skapa spelinnehåll. Det finns redan i `src/data/cases/`.

---

## Tech stack — använd exakt detta

| Verktyg | Val | Anledning |
|---|---|---|
| Framework | Vue 3 (Composition API) | Beslutat |
| Språk | TypeScript (strict) | Beslutat |
| Build | Vite | Beslutat |
| Routing | vue-router 4, **hash-läge** | GitHub Pages kräver hash-routing |
| Styling | Tailwind CSS | Beslutat |
| Typkontroll | vue-tsc | Beslutat |
| Hosting | GitHub Pages (publikt repo) | Beslutat |
| Backend | **Ingen i MVP** | Beslutat |
| Databas | **Ingen i MVP** | Beslutat |
| Auth | **Ingen i MVP** | Beslutat |

**Hash-routing är obligatoriskt.** Använd `createWebHashHistory()` i vue-router, inte `createWebHistory()`. GitHub Pages stöder inte client-side history routing.

---

## Projektstruktur

```
src/
  types/
    caseTypes.ts          ← Färdig. Rör inte utan instruktion.
  data/
    cases/
      case-demo.json      ← Färdig. Innehållsfil, rör inte.
  services/
    caseService.ts        ← Du bygger detta
    sessionService.ts     ← Du bygger detta
  components/
    common/               ← Delade komponenter (knappar, layout, etc.)
    gm/                   ← GM-specifika komponenter
    player/               ← Spelar-specifika komponenter
    material/             ← Renderare för olika materialtyper
  views/
    gm/
      GMCaseSelectView.vue
      GMDashboardView.vue
    player/
      PlayerCaseView.vue
  router/
    index.ts
  App.vue
  main.ts
assets/
  cases/
    case-demo/
      images/
      audio/
      documents/
public/
  (statiska filer som kopieras direkt)
```

---

## Typdefinitioner

Alla typer finns i `src/types/caseTypes.ts`. Importera därifrån. Skapa inga egna typer som duplicerar dessa.

Kärntyper att känna till:

```typescript
Case           // Hela fallet
Act            // En spelomgångs-fas (1, 2, 3...)
MaterialItem   // Ett enskilt stycke material (dokument, foto, förhör, etc.)
Character      // En person i fallet
Evidence       // Ett bevisföremål
Clue           // En ledtråd (kuvert-modellen)
Solution       // Lösningen på fallet
GMNote         // Spelledaranteckning
GameSession    // Spelets tillstånd (URL-baserat i MVP)
ICaseService   // Interface som caseService.ts ska implementera
ISessionService // Interface som sessionService.ts ska implementera
```

---

## Service-lager — viktig arkitekturprincip

**UI-komponenter ska aldrig importera JSON direkt.**

All data ska gå via service-lagret. Anledningen är att vi senare enkelt ska kunna byta lokal JSON mot ett API eller Firebase utan att röra UI-koden.

### caseService.ts

Implementerar `ICaseService` från `caseTypes.ts`.

I MVP: läser lokala JSON-filer via dynamisk import eller statisk import.
Senare: samma interface, men hämtar från API.

```typescript
// Exempel på hur den ska fungera:
const cases = await caseService.getAllCases()
const fullCase = await caseService.getCase('case-demo')
const material = await caseService.getMaterialForAct('case-demo', 2, false)
// false = spelarvy, true = GM-vy (inkluderar gmOnly-material)
```

Viktigt: `getMaterialForAct`, `getCharactersForAct`, `getEvidenceForAct` ska filtrera baserat på:
1. `actAvailability` — innehåller aktuellt aktnummer?
2. `gmOnly` — om `gmMode === false`, filtrera bort allt med `gmOnly: true`
3. `playerVisible` — om `gmMode === false`, filtrera bort allt med `playerVisible: false`

### sessionService.ts

Implementerar `ISessionService` från `caseTypes.ts`.

I MVP: bygger och parsar URL:er med case-id och act-nummer. Inga serverskrivningar.

```typescript
// Skapar en spelarlänk:
// /#/case/case-demo/player?act=2
sessionService.createPlayerLink('case-demo', 2)

// Parsar aktuell URL och returnerar session:
const session = sessionService.parseSessionFromUrl()
// { caseId: 'case-demo', currentAct: 2, startedAt: '...' }

// Hämtar bara aktnumret:
const act = sessionService.getCurrentAct() // 2
```

---

## Routing

Alla routes ska använda hash-läge. Sätt `createWebHashHistory()`.

```typescript
// Exempel på routes:
'/'                                    → GMCaseSelectView (välj fall)
'/case/:caseId/gm'                     → GMDashboardView (GM-vy)
'/case/:caseId/player'                 → PlayerCaseView (spelares vy, läser act från ?act=N i query)
```

GM-vyn och spelar-vyn är separata routes. Det finns ingen auth — GM-vyn är tillgänglig för alla som navigerar dit. Det är acceptabelt i MVP.

---

## GM-vyn — vad den ska göra

GM (Game Master / spelledare) öppnar appen och ser GM-gränssnittet.

### GMCaseSelectView
- Listar tillgängliga fall (hämtar via `caseService.getAllCases()`)
- Visar titel, tagline, svårighetsgrad, estimerad tid
- Klickar man på ett fall → navigerar till GMDashboardView

### GMDashboardView
- Visar fallöversikt (titel, setting, beskrivning)
- Visar aktväljare: GM väljer vilken akt spelarna befinner sig i (1, 2, 3...)
- Visar en "Kopiera spelarlänk"-knapp som kopierar spelarlänken för vald akt till clipboard
- Visar allt material, inklusive GM-only-material (förhörsprotokoll med motiv, GM-noteringar, lösning)
- Har en tydlig sektion för GM-noteringar (`gmNotes`) filtrerade på aktuell akt
- Har en sektion för lösningen (kan fällas ut/döljas)
- Visar karaktärer inkl. deras `motive` och `gmOnly`-fält

**Viktigt:** GM-vyn ska tydligt visuellt skilja sig från spelar-vyn. Använd t.ex. en diskret "GM-läge"-indikator.

---

## Spelar-vyn — vad den ska göra

Spelarna öppnar länken GM skickade: `/#/case/case-demo/player?act=2`

### PlayerCaseView
- Läser `caseId` från route params och `act` från query params
- Hämtar material via `caseService.getMaterialForAct(caseId, act, false)`
- Filtrerar bort allt `gmOnly: true` och `playerVisible: false`
- Visar materialet grupperat efter typ (alternativt: kronologisk lista)
- Visar karaktärer (utan `motive`, utan `gmOnly`-fält)
- Visar bevis tillgängliga i denna akt
- Visar ledtrådar som "stängda kuvert" — spelarna klickar aktivt för att öppna dem
- Har **ingen** indikation på vilken akt som är "nästa" — systemet styr inte spelarna
- Har en "Visa lösning"-knapp längst ner (dold bakom bekräftelsedialog)

---

## Materialrendering

Olika materialtyper ska renderas på rätt sätt. Skapa komponenter i `src/components/material/`:

| Typ | Komponent | Rendering |
|---|---|---|
| `document`, `police-report`, `letter`, `note` | `TextMaterialViewer.vue` | Förformaterad text, typsnittsval som liknar maskinskriven text |
| `testimony` | `TestimonyViewer.vue` | Förhörsformat: fråga/svar-layout |
| `photo`, `image` | `ImageViewer.vue` | Bildbetraktare med bildtext |
| `audio` | `AudioPlayer.vue` | Enkel HTML5 audio-spelare |
| `forensic`, `financial` | `DocumentViewer.vue` | Formell dokumentlayout |

Alla materialkomponenter tar emot en `MaterialItem` som prop.

---

## Ledtrådar (kuvert-modellen)

Ledtrådar ska se ut och bete sig som förseglade kuvert.

- Visa: `clue.title` och `clue.hint` (synliga utan att öppna)
- En "Öppna ledtråd"-knapp — kräver aktiv handling av spelarna
- När öppnad: visa `clue.content`
- Om `clue.isEmergencyOnly === true`: visa en tydlig markering, t.ex. "Nödhjälp — öppna bara om ni kört fast"
- En öppnad ledtråd ska förbli öppen (använd komponentens lokala state eller localStorage)

---

## Lösningsvyn

- Nås från spelar-vyn via "Visa lösning"-knapp
- Bekräftelsedialog: "Är ni säkra? Lösningen avslöjar vem som är skyldig."
- Visar: gärningsperson (namn), motiv, metod, händelseförlopp (timeline), centrala bevis, vilseledande spår, viktiga detaljer
- Visar hela `solution.fullNarrative`

---

## Designprinciper — estetik

Plattformen ska kännas som ett **digitalt utredningsarkiv från sent 1980-tal**, inte ett modernt webb-app.

- Färgpalett: neutrala toner — off-white, ljusgrå, mörkgrå, svart. Undvik färgglada accenter.
- Typografi: Sans-serif för navigation/UI, serif eller monospace för dokumentinnehåll
- Inga animationer eller transitions utöver diskreta fade-ins
- Inga spelifierade element: inga poäng, inga achievements, inga framstegsmarkörer
- Inga ikoner som ser ut som spelknappar
- Känsla: lugn, seriös, informationstät men läsbar

---

## Vad som INTE ska byggas i MVP

- Ingen inloggning, inga konton
- Ingen backend, ingen databas, ingen server
- Ingen realtidsuppdatering av spelarens vy (GM skickar ny länk manuellt)
- Inga spelaranteckningar i appen
- Ingen case-editor
- Ingen statistik eller spelhistorik
- Inga notifications
- Ingen mobiloptimering (appen är för laptop)
- Ingen dark mode
- Inga betalfunktioner

---

## GitHub Pages — deployment

Appen hostas på GitHub Pages. Det kräver:

1. `vite.config.ts`: sätt `base` till `'/<repo-name>/'` (eller `'/'` om custom domain)
2. `vue-router`: använd `createWebHashHistory()`, aldrig `createWebHistory()`
3. Build-kommando: `npm run build` → genererar `dist/`
4. GitHub Pages: peka på `dist/`-mappen eller använd GitHub Actions för automatisk deploy

---

## Hur du börjar

1. Skapa Vue 3 + Vite + TypeScript-projekt: `npm create vite@latest . -- --template vue-ts`
2. Installera beroenden: `npm install vue-router@4 tailwindcss @tailwindcss/vite`
3. Konfigurera Tailwind (följ officiell Vite-guide)
4. Sätt upp hash-routing i `src/router/index.ts`
5. Implementera `caseService.ts` och `sessionService.ts` mot interfacen i `caseTypes.ts`
6. Bygg GM-vyer, sedan spelar-vyer
7. Bygg materialrenderare

Börja alltid med service-lagret. Bygg inte UI förrän du kan hämta data korrekt från caseService.

---

## Testfall

Testfallet heter `case-demo` och finns i `src/data/cases/case-demo.json`. Det är ett komplett mordgåtefall med:
- 5 karaktärer (1 offer, 3 misstänkta, 1 vittne)
- 3 akter
- 15+ materialbitar av olika typer
- 7 bevisföremål
- 3 ledtrådar
- 1 komplett lösning med händelseförlopp

Använd detta fall som referens för all komponentutveckling.

---

## Frågor och oklarheter

Om något i specifikationen är oklart: fråga innan du implementerar. Det är bättre att pausa en minut än att bygga fel riktning.
