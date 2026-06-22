<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { caseService } from '../../services/caseService'
import {
  isRealtimeAvailable,
  subscribeSession,
  type SessionState,
  type VisibleKind,
} from '../../services/realtimeService'
import type {
  Case,
  Character,
  Clue,
  Evidence,
  MaterialItem,
} from '../../types/caseTypes'
import SectionHeading from '../../components/common/SectionHeading.vue'
import CharacterCard from '../../components/common/CharacterCard.vue'
import EvidenceCard from '../../components/common/EvidenceCard.vue'
import SolutionPanel from '../../components/common/SolutionPanel.vue'
import ClueEnvelope from '../../components/player/ClueEnvelope.vue'
import MaterialReader from '../../components/player/MaterialReader.vue'
import EvidenceBoard from '../../components/player/EvidenceBoard.vue'
import AppButton from '../../components/common/AppButton.vue'

// Två lägen: live-session (?sessionId — GM styr synligt material) eller
// statiskt (?caseId — allt synligt, för förhandsgranskning/utan realtid).
const props = defineProps<{ caseId?: string; sessionId?: string }>()
const liveMode = computed(() => Boolean(props.sessionId))

const caseData = ref<Case | null>(null)
const resolvedCaseId = ref<string | null>(props.caseId ?? null)
const loading = ref(true)
const error = ref<string | null>(null)
const sessionMissing = ref(false)
const sessionState = ref<SessionState | null>(null)

// Hela fallet (spelarsäkert) — vad som faktiskt visas avgörs sedan av live-läget.
const allMaterial = ref<MaterialItem[]>([])
const allCharacters = ref<Character[]>([])
const allEvidence = ref<Evidence[]>([])
const allClues = ref<Clue[]>([])

type Section = 'oversikt' | 'material' | 'personer' | 'bevis' | 'tavla' | 'losning'
const activeSection = ref<Section>('oversikt')
const confirmingSolution = ref(false)
const solutionRevealed = ref(false)

// Lösningen öppnas antingen av spelarna själva eller av GM (live).
const solutionOpen = computed(
  () =>
    solutionRevealed.value ||
    (liveMode.value && sessionState.value?.solutionRevealed === true),
)

let unsubscribe: (() => void) | null = null

// Synlighetsfilter: i live-läge bara det GM slagit på; annars allt.
function visibleSet(kind: VisibleKind): Record<string, boolean> | null {
  if (!liveMode.value) return null
  return sessionState.value?.visible?.[kind] ?? {}
}

const material = computed(() => {
  const s = visibleSet('material')
  return s ? allMaterial.value.filter((m) => s[m.id]) : allMaterial.value
})
const characters = computed(() => {
  const s = visibleSet('characters')
  return s ? allCharacters.value.filter((c) => s[c.id]) : allCharacters.value
})
const evidence = computed(() => {
  const s = visibleSet('evidence')
  return s ? allEvidence.value.filter((e) => s[e.id]) : allEvidence.value
})
const clues = computed(() => {
  const s = visibleSet('clues')
  return s ? allClues.value.filter((c) => s[c.id]) : allClues.value
})

const totalVisible = computed(
  () =>
    material.value.length +
    characters.value.length +
    evidence.value.length +
    clues.value.length,
)

const opening = computed(() => {
  const acts = caseData.value?.acts ?? []
  const first = [...acts].sort((a, b) => a.number - b.number)[0]
  return first?.playerIntro ?? caseData.value?.description ?? ''
})

const navItems: { key: Section; label: string }[] = [
  { key: 'oversikt', label: 'Översikt' },
  { key: 'material', label: 'Material' },
  { key: 'personer', label: 'Personer' },
  { key: 'bevis', label: 'Bevis' },
  { key: 'tavla', label: 'Anslagstavla' },
]

// ---- Inkorg: oläst-markering för material GM gjort tillgängligt ----
// En sak är "ny/oläst" tills spelaren öppnat den. Vad som är synligt vid
// första anslutning räknas som redan läst (baslinje) — bara det GM släpper
// DÄREFTER dyker upp som nytt.
const seenIds = ref<string[]>([])
const seenKey = computed(
  () => `mordgator:seen:${props.sessionId ?? props.caseId ?? 'static'}`,
)
let hadStoredSeen = false
let baselineDone = false

function isSeen(id: string): boolean {
  return seenIds.value.includes(id)
}
function saveSeen() {
  try {
    localStorage.setItem(seenKey.value, JSON.stringify(seenIds.value))
  } catch {
    // ignoreras (privat läge)
  }
}
function markSeen(ids: string[]) {
  let changed = false
  for (const id of ids) {
    if (!seenIds.value.includes(id)) {
      seenIds.value.push(id)
      changed = true
    }
  }
  if (changed) saveSeen()
}
function loadSeen() {
  try {
    const raw = localStorage.getItem(seenKey.value)
    if (raw) {
      seenIds.value = JSON.parse(raw) as string[]
      hadStoredSeen = true
    }
  } catch {
    // ignoreras
  }
}
function ensureBaseline() {
  if (baselineDone) return
  baselineDone = true
  if (!hadStoredSeen) {
    markSeen([
      ...material.value.map((m) => m.id),
      ...characters.value.map((c) => c.id),
      ...evidence.value.map((e) => e.id),
      ...clues.value.map((c) => c.id),
    ])
  }
}

const unreadMaterialIds = computed(() =>
  material.value.filter((m) => !isSeen(m.id)).map((m) => m.id),
)
const unreadMaterial = computed(() => unreadMaterialIds.value.length)
const unreadCharacters = computed(
  () => characters.value.filter((c) => !isSeen(c.id)).length,
)
const unreadEvidence = computed(
  () => evidence.value.filter((e) => !isSeen(e.id)).length,
)
const unreadClues = computed(
  () => clues.value.filter((c) => !isSeen(c.id)).length,
)
const totalUnread = computed(
  () =>
    unreadMaterial.value +
    unreadCharacters.value +
    unreadEvidence.value +
    unreadClues.value,
)

function navUnread(key: Section): number {
  if (key === 'material') return unreadMaterial.value
  if (key === 'personer') return unreadCharacters.value
  if (key === 'bevis') return unreadEvidence.value
  return 0
}

// Att besöka Personer/Bevis räknar deras synliga kort som lästa.
watch([activeSection, characters, evidence], () => {
  if (activeSection.value === 'personer') {
    markSeen(characters.value.map((c) => c.id))
  } else if (activeSection.value === 'bevis') {
    markSeen(evidence.value.map((e) => e.id))
  }
})

async function loadCaseLists(caseId: string) {
  const [data, m, ch, ev, cl] = await Promise.all([
    caseService.getCase(caseId),
    caseService.getAllMaterial(caseId, false),
    caseService.getAllCharacters(caseId, false),
    caseService.getAllEvidence(caseId, false),
    caseService.getAllClues(caseId),
  ])
  caseData.value = data
  allMaterial.value = m
  allCharacters.value = ch
  allEvidence.value = ev
  allClues.value = cl
}

onMounted(async () => {
  loadSeen()
  try {
    if (liveMode.value && props.sessionId) {
      if (!isRealtimeAvailable()) {
        error.value =
          'Realtid är inte konfigurerad ännu. Be spelledaren kontrollera Firebase-inställningarna.'
        loading.value = false
        return
      }
      unsubscribe = subscribeSession(props.sessionId, async (state) => {
        if (!state) {
          sessionMissing.value = true
          loading.value = false
          return
        }
        sessionMissing.value = false
        sessionState.value = state
        if (resolvedCaseId.value !== state.caseId) {
          resolvedCaseId.value = state.caseId
          await loadCaseLists(state.caseId)
        }
        ensureBaseline()
        loading.value = false
      })
    } else if (props.caseId) {
      await loadCaseLists(props.caseId)
      ensureBaseline()
      loading.value = false
    } else {
      error.value = 'Ingen session angiven.'
      loading.value = false
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kunde inte läsa fallet.'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

function go(section: Section) {
  activeSection.value = section
}

function revealSolution() {
  solutionRevealed.value = true
  confirmingSolution.value = false
}
</script>

<template>
  <div class="min-h-svh">
    <p v-if="loading" class="px-6 py-10 text-sm text-ink-faint">
      {{ liveMode ? 'Ansluter till sessionen…' : 'Öppnar utredningsakten…' }}
    </p>
    <p v-else-if="error" class="px-6 py-10 text-sm text-oxblood">{{ error }}</p>
    <p
      v-else-if="sessionMissing"
      class="px-6 py-10 text-sm text-ink-faint"
    >
      Sessionen hittades inte. Kontrollera länken med spelledaren.
    </p>

    <template v-else-if="caseData">
      <!-- Topbar -->
      <header
        class="border-b border-line bg-gradient-to-b from-paper-2 to-paper"
      >
        <div
          class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3"
        >
          <span class="font-mono text-[0.7rem] tracking-[0.26em] text-brass uppercase"
            >Arkivet</span
          >
          <span class="font-serif text-lg text-ink">{{ caseData.title }}</span>
          <span
            class="hidden border border-line-strong px-3 py-1 font-mono text-[0.7rem] tracking-wider text-ink-faint sm:block"
            >{{ caseData.setting }}</span
          >
        </div>

        <!-- Sektionsnavigation -->
        <nav
          class="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 pb-px"
        >
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="flex items-center gap-2 border-b-2 px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            :class="
              activeSection === item.key
                ? 'border-oxblood text-ink'
                : 'border-transparent text-ink-faint hover:text-ink'
            "
            @click="go(item.key)"
          >
            {{ item.label }}
            <span
              v-if="navUnread(item.key)"
              class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[0.6rem] text-ink"
              >{{ navUnread(item.key) }}</span
            >
          </button>
          <button
            type="button"
            class="ml-auto border-b-2 px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            :class="
              activeSection === 'losning'
                ? 'border-oxblood text-oxblood-soft'
                : 'border-transparent text-ink-dim hover:text-oxblood-soft'
            "
            @click="go('losning')"
          >
            Lösning
          </button>
        </nav>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-8">
        <!-- ÖVERSIKT -->
        <section v-if="activeSection === 'oversikt'" class="fade-in">
          <p
            v-if="opening"
            class="max-w-[60ch] border-l-2 border-oxblood pl-5 font-serif text-xl leading-relaxed text-ink-soft"
          >
            {{ opening }}
          </p>

          <p
            v-if="totalUnread"
            class="mt-6 flex items-center gap-2 border border-oxblood/40 bg-oxblood/5 px-4 py-2.5 text-sm text-ink"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-oxblood" />
            Spelledaren har gjort {{ totalUnread }} {{ totalUnread === 1 ? 'ny sak' : 'nya saker' }}
            tillgängliga sedan ni började — markerade med
            <span class="font-mono text-xs text-oxblood-soft">Nytt</span> nedan.
          </p>

          <div class="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              type="button"
              class="relative flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('material')"
            >
              <span class="font-serif text-3xl text-ink">{{ material.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Dokument</span>
              <span
                v-if="unreadMaterial"
                class="absolute top-3 right-3 font-mono text-[0.6rem] text-oxblood-soft"
                >{{ unreadMaterial }} nytt</span
              >
            </button>
            <button
              type="button"
              class="relative flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('personer')"
            >
              <span class="font-serif text-3xl text-ink">{{ characters.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Personer</span>
              <span
                v-if="unreadCharacters"
                class="absolute top-3 right-3 font-mono text-[0.6rem] text-oxblood-soft"
                >{{ unreadCharacters }} nytt</span
              >
            </button>
            <button
              type="button"
              class="relative flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('bevis')"
            >
              <span class="font-serif text-3xl text-ink">{{ evidence.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Bevis</span>
              <span
                v-if="unreadEvidence"
                class="absolute top-3 right-3 font-mono text-[0.6rem] text-oxblood-soft"
                >{{ unreadEvidence }} nytt</span
              >
            </button>
            <div class="relative flex flex-col gap-1.5 border border-line bg-paper-2 p-4">
              <span class="font-serif text-3xl text-ink">{{ clues.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Ledtrådar</span>
              <span
                v-if="unreadClues"
                class="absolute top-3 right-3 font-mono text-[0.6rem] text-oxblood-soft"
                >{{ unreadClues }} nytt</span
              >
            </div>
          </div>

          <p
            v-if="liveMode && totalVisible === 0"
            class="mt-8 border border-line bg-paper-2 p-5 text-sm text-ink-faint"
          >
            Inget material är tillgängligt ännu. Spelledaren öppnar upp det
            efter hand — håll utkik, det dyker upp här automatiskt.
          </p>

          <!-- Förseglade ledtrådar -->
          <div v-if="clues.length" class="mt-12">
            <SectionHeading :count="clues.length">Förseglade ledtrådar</SectionHeading>
            <div class="grid gap-3 md:grid-cols-2">
              <ClueEnvelope
                v-for="clue in clues"
                :key="clue.id"
                :clue="clue"
                :case-id="resolvedCaseId ?? ''"
                @open="markSeen([$event])"
              />
            </div>
          </div>
        </section>

        <!-- MATERIAL -->
        <section v-else-if="activeSection === 'material'" class="fade-in">
          <SectionHeading :count="material.length">Material</SectionHeading>
          <MaterialReader
            v-if="material.length"
            :items="material"
            :unread-ids="unreadMaterialIds"
            @open="markSeen([$event])"
          />
          <p v-else class="text-sm text-ink-dim">Inget material tillgängligt ännu.</p>
        </section>

        <!-- PERSONER -->
        <section v-else-if="activeSection === 'personer'" class="fade-in">
          <SectionHeading :count="characters.length">Personer i fallet</SectionHeading>
          <div v-if="characters.length" class="grid gap-3 md:grid-cols-2">
            <CharacterCard v-for="ch in characters" :key="ch.id" :character="ch" />
          </div>
          <p v-else class="text-sm text-ink-dim">Inga personer tillgängliga ännu.</p>
        </section>

        <!-- BEVIS -->
        <section v-else-if="activeSection === 'bevis'" class="fade-in">
          <SectionHeading :count="evidence.length">Bevis</SectionHeading>
          <div v-if="evidence.length" class="grid gap-3 md:grid-cols-2">
            <EvidenceCard v-for="ev in evidence" :key="ev.id" :evidence="ev" />
          </div>
          <p v-else class="text-sm text-ink-dim">Inga bevis tillgängliga ännu.</p>
        </section>

        <!-- ANSLAGSTAVLA -->
        <section v-else-if="activeSection === 'tavla'" class="fade-in">
          <SectionHeading>Anslagstavla</SectionHeading>
          <p class="mb-4 max-w-[70ch] text-sm text-ink-faint">
            Er egen tavla. Flytta korten och knyt röda snören mellan personer och
            bevis ni tror hänger ihop. Inget rätt eller fel — det här är bara ert
            tankeutrymme, och det sparas i den här webbläsaren.
          </p>
          <EvidenceBoard
            :characters="characters"
            :evidence="evidence"
            :case-id="resolvedCaseId ?? ''"
          />
        </section>

        <!-- LÖSNING -->
        <section v-else-if="activeSection === 'losning'" class="fade-in">
          <template v-if="!solutionOpen">
            <div
              v-if="!confirmingSolution"
              class="border border-line bg-paper-2 p-8 text-center"
            >
              <p class="mx-auto max-w-[42ch] text-sm text-ink-faint">
                Lösningen avslöjar vem som är skyldig — och kan inte tas tillbaka.
                Öppna den först när ni lagt fram er egen teori.
              </p>
              <div class="mt-5">
                <AppButton variant="outline" @click="confirmingSolution = true">
                  Visa lösning
                </AppButton>
              </div>
            </div>
            <div v-else class="border border-oxblood/40 bg-oxblood/5 p-8 text-center">
              <p class="mx-auto max-w-[42ch] text-sm font-medium text-ink">
                Är ni säkra? Lösningen avslöjar vem som är skyldig.
              </p>
              <div class="mt-5 flex justify-center gap-3">
                <AppButton variant="solid" @click="revealSolution"
                  >Ja, visa lösningen</AppButton
                >
                <AppButton variant="ghost" @click="confirmingSolution = false"
                  >Inte än</AppButton
                >
              </div>
            </div>
          </template>

          <div v-else>
            <SectionHeading>Lösning</SectionHeading>
            <div class="border border-line bg-paper-2 p-6">
              <SolutionPanel
                :solution="caseData.solution"
                :characters="caseData.characters"
                :evidence="caseData.evidence"
              />
            </div>
          </div>
        </section>
      </main>
    </template>
  </div>
</template>
