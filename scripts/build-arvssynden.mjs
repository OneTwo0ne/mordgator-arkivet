#!/usr/bin/env node
/**
 * build-arvssynden.mjs — bygger arvssynden.json från Coworks källmaterial.
 *
 * Läser materialtexterna (spelarversioner) och bilderna ur innehållskällan och
 * sätter ihop ett schema-korrekt Case (caseTypes.ts). Kopierar även bilderna
 * till public/ med ASCII-säkra filnamn.
 *
 * Källa: <CONTENT_DIR>/cases/arvssynden/v1.0/  (default: ../Mordgåtor assets)
 *   material/spelare/*.md  — spelarsynlig text per material
 *   material/foton/*       — foton + porträtt (Coworks strukturerade mapp)
 *
 * Kör: node scripts/build-arvssynden.mjs
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PWA_ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR =
  process.env.CONTENT_DIR ?? path.resolve(PWA_ROOT, '..', 'Mordgåtor assets')
const CASE_DIR = path.join(CONTENT_DIR, 'cases', 'arvssynden', 'v1.0')
const SPELARE_DIR = path.join(CASE_DIR, 'material', 'spelare')
const FOTON_DIR = path.join(CASE_DIR, 'material', 'foton')
const DEST_JSON = path.join(PWA_ROOT, 'src', 'data', 'cases', 'arvssynden.json')
const DEST_IMG = path.join(PWA_ROOT, 'public', 'cases', 'arvssynden', 'images')

const IMG = (file) => `cases/arvssynden/images/${file}`
const actsFromLevel = (lvl) => (lvl === 1 ? [1, 2, 3] : lvl === 2 ? [2, 3] : [3])

// ── filuppslag som tål å/ä/ö och NFC/NFD ──────────────────────────────
async function dirIndex(dir) {
  const entries = await fs.readdir(dir)
  const map = new Map()
  for (const e of entries) map.set(e.normalize('NFC'), e)
  return map
}
function lookup(index, name) {
  return index.get(name.normalize('NFC'))
}

// ── materialdefinitioner (innehåll läses från fil; metadata här) ──────
// type: schema-typ · lvl: nivå (1/2/3) → actAvailability
const TEXT_MATERIALS = [
  { id: 'mat-polisrapport-01', type: 'police-report', title: 'Polisrapport — initial', lvl: 1 },
  { id: 'mat-brottsplats-01', type: 'document', title: 'Brottsplatsbeskrivning', lvl: 1, ev: ['ev-skrivbordshorn'] },
  { id: 'mat-kriminalteknisk-01', type: 'forensic', title: 'Kriminalteknisk platsdokumentation', lvl: 1, ev: ['ev-skrivbordshorn', 'ev-prismat'] },
  { id: 'mat-personlista-01', type: 'document', title: 'Personlista', lvl: 1 },
  { id: 'mat-kameralog-01', type: 'document', title: 'Kameralog — entré', lvl: 1, ev: ['ev-kameralog'] },
  { id: 'mat-forhör-reza-01', type: 'testimony', title: 'Förhör — Reza Tehrani (initialt)', lvl: 1, ch: ['char-reza'] },
  { id: 'mat-forhör-erik-01', type: 'testimony', title: 'Förhör — Erik Sandström (initialt)', lvl: 1, ch: ['char-erik'] },
  { id: 'mat-forhör-joakim-01', type: 'testimony', title: 'Förhör — Joakim Wester (initialt)', lvl: 1, ch: ['char-joakim'] },
  { id: 'mat-forhör-lena-01', type: 'testimony', title: 'Förhör — Lena Björk (initialt)', lvl: 1, ch: ['char-lena'] },
  { id: 'mat-forhör-petra-01', type: 'testimony', title: 'Förhör — Petra Holm (initialt)', lvl: 1, ch: ['char-petra'] },
  { id: 'mat-forhör-marcus-01', type: 'testimony', title: 'Förhör — Marcus Ek', lvl: 1, ch: ['char-marcus'] },

  { id: 'mat-prelim-rmv', type: 'forensic', title: 'Preliminärt rättsmedicinskt utlåtande', lvl: 2, ev: ['ev-rmv'] },
  { id: 'mat-forhör-reza-02', type: 'testimony', title: 'Uppföljningsförhör — Reza Tehrani', lvl: 2, ch: ['char-reza'], ev: ['ev-reza-obs'] },
  { id: 'mat-forhör-erik-02', type: 'testimony', title: 'Uppföljningsförhör — Erik Sandström', lvl: 2, ch: ['char-erik'] },
  { id: 'mat-forhör-joakim-02', type: 'testimony', title: 'Uppföljningsförhör — Joakim Wester', lvl: 2, ch: ['char-joakim'] },
  { id: 'mat-forhör-lena-02', type: 'testimony', title: 'Uppföljningsförhör — Lena Björk', lvl: 2, ch: ['char-lena'] },
  { id: 'mat-forhör-thomas-01', type: 'testimony', title: 'Förhör — Thomas Lindqvist', lvl: 2, ch: ['char-thomas'] },
  { id: 'mat-forhör-maja-01', type: 'testimony', title: 'Förhör — Maja Lindgren', lvl: 2, ch: ['char-maja'] },
  { id: 'mat-datorlogg-erik', type: 'document', title: 'Datorlogg — Erik Sandström', lvl: 2, ch: ['char-erik'], ev: ['ev-datorlogg'] },
  { id: 'mat-datorlogg-katarina', type: 'document', title: 'Datorlogg — Katarina Wester', lvl: 2, ch: ['char-katarina'] },
  { id: 'mat-samtalslogg-erik', type: 'document', title: 'Samtalslogg — Erik Sandström', lvl: 2, ch: ['char-erik'] },
  { id: 'mat-samtalslogg-joakim', type: 'document', title: 'Samtalslogg — Joakim Wester', lvl: 2, ch: ['char-joakim'] },
  { id: 'mat-bankutdrag-arvestum', type: 'financial', title: 'Ekonomiskt underlag — Arvestum Consulting AB', lvl: 2, ch: ['char-erik', 'char-katarina'], ev: ['ev-arvestum'] },
  { id: 'mat-kalender-katarina', type: 'document', title: 'Katarinas kalender', lvl: 2, ch: ['char-katarina'], ev: ['ev-kalender'] },

  { id: 'mat-brev-enell', type: 'letter', title: 'Brev från advokat Jonas Enell', lvl: 3, ch: ['char-katarina', 'char-maja'], ev: ['ev-enell'] },
  { id: 'mat-arvestum-mapp', type: 'document', title: 'Dokumentmapp — Arvestum', lvl: 3, ch: ['char-erik', 'char-katarina'], ev: ['ev-arvestum'] },
  { id: 'mat-handskar-01', type: 'forensic', title: 'Teknisk analys — plasthandskar', lvl: 3, ev: ['ev-handskar'] },
  { id: 'mat-prismat-teknisk', type: 'forensic', title: 'Teknisk analys — kristallprismat', lvl: 3, ev: ['ev-prismat'] },
]

// Foton (innehåll = bildtext här; bild kopieras separat). Fotografi 3 = nyckelledtråd.
const PHOTO_MATERIALS = [
  {
    id: 'mat-planritning', type: 'photo', title: 'Planritning — plan 4', lvl: 1, img: 'planritning.png',
    content: '[Planritning — Lindqvist & Wester KB, plan 4, Birger Jarlsgatan 42]\nKatarinas hörnkontor i sydvästra hörnet. Kopieringsrummet i västra flygeln. Central korridor med reception. Hiss och trapphus. Östra flygeln (där städaren Reza befann sig) skild från den västra av korridoren.',
  },
  {
    id: 'mat-foto-brottsplats-01', type: 'photo', title: 'Foto — arbetsrummet, översikt', lvl: 1, img: 'b1-brottsplats.png',
    content: '[Fotografi 1 — Översiktsbild, arbetsrummet]\nTaget från dörröppningen mot söder. Skrivbordet i bildens mitt, offret synlig på golvet framför det. Bokhyllorna längs höger vägg. Persienner halvt nedfällda. Taklampa och skrivbordslampa tända. Rummet i övrigt ostört. Kristallprismat synligt på bokhyllan i bakgrunden.',
  },
  {
    id: 'mat-foto-brottsplats-03', type: 'photo', title: 'Foto — skrivbordshörnet (närbild)', lvl: 1, img: 'b3-skrivbord.png', ev: ['ev-skrivbordshorn'],
    content: '[Fotografi 3 — Skrivbordshörnet, närbild]\nNärbild på skrivbordets högra hörn, höjdmarkering 74 cm från golvet. Hörnet är rent — inget blod, inga vävnadsrester. Blodspår syns på golvet i bildens nederkant, men inte på hörnet som offret enligt den initiala bedömningen ska ha slagit i.',
  },
  {
    id: 'mat-foto-brottsplats-04', type: 'photo', title: 'Foto — bokhyllan med prismat', lvl: 1, img: 'b4-bokhylla.png', ev: ['ev-prismat'],
    content: '[Fotografi 4 — Bokhyllan närmast fönstret]\nKristallprismat på svart piedestal, ca 20 cm, fasettpipat glas. Anmärkningsvärt ren och fingeravtrycksfri yta. Intill prismatet: diplom och ett inramat foto som bär synligt damm och fingeravtryck. Kontrasten är påfallande.',
  },
  {
    id: 'mat-foto-brottsplats-05', type: 'photo', title: 'Foto — kopieringsrummet, papperskorgen', lvl: 1, img: 'b5-papperskorg.png',
    content: '[Fotografi 5 — Kopieringsrummet]\nPapperskorgen under kopiatorn. Två vita, tunna plasthandskar (stl M) ligger ovanpå övrigt innehåll. De ser till ytan oanvända ut. Numrerad bevismarkör intill.',
  },
]

// Karaktärer (description/alibi = spelarsynligt; motive = GM-only, rensas för spelare)
const characters = [
  {
    id: 'char-katarina', name: 'Katarina Wester', age: 58, occupation: 'Senior partner och delägare, Lindqvist & Wester KB',
    role: 'victim', img: 'portratt-katarina.jpg',
    description: 'En av Stockholms mest respekterade advokater inom arvs- och fastighetsrätt. Metodisk, kompromisslös och intellektuellt skarp — men inte av den typ som väckte värme. Kollegor beskriver henne som rättvis men svår att läsa. Hon levde för jobbet.',
    relationship: 'Offer',
  },
  {
    id: 'char-erik', name: 'Erik Sandström', age: 44, occupation: 'Partner, Lindqvist & Wester KB',
    role: 'suspect', img: 'portratt-erik.jpg',
    description: 'Den på byrån som folk söker sig till när de behöver prata. Han lyssnar, han minns, han frågar upp. Han och Katarina utgjorde byråns kärna — hon med precisionen, han med förmågan att få klienter att känna sig sedda. Verkar genuint förkrossad av hennes död.',
    alibi: 'Uppger att han stannade kvar för att avsluta en inlaga, lämnade byggnaden strax efter halv åtta och körde hem. Hustrun Helena bekräftar att han var hemma vid halv nio och att de åt middag tillsammans.',
    motive: 'GÄRNINGSPERSON. Han och Katarina manipulerade 2019 Anders Lindgrens testamente och förde 4,6 MSEK till skalbolaget Arvestum Consulting. Katarina hade beslutat att bekänna för myndigheterna på måndag. Ett desperat mord för att stoppa sin egen undergång — karriär, familj, frihet.',
    relationship: 'Katarinas protégé i tolv år',
  },
  {
    id: 'char-joakim', name: 'Joakim Wester', age: 53, occupation: 'Fastighetsutvecklare, VD Wester Fastigheter AB',
    role: 'suspect', img: 'portratt-joakim.jpg',
    description: 'Katarinas ex-make, skild 2010 efter sexton år. Affärsmannen som alltid hittar en väg runt ett hinder. Delar äganderätten till en fastighet på Lidingö som hans bolag behöver för ett projekt värt ca 40 MSEK — Katarina ägde 30% och vägrade sälja.',
    alibi: 'Hade möte med fastighetsadvokaten Johan Roos på plan 5 i samma byggnad, avslutade ca 19:45–19:50 och lämnade byggnaden strax efter 20:00. Entrékameran bekräftar utpassering 20:02 — nästan en halvtimme efter Erik.',
    motive: 'RÖD SILL. Visste inte att Katarina jobbade kvar den kvällen och kände inte till Arvestum. Bitter men inte mördare. Hans 8 oredovisade minuter spenderade han i lobbyn — samtalsloggen (22 min med projektledaren) bekräftar resten.',
    relationship: 'Ex-make, pågående fastighetstvist',
  },
  {
    id: 'char-lena', name: 'Lena Björk', age: 49, occupation: 'Junior partner, Lindqvist & Wester KB',
    role: 'suspect', img: 'portratt-lena.jpg',
    description: 'Kom till byrån för nio år sedan med starka meriter och förväntan om att bli delägare. Det har inte hänt — Katarina röstade nej varje gång, med skäl som aldrig riktigt höll. Två dagar innan mordet sa hon i en korridor: "Du kommer att ångra det här."',
    alibi: 'Uppger att hon lämnade kontoret 18:45 (kamerabekräftat), gick på en yogaklass 19:00–20:30 och sedan hem. Instruktören minns henne i klassen.',
    motive: 'RÖD SILL. "Du kommer att ångra det" syftade på att hon tänkte lämna byrån och ta tre klienter med sig. Hon checkade ut från yogan tidigt och satt på Kafé Saturnus och färdigställde sin ansökan till en konkurrerande byrå — en hemlighet hon ville hålla, inte ett mord.',
    relationship: 'Junior partner, blockerad från delägarskap',
  },
  {
    id: 'char-reza', name: 'Reza Tehrani', age: 38, occupation: 'Lokalvårdare, Städproffs AB',
    role: 'witness', img: 'portratt-reza.jpg',
    description: 'Har arbetat på fjärde våningen i fyra år. Känner lokalerna och rytmerna. Fann Katarinas kropp kl. 21:02 och ringde 112. Den enda person som med säkerhet befann sig på våningen under den kritiska tidsperioden.',
    alibi: 'Var i den östra flygeln med hörlurar på under kvällen. Rörelsesensorn loggar honom där 18:58 och 20:44. Passerade Katarinas dörr ca 19:07 och såg ljuset tänt.',
    motive: 'RÖD SILL / NYCKELVITTNE. I augusti 2023 skickade Katarina ett klagomål om städningen som hotade hans kontrakt — ett motiv. Men han hade inget med mordet att göra. Det han vet: ljuset under dörren 19:07 (hon levde) och en man i marinblå kostym mot hissen ca 19:24 (avslöjas i uppföljningsförhör).',
    relationship: 'Städaren på våningen — en av få Katarina hälsade på',
  },
  {
    id: 'char-petra', name: 'Petra Holm', age: 45, occupation: 'Receptionist, Lindqvist & Wester KB',
    role: 'witness', img: 'portratt-petra.jpg',
    description: 'Receptionist i åtta år — byråns informella minne. Hjälpsam och vaksam, lägger märke till saker. Lämnade kontoret 17:28 (kamerabekräftat).',
    alibi: 'Lämnade byggnaden 17:28, långt före mordet.',
    motive: 'VITTNE. Bekräftar att Erik sa att han stannade kvar (17:20). Noterade att Katarina i slutet av september tog emot ett rekommenderat brev som hon signerade själv direkt i receptionen — ovanligt.',
    relationship: 'Receptionist',
  },
  {
    id: 'char-marcus', name: 'Marcus Ek', age: 32, occupation: 'Junior associate, Lindqvist & Wester KB',
    role: 'other', img: 'portratt-marcus.jpg',
    description: 'Junior associate, anställd i två år. Kooperativ och uppriktig. Lämnade kontoret ca 17:45.',
    motive: 'VITTNE. Lade märke till att Katarina och Erik hade ett kort, spänt utbyte på morgonen — "de pratade lågt och Erik stängde Katarinas dörr, vilket var ovanligt."',
    relationship: 'Kollega, ytlig kontakt',
  },
  {
    id: 'char-thomas', name: 'Thomas Lindqvist', age: 71, occupation: 'Grundare och namnpartner (halvpensionerad)',
    role: 'other', img: 'portratt-thomas.jpg',
    description: 'Byråns grundare, på kontoret två dagar i veckan. Var hemma i Djursholm mordkvällen. Sörjer genuint och vill inte tro att något var fel.',
    motive: 'BAKGRUND. Kan bekräfta att Katarinas beteende ändrades i slutet av september — inställda luncher, distraktion. Lämnade Arvestum-ärendet 2019 till Katarina utan att granska det.',
    relationship: 'Grundarpartner, 24 år som kollegor',
  },
  {
    id: 'char-maja', name: 'Maja Lindgren', age: 46, occupation: 'Dotter till Anders Lindgren',
    role: 'other', img: 'portratt-maja.jpg',
    description: 'Dotter till den avlidne klienten Anders Lindgren. Bestämd och fokuserad. Anlitade advokat Jonas Enell för att granska oegentligheter i sin fars dödsbo.',
    motive: 'BAKGRUND / KATALYSATOR. Hennes advokats brev till Katarina i september 2023 var det som fick Katarina att besluta sig för att bekänna — den utlösande händelsen bakom mordet. Hon visste inget om mordet.',
    relationship: 'Arvinge med pågående juridisk process',
  },
]

const evidence = [
  { id: 'ev-skrivbordshorn', title: 'Skrivbordshörnet utan blod', type: 'forensic', actAvailability: [1, 2, 3],
    description: 'Skrivbordshörnet som Katarina enligt den initiala bedömningen ska ha fallit mot är rent — inget blod, inga vävnadsrester. Blodet finns på golvet, inte på hörnet.',
    significance: 'Bevisar att olycksförklaringen inte håller. Mordet var inscenerat.', ch: [] },
  { id: 'ev-prismat', title: 'Kristallprismat (mordvapen)', type: 'physical', actAvailability: [3],
    description: 'Advokatsamfundets hederspris i fasettpipat glas, ca 1,8 kg, från Katarinas bokhylla. Bär mikrorester av hår och vävnad i en spricka längs basen — men saknar helt fingeravtryck.',
    significance: 'Mordvapnet. Frånvaron av fingeravtryck på ett föremål som stod framme visar att det hanterats med handskar.', ch: [] },
  { id: 'ev-handskar', title: 'Plasthandskar i papperskorgen', type: 'physical', actAvailability: [3],
    description: 'Två tunna plasthandskar funna i papperskorgen i kopieringsrummet. DNA på insidan konsistent med en manlig donator. Mikrofragment av kristallglas på insidan av höger handske.',
    significance: 'Direkt koppling mellan bäraren och mordvapnet. Bäraren hanterade prismatet med handskarna.', ch: ['char-erik'] },
  { id: 'ev-datorlogg', title: 'Eriks datoraktivitet', type: 'digital', actAvailability: [2, 3],
    description: 'Söktermer kl. 10:15: "advokatsamfundet anmälan konsekvenser", "whistleblower skydd advokat". Inga dokument sparade under kvällen. Datorn stängdes av manuellt kl. 19:24.',
    significance: 'Visar att Erik kände till anmälningshotet redan på morgonen, att han inte producerade något trots påstått övertidsarbete, och att han var aktiv i byggnaden under mordtidsramen.', ch: ['char-erik'] },
  { id: 'ev-arvestum', title: 'Arvestum Consulting — testamentsbedrägeriet', type: 'financial', actAvailability: [3],
    description: 'Tilläggstestamente (2019) som omdirigerar 4,6 MSEK från Anders Lindgrens dödsbo till skalbolaget Arvestum Consulting AB, bevittnat av Katarina Wester och Erik Sandström. Konsultfakturor 2020–2021.',
    significance: 'Motivet. Erik och Katarina var gemensamma gärningsmän i bedrägeriet 2019.', ch: ['char-erik', 'char-katarina'] },
  { id: 'ev-enell', title: 'Brevet från advokat Enell', type: 'document', actAvailability: [3],
    description: 'Brev från advokat Jonas Enell (29 sep 2023) på uppdrag av Maja Lindgren: oegentligheter i tilläggstestamentet har identifierats och en anmälan till Advokatsamfundet och eventuellt polisen är på väg.',
    significance: 'Förklarar varför Katarina dog just den fredagen — hotet om avslöjande var akut.', ch: ['char-katarina', 'char-maja'] },
  { id: 'ev-kalender', title: 'Kalenderbokning 16 oktober', type: 'document', actAvailability: [2, 3],
    description: 'Katarinas kalender har en bokning: "Möte Advokatsamfundet — förberedelse", den 16 oktober.',
    significance: 'Bekräftar att Katarinas beslut att bekänna var reellt och tre dagar bort när hon mördades.', ch: ['char-katarina'] },
  { id: 'ev-kameralog', title: 'Entrékamerans logg', type: 'document', actAvailability: [1, 2, 3],
    description: 'Erik lämnade byggnaden 19:37, Joakim 20:02. Katarina registrerades aldrig som utpasserad. Erik var sista person från plan 4 medan Katarina ännu levde.',
    significance: 'Placerar Erik i byggnaden under mordtidsramen — men pekar ytligt även mot Joakim, vilket håller den falska teorin vid liv.', ch: [] },
  { id: 'ev-rmv', title: 'Preliminärt rättsmedicinskt utlåtande', type: 'forensic', actAvailability: [2, 3],
    description: 'RMV bedömer dödstidpunkten till mellan 18:30 och 20:30 och noterar att kroppens position (livmorfärgningen) inte är helt konsistent med fyndpositionen — kroppen kan ha förflyttats efter dödsfallet.',
    significance: 'Det första forensiska tecknet på att dödsfallet kanske inte var en enkel olycka.', ch: [] },
  { id: 'ev-reza-obs', title: 'Rezas observation — marinblå kostym', type: 'testimony', actAvailability: [2, 3],
    description: 'I uppföljningsförhör minns Reza en man i mörk marinblå kostym som gick mot hissen ca 19:24. Han såg bara en rygg.',
    significance: 'Erik bar marinblå kostym den dagen. Kopplar honom till tiden och platsen.', ch: ['char-reza'] },
]

const clues = [
  {
    id: 'clue-01', title: 'Skrivbordet',
    hint: 'Handlar om ett fynd på brottsplatsen som de flesta ser men få stannar vid.',
    content: 'Titta noga på fotografiet av skrivbordshörnet (fotografi 3). Kriminalteknikerna flaggade för att det inte finns blod på hörnet — trots att den initiala bedömningen var att Katarina föll och slog huvudet just där. Om det var ett olycksfall, var kom blodet ifrån?',
    actAvailability: [1, 2, 3], isEmergencyOnly: false,
    relatedEvidenceIds: ['ev-skrivbordshorn'],
  },
  {
    id: 'clue-02', title: 'Det låsta skåpet',
    hint: 'Handlar om varför någon inte hade råd att låta Katarina leva till måndag.',
    content: 'Katarinas skrivbord har ett låst underskåp. Nyckeln hängde på insidan av hennes väskficka. Vad hon förvarade där — och vilket brev hon fick i slutet av september — förklarar varför hon dog just den fredag hon dog. Inte olyckan. Inte slumpen. Tidpunkten var inte slumpmässig.',
    actAvailability: [2, 3], isEmergencyOnly: false,
    relatedCharacterIds: ['char-katarina'], relatedEvidenceIds: ['ev-enell', 'ev-arvestum', 'ev-kalender'],
  },
  {
    id: 'clue-03', title: 'En kväll utan arbete',
    hint: 'Handlar om en person i byggnaden som inte gjorde det han uppgav sig göra.',
    content: 'En person stannade kvar på byrån för att avsluta ett arbete. Byråns IT-system visar att han inte sparade ett enda dokument under hela kvällen. Hans dator stängdes av manuellt kl. 19:24, minuter efter att Katarinas datoraktivitet upphörde. Han lämnade byggnaden kl. 19:37. Städaren såg en man i mörk marinblå kostym gå mot hissen vid samma tid. Kameran bekräftar vem som bar marinblå kostym den dagen.',
    actAvailability: [2, 3], isEmergencyOnly: true,
    relatedCharacterIds: ['char-erik'], relatedEvidenceIds: ['ev-datorlogg', 'ev-kameralog', 'ev-reza-obs'],
  },
]

const solution = {
  perpetratorId: 'char-erik',
  motive:
    'Erik Sandström och Katarina Wester manipulerade 2019 Anders Lindgrens testamente och förde 4,6 miljoner kronor till skalbolaget Arvestum Consulting AB. I september 2023 fick Katarina ett brev från arvingen Maja Lindgrens advokat: oegentligheterna hade upptäckts och en anmälan var på väg. Katarina beslutade att gå till myndigheterna på eget initiativ och berättade det för Erik fredagmorgonen den 13 oktober. För Erik innebar hennes bekännelse undergång — karriär, familj och frihet. Det var inte ett rationellt mord utan ett desperat.',
  method:
    'Erik stannade kvar efter att övriga gått, hämtade tunna plasthandskar i kopieringsrummet och gick till Katarinas rum strax efter 19:00. Samtalet blev kort; Katarina upprepade sitt beslut och vände sig mot datorn. Erik lyfte kristallprismatet (ca 1,8 kg) från hyllan bakom henne och slog henne i vänster tinning bakifrån. Sedan arrangerade han scenen som ett fall mot skrivbordshörnet, återplacerade och rengjorde prismatet, lade handskarna i papperskorgen, stängde av datorn 19:24 och lämnade byggnaden 19:37.',
  timeline: [
    { time: '09:25', description: 'Katarina berättar för Erik om sitt beslut att gå till myndigheterna.', characterIds: ['char-katarina', 'char-erik'] },
    { time: '10:15', description: 'Erik söker på byråns dator: "advokatsamfundet anmälan konsekvenser".', characterIds: ['char-erik'] },
    { time: '17:20', description: 'Erik berättar för Petra att han stannar kvar — hon lämnar 17:28.', characterIds: ['char-erik', 'char-petra'] },
    { time: '18:45', description: 'Lena Björk lämnar byggnaden.', characterIds: ['char-lena'] },
    { time: '18:55', description: 'Erik hämtar plasthandskar i kopieringsrummet.', characterIds: ['char-erik'] },
    { time: '19:02', description: 'Erik knackar på Katarinas dörr — hennes sista datoraktivitet.', characterIds: ['char-erik', 'char-katarina'] },
    { time: '19:07', description: 'Reza passerar dörren och ser ljuset — Katarina levde.', characterIds: ['char-reza'] },
    { time: '19:09', description: 'Erik slår Katarina med kristallprismatet.', characterIds: ['char-erik', 'char-katarina'] },
    { time: '19:09–19:22', description: 'Erik arrangerar scenen som ett olycksfall.', characterIds: ['char-erik'] },
    { time: '19:23–19:24', description: 'Erik lämnar handskarna i papperskorgen och stänger av datorn manuellt.', characterIds: ['char-erik'] },
    { time: '19:37', description: 'Erik lämnar byggnaden — Katarina ännu ej utpasserad.', characterIds: ['char-erik'] },
    { time: '20:02', description: 'Joakim Wester lämnar byggnaden.', characterIds: ['char-joakim'] },
    { time: '21:02', description: 'Reza Tehrani hittar kroppen och ringer 112.', characterIds: ['char-reza'] },
  ],
  keyEvidenceIds: ['ev-skrivbordshorn', 'ev-prismat', 'ev-handskar', 'ev-datorlogg', 'ev-arvestum', 'ev-enell', 'ev-kameralog', 'ev-reza-obs'],
  misleadingTrails: [
    'Joakim Wester: i byggnaden, lämnade nästan en halvtimme efter Erik, 40 MSEK-motiv och 8 oredovisade minuter. Oskyldig — visste inte att Katarina var kvar, kände inte till Arvestum, och telefonsamtalet med projektledaren bekräftar tiden.',
    'Lena Björk: offentlig konfrontation ("Du kommer att ångra det"), lämnade yogan 47 minuter för tidigt och dolde ett kafébesök. Oskyldig — hon färdigställde en jobbansökan till en konkurrerande byrå; kortkvitto och personal bekräftar.',
    'Reza Tehrani: enda personen bekräftat på våningen, hittade kroppen, hade ett klagomål hängande som hotade hans försörjning. Oskyldig — rörelsesensor och städtidslinje stämmer, han hade hörlurar på.',
  ],
  importantDetails: [
    'Fotografiet av skrivbordshörnet (foto 3) visar inget blod — hade Katarina fallit naturligt mot hörnet borde blodet finnas där.',
    'Prismatet är anmärkningsvärt fingeravtrycksfritt i ett annars normalt rum.',
    'Eriks dator stängdes av MANUELLT kl. 19:24 — inte via auto-lås. Han var medveten och aktiv.',
    'Katarinas kalender har "Möte Advokatsamfundet" den 16 oktober — mordet skedde tre dagar innan hon tänkte bekänna.',
    'E-postutskriften i Arvestum-mappen (Erik till Katarina, 2019): "Allt klart med L.M. Dokumenten är redo." — Erik var aktiv i planeringen, inte bara medvittne.',
    'Den handskrivna lappen i Arvestum-mappen är Katarinas — hennes uppgörelse med sig själv, inte ett hot.',
  ],
  fullNarrative:
    'Erik Sandström mördade Katarina Wester fredagen den 13 oktober 2023 kl. ungefär 19:09. I maj 2019 hade de gemensamt manipulerat Anders Lindgrens testamente och fört 4,6 miljoner kronor till ett skalbolag de kontrollerade. Katarina var arkitekten, Erik medbrottslingen; pengarna finansierade hans villarenovation i Danderyd. I september 2023 fick Katarina brevet från Jonas Enell. Hon satt med det i två veckor och beslutade sig sedan för att gå till myndigheterna på måndag — och gav Erik möjligheten att göra detsamma. Erik tillbringade fredagen på sitt rum utan att arbeta, sökte på "advokatsamfundet anmälan konsekvenser", och bestämde sig. Strax efter sju hämtade han plasthandskar i kopieringsrummet, gick till Katarinas rum och slog henne med kristallprismatet när hon vände sig mot datorn. Han arrangerade scenen som ett fall, återplacerade prismatet, lade handskarna i papperskorgen, stängde av datorn 19:24 och lämnade byggnaden 19:37. Städaren Reza Tehrani fann henne kl. 21:02. Polisen rubricerade det inledningsvis som ett misstänkt olycksfall.',
}

const gmNotes = [
  { id: 'gm-intro-akt1', title: 'Intro — Akt 1', type: 'instruction', actRelevance: [1],
    content: 'Läs upp vid spelstart:\n\nFredagen den 13 oktober 2023. Kl. 21:02 ringer städaren Reza Tehrani 112 från fjärde våningen på Birger Jarlsgatan 42 i Stockholm. Han har hittat sin kollega Katarina Wester — senior partner på advokatbyrån Lindqvist & Wester KB — liggande livlös på golvet i sitt arbetsrum.\n\nPolisen rubricerar inledningsvis dödsfallet som misstänkt olycksfall. Ni är utredarna. Det är upp till er att avgöra vad som verkligen hände.' },
  { id: 'gm-akt1-stamning', title: 'Stämning & vanliga frågor — Akt 1', type: 'atmosphere', actRelevance: [1],
    content: 'Detta är ett diskretionens fall i en diskretionens miljö. Karaktärerna är tillbakadragna, formella, svåra att läsa. De flesta grupper fastnar initialt på Joakim (ekonomiskt motiv, sent i byggnaden) eller Lena (konfrontationen). Det är meningen. Svara neutralt. Peka inte på detaljer. Bekräfta inte teorier.' },
  { id: 'gm-akt2-motsagelser', title: 'Nyckelmotsägelser — Akt 2', type: 'warning', actRelevance: [2],
    content: '1. ERIK: påstår övertidsarbete — datorloggen visar noll sparade dokument, manuell avstängning 19:24.\n2. LENA: påstår yoga 19:00–20:30 — incheckning visar utcheckning 19:51 (47 min för tidigt).\n3. JOAKIM: påstår att han lämnade direkt efter mötet — Roos receptionslogg: mötet slut 19:28, kamera 20:02 (34 min oredovisade).\n4. REZA: "hörde ingenting" — hörlurar på, stöds av rörelsemönstret.\n\nLåt spelarna hitta dem själva.' },
  { id: 'gm-akt2-nivå3', title: 'Nivå 3 — triggers att hålla koll på', type: 'instruction', actRelevance: [2, 3],
    content: '"Vi undersöker skrivbordet noggrant" → berätta om det låsta underskåpet och nyckeln i väskan.\n"Vi öppnar skåpet" → ge Arvestum-mappen + Enells brev.\n"Vi undersöker kopieringsrummet" → handskarna i papperskorgen.\n"Vi vill att prismatet analyseras" → teknisk analys av prismatet.' },
  { id: 'gm-roda-sillar', title: 'Röda sillar — upplösning', type: 'background', actRelevance: [2, 3],
    content: 'JOAKIM: oskyldig — visste inte att Katarina var kvar, telefonsamtal (22 min) bekräftat, ingen koppling till Arvestum eller Reza.\nLENA: oskyldig — jobbansökan på Kafé Saturnus, kortkvitto + personal bekräftar; "du kommer att ångra det" gällde hennes avhopp.\nREZA: oskyldig — rörelsesensor + städtidslinje stämmer, hörlurar på.' },
  { id: 'gm-losningsguide-akt3', title: 'Lösningsguide — Akt 3', type: 'instruction', actRelevance: [3],
    content: 'Den logiska kedjan:\n1. Mordet är inscenerat — inget blod på skrivbordshörnet (foto 3), prismatet har biologiska spår men inga fingeravtryck, kroppen är för symmetriskt positionerad.\n2. Erik hade motiv, medel och tillfälle — Arvestum-bedrägeriet (mapp + Enells brev), söktermerna på morgonen, datorloggen utan dokument, kameran (sist ut), Rezas observation av marinblå kostym.\n3. Handskarna kopplar Erik till prismatet — DNA + kristallglasfragment på insidan.\n\nLösningsdialog: fråga "Vem? Hur? Varför?" Rätt person men fel motiv = bekräfta inte fullt ut.' },
]

const acts = [
  {
    id: 'act-1', number: 1, title: 'Orientering',
    description: 'Spelarna tar emot den initiala polisakt: Katarina Wester hittades död, preliminärt rubricerat som olycksfall. De läser vittnesmål, brottsplatsbeskrivning och teknisk dokumentation och börjar bilda sig en uppfattning.',
    playerIntro: 'Fredagen den 13 oktober 2023. Kl. 21:02 ringer städaren Reza Tehrani 112 från fjärde våningen på Birger Jarlsgatan 42 i Stockholm. Han har hittat Katarina Wester — senior partner på advokatbyrån Lindqvist & Wester — livlös på golvet i sitt arbetsrum. Polisen rubricerar dödsfallet som misstänkt olycksfall. Ni är utredarna. Det är upp till er att avgöra vad som verkligen hände.',
    availableMaterialIds: [],
    gmNoteIds: ['gm-intro-akt1', 'gm-akt1-stamning'],
  },
  {
    id: 'act-2', number: 2, title: 'Fördjupning',
    description: 'Spelarna begär uppföljningsmaterial, jämför kameraloggen med alibin, genomför uppföljningsförhör och undersöker ekonomiska spår. Bilden av en olycka börjar spricka.',
    playerIntro: 'Utredningen fördjupas. Ni har identifierat frågor materialet inte svarar på. Det är dags att gräva djupare — begära loggar, genomföra uppföljningsförhör, undersöka platser och föremål noggrant. Ni styr er egen utredning.',
    availableMaterialIds: [],
    gmNoteIds: ['gm-akt2-motsagelser', 'gm-akt2-nivå3', 'gm-roda-sillar'],
  },
  {
    id: 'act-3', number: 3, title: 'Lösning',
    description: 'Spelarna sätter ihop motiv, medel och tillfälle och presenterar sin teori för GM.',
    playerIntro: 'Ni har nu ett underlag. Det är dags att sätta ihop de sista bitarna. När ni är redo att presentera er teori — vem som begick mordet, hur, och varför — säger ni till.',
    availableMaterialIds: [],
    gmNoteIds: ['gm-losningsguide-akt3'],
  },
]

// ── bygg ──────────────────────────────────────────────────────────────
async function main() {
  const spelareIdx = await dirIndex(SPELARE_DIR)
  const fotonIdx = await dirIndex(FOTON_DIR)

  const material = []

  for (const m of TEXT_MATERIALS) {
    const file = lookup(spelareIdx, `${m.id}.md`)
    if (!file) {
      console.error(`  ✗ saknar spelartext: ${m.id}.md`)
      continue
    }
    const content = (await fs.readFile(path.join(SPELARE_DIR, file), 'utf8')).trim()
    material.push({
      id: m.id, type: m.type, title: m.title,
      actAvailability: actsFromLevel(m.lvl), playerVisible: true, gmOnly: false,
      content,
      ...(m.ch ? { relatedCharacterIds: m.ch } : {}),
      ...(m.ev ? { relatedEvidenceIds: m.ev } : {}),
    })
  }

  for (const p of PHOTO_MATERIALS) {
    material.push({
      id: p.id, type: p.type, title: p.title,
      actAvailability: actsFromLevel(p.lvl), playerVisible: true, gmOnly: false,
      content: p.content, assetPath: IMG(p.img),
      ...(p.ev ? { relatedEvidenceIds: p.ev } : {}),
    })
  }

  // act.availableMaterialIds = de material som blir tillgängliga i just den akten
  for (const a of acts) {
    a.availableMaterialIds = material
      .filter((m) => Math.min(...m.actAvailability) === a.number)
      .map((m) => m.id)
  }

  const charactersOut = characters.map((c) => ({
    id: c.id, name: c.name, age: c.age, occupation: c.occupation, role: c.role,
    description: c.description,
    ...(c.alibi ? { alibi: c.alibi } : {}),
    ...(c.motive ? { motive: c.motive } : {}),
    ...(c.relationship ? { relationship: c.relationship } : {}),
    imageAssetPath: IMG(c.img),
    actAvailability: [1, 2, 3], gmOnly: false,
  }))

  const evidenceOut = evidence.map((e) => ({
    id: e.id, title: e.title, description: e.description, type: e.type,
    actAvailability: e.actAvailability, playerVisible: true, gmOnly: false,
    ...(e.ch && e.ch.length ? { relatedCharacterIds: e.ch } : {}),
    significance: e.significance,
  }))

  const caseObj = {
    id: 'arvssynden',
    title: 'Arvssynden',
    tagline: 'En advokat dör på sitt kontor en fredagskväll. Polisen tror att hon föll. Det stämmer inte.',
    description:
      'Den 13 oktober 2023 hittades Katarina Wester, senior partner på advokatbyrån Lindqvist & Wester, död i sitt arbetsrum. Polisen rubricerade det som ett olycksfall — hon ska ha fallit och slagit huvudet mot skrivbordet. Men forensiken stämmer inte med en olycka, och ju djupare utredarna gräver desto tydligare blir det att någon mycket nära Katarina hade allt att förlora på att låta henne leva till måndag.',
    setting: 'Advokatbyrån Lindqvist & Wester KB, Birger Jarlsgatan 42, Stockholm — hösten 2023',
    estimatedDuration: '2–3 timmar',
    difficulty: 'hard',
    minPlayers: 2,
    maxPlayers: 6,
    acts,
    characters: charactersOut,
    evidence: evidenceOut,
    material,
    clues,
    solution,
    gmNotes,
  }

  await fs.mkdir(path.dirname(DEST_JSON), { recursive: true })
  await fs.writeFile(DEST_JSON, JSON.stringify(caseObj, null, 2))
  console.log(`✓ Skrev ${path.relative(PWA_ROOT, DEST_JSON)} (${material.length} material, ${charactersOut.length} personer, ${evidenceOut.length} bevis)`)

  // ── kopiera bilder (ASCII-säkra namn) ──
  const imageMap = {
    'b0-byggnaden.png': 'b0-byggnaden.png',
    'b1-brottsplats.png': 'b1-brottsplats.png',
    'b3-skrivbord.png': 'b3-skrivbord.png',
    'b4-bokhylla.png': 'b4-bokhylla.png',
    'b5-papperskorg.png': 'b5-papperskorg.png',
    'b16-omslag-arvssynden.png': 'b16-omslag.png',
    'planritning-fjarde-vaningen.png': 'planritning.png',
    'porträtt-erik-sandstrom.jpg': 'portratt-erik.jpg',
    'porträtt-katarina-lindqvist.jpg': 'portratt-katarina.jpg',
    'porträtt-joakim-wester.jpg': 'portratt-joakim.jpg',
    'porträtt-lena-bjork.jpg': 'portratt-lena.jpg',
    'porträtt-reza-tehrani.jpg': 'portratt-reza.jpg',
    'porträtt-petra-holm.jpg': 'portratt-petra.jpg',
    'porträtt-marcus-ek.jpg': 'portratt-marcus.jpg',
    'porträtt-thomas-lindqvist.jpg': 'portratt-thomas.jpg',
    'porträtt-maja-lindgren.jpg': 'portratt-maja.jpg',
  }
  await fs.mkdir(DEST_IMG, { recursive: true })
  let copied = 0
  const missing = []
  for (const [src, dest] of Object.entries(imageMap)) {
    const real = lookup(fotonIdx, src)
    if (!real) { missing.push(src); continue }
    await fs.copyFile(path.join(FOTON_DIR, real), path.join(DEST_IMG, dest))
    copied++
  }
  console.log(`✓ Kopierade ${copied}/${Object.keys(imageMap).length} bilder → ${path.relative(PWA_ROOT, DEST_IMG)}`)
  if (missing.length) console.log(`  saknade: ${missing.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
