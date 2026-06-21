# Arkivet — Mordgåtor

**Arkivet** är programmet i Mordgåtor-projektet: ett digitalt utredningsarkiv för
mordgåtor och detektivfall. Spelledare (GM) och spelare får tillgång till
dokument, foton, förhörsprotokoll och bevis och löser fallet genom att analysera
materialet — inte genom poäng eller quiz.

Byggt som en installerbar webbapp. Laptop-först i nuläget; layouten är förberedd
för responsiv mobilanvändning senare.

## Tech stack

Vue 3 (Composition API) · TypeScript (strict) · Vite · vue-router (hash-läge) ·
Tailwind CSS v4 · vite-plugin-pwa (installerbarhet). Ingen backend/databas/auth.

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver
npm run build      # typecheck (vue-tsc) + produktionsbygge → dist/
npm run preview    # förhandsgranska produktionsbygget
npm run typecheck  # bara typkontroll
```

## Arkitektur

- **`src/types/caseTypes.ts`** — alla typer och service-interface. Kanonisk här.
- **`src/services/`** — `caseService` (läser fall, filtrerar på akt/`gmOnly`/`playerVisible`)
  och `sessionService` (bygger/parsar spelarlänkar ur URL). **UI importerar aldrig
  JSON direkt** — allt går via service-lagret, så lokal JSON kan bytas mot ett API.
- **`src/components/material/`** — en renderare per materialtyp.
- **`src/views/`** — GM:s fallväljare + dashboard, samt spelarvyn.

Routes (hash): `/` → välj fall · `/case/:caseId/gm` → GM · `/case/:caseId/player?act=N` → spelare.

## Innehåll

Fallinnehåll skapas i den separata källmappen (`Mordgåtor assets`, där Claude
Cowork arbetar). Det är **work-in-progress** och påverkar aldrig det som är live.
När ett fall är färdigt förs det in hit — Arkivets egna `src/data/cases/` +
`public/` är den enda källan som byggs och deployas.

Överföring sker med:

```bash
npm run sync-content            # alla fall
npm run sync-content case-demo  # ett specifikt fall
```

Skriptet kopierar fallets JSON till `src/data/cases/` och dess bilder/ljud till
`public/`. Saknas en bildfil visas en platshållare. Källmapp styrs med `CONTENT_DIR`.

Det `case-demo` som ligger här nu är en **byggställning** (platshållardata) tills
det första riktiga fallet är klart i källmappen.

## Deploy

Push till `main` → GitHub Actions bygger och publicerar till GitHub Pages:
**https://onetwo0ne.github.io/mordgator-arkivet/**. `base` i `vite.config.ts`
måste matcha repo-namnet (`mordgator-arkivet`).
