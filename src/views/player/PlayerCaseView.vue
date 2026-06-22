<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { caseService } from '../../services/caseService'
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

const props = defineProps<{ caseId: string }>()

const caseData = ref<Case | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Hela fallet på en gång — en sessionslänk, inga akter att byta mellan.
const material = ref<MaterialItem[]>([])
const characters = ref<Character[]>([])
const evidence = ref<Evidence[]>([])
const clues = ref<Clue[]>([])

type Section = 'oversikt' | 'material' | 'personer' | 'bevis' | 'tavla' | 'losning'
const activeSection = ref<Section>('oversikt')

const confirmingSolution = ref(false)
const solutionRevealed = ref(false)

// Öppningstext: första aktens spelarintro sätter scenen för hela sessionen.
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

onMounted(async () => {
  try {
    const [data, m, ch, ev, cl] = await Promise.all([
      caseService.getCase(props.caseId),
      caseService.getAllMaterial(props.caseId, false),
      caseService.getAllCharacters(props.caseId, false),
      caseService.getAllEvidence(props.caseId, false),
      caseService.getAllClues(props.caseId),
    ])
    caseData.value = data
    material.value = m
    characters.value = ch
    evidence.value = ev
    clues.value = cl
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kunde inte läsa fallet.'
  } finally {
    loading.value = false
  }
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
      Öppnar utredningsakten…
    </p>
    <p v-else-if="error" class="px-6 py-10 text-sm text-oxblood">{{ error }}</p>

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
            class="border-b-2 px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            :class="
              activeSection === item.key
                ? 'border-oxblood text-ink'
                : 'border-transparent text-ink-faint hover:text-ink'
            "
            @click="go(item.key)"
          >
            {{ item.label }}
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

          <div class="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              type="button"
              class="flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('material')"
            >
              <span class="font-serif text-3xl text-ink">{{ material.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Dokument</span>
            </button>
            <button
              type="button"
              class="flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('personer')"
            >
              <span class="font-serif text-3xl text-ink">{{ characters.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Personer</span>
            </button>
            <button
              type="button"
              class="flex flex-col gap-1.5 border border-line bg-paper-2 p-4 text-left transition-colors hover:border-line-strong"
              @click="go('bevis')"
            >
              <span class="font-serif text-3xl text-ink">{{ evidence.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Bevis</span>
            </button>
            <div class="flex flex-col gap-1.5 border border-line bg-paper-2 p-4">
              <span class="font-serif text-3xl text-ink">{{ clues.length }}</span>
              <span class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase">Ledtrådar</span>
            </div>
          </div>

          <!-- Förseglade ledtrådar -->
          <div v-if="clues.length" class="mt-12">
            <SectionHeading :count="clues.length">Förseglade ledtrådar</SectionHeading>
            <div class="grid gap-3 md:grid-cols-2">
              <ClueEnvelope
                v-for="clue in clues"
                :key="clue.id"
                :clue="clue"
                :case-id="caseId"
              />
            </div>
          </div>
        </section>

        <!-- MATERIAL -->
        <section v-else-if="activeSection === 'material'" class="fade-in">
          <SectionHeading :count="material.length">Material</SectionHeading>
          <MaterialReader v-if="material.length" :items="material" />
          <p v-else class="text-sm text-ink-dim">Inget material i fallet.</p>
        </section>

        <!-- PERSONER -->
        <section v-else-if="activeSection === 'personer'" class="fade-in">
          <SectionHeading :count="characters.length">Personer i fallet</SectionHeading>
          <div class="grid gap-3 md:grid-cols-2">
            <CharacterCard v-for="ch in characters" :key="ch.id" :character="ch" />
          </div>
        </section>

        <!-- BEVIS -->
        <section v-else-if="activeSection === 'bevis'" class="fade-in">
          <SectionHeading :count="evidence.length">Bevis</SectionHeading>
          <div class="grid gap-3 md:grid-cols-2">
            <EvidenceCard v-for="ev in evidence" :key="ev.id" :evidence="ev" />
          </div>
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
            :case-id="caseId"
          />
        </section>

        <!-- LÖSNING -->
        <section v-else-if="activeSection === 'losning'" class="fade-in">
          <template v-if="!solutionRevealed">
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
