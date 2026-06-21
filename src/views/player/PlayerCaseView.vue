<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { caseService } from '../../services/caseService'
import type {
  Case,
  Character,
  Clue,
  Evidence,
  MaterialItem,
} from '../../types/caseTypes'
import SectionHeading from '../../components/common/SectionHeading.vue'
import MaterialCard from '../../components/common/MaterialCard.vue'
import CharacterCard from '../../components/common/CharacterCard.vue'
import EvidenceCard from '../../components/common/EvidenceCard.vue'
import SolutionPanel from '../../components/common/SolutionPanel.vue'
import ClueEnvelope from '../../components/player/ClueEnvelope.vue'
import AppButton from '../../components/common/AppButton.vue'

const props = defineProps<{ caseId: string }>()
const route = useRoute()

// Aktnummer läses ur query (?act=N). Systemet styr inte spelarna — det visar
// bara materialet för den akt GM angett i länken.
const act = computed(() => {
  const raw = route.query.act
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = value ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})

const caseData = ref<Case | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const material = ref<MaterialItem[]>([])
const characters = ref<Character[]>([])
const evidence = ref<Evidence[]>([])
const clues = ref<Clue[]>([])

const confirmingSolution = ref(false)
const solutionRevealed = ref(false)

const currentActInfo = computed(() =>
  caseData.value?.acts.find((a) => a.number === act.value),
)

async function loadActData(actNumber: number) {
  const [m, ch, ev, cl] = await Promise.all([
    caseService.getMaterialForAct(props.caseId, actNumber, false),
    caseService.getCharactersForAct(props.caseId, actNumber, false),
    caseService.getEvidenceForAct(props.caseId, actNumber, false),
    caseService.getCluesForAct(props.caseId, actNumber),
  ])
  material.value = m
  characters.value = ch
  evidence.value = ev
  clues.value = cl
}

onMounted(async () => {
  try {
    caseData.value = await caseService.getCase(props.caseId)
    await loadActData(act.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kunde inte läsa fallet.'
  } finally {
    loading.value = false
  }
})

watch(act, (actNumber) => {
  if (caseData.value) {
    confirmingSolution.value = false
    solutionRevealed.value = false
    void loadActData(actNumber)
  }
})

function revealSolution() {
  solutionRevealed.value = true
  confirmingSolution.value = false
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10">
    <p v-if="loading" class="text-sm text-ink-faint">Öppnar utredningsakten…</p>
    <p v-else-if="error" class="text-sm text-oxblood">{{ error }}</p>

    <template v-else-if="caseData">
      <header class="border-b border-line pb-6">
        <p class="text-[0.7rem] tracking-[0.22em] text-ink-faint uppercase">
          Utredningsakt
        </p>
        <h1 class="mt-2 font-serif text-3xl text-ink">{{ caseData.title }}</h1>
        <p class="mt-1 text-sm text-ink-faint">{{ caseData.setting }}</p>
        <div
          v-if="currentActInfo"
          class="mt-4 border-l-2 border-line-strong pl-4"
        >
          <p class="text-sm font-medium text-ink">{{ currentActInfo.title }}</p>
          <p class="mt-1 text-sm leading-relaxed text-ink-soft">
            {{ currentActInfo.playerIntro }}
          </p>
        </div>
      </header>

      <!-- Material (i kurerad ordning) -->
      <section v-if="material.length" class="mt-10">
        <SectionHeading :count="material.length">Material</SectionHeading>
        <div class="space-y-4">
          <MaterialCard v-for="item in material" :key="item.id" :item="item" />
        </div>
      </section>

      <!-- Personer (utan motiv) -->
      <section v-if="characters.length" class="mt-10">
        <SectionHeading :count="characters.length">Personer i fallet</SectionHeading>
        <div class="space-y-3">
          <CharacterCard v-for="ch in characters" :key="ch.id" :character="ch" />
        </div>
      </section>

      <!-- Bevis -->
      <section v-if="evidence.length" class="mt-10">
        <SectionHeading :count="evidence.length">Bevis</SectionHeading>
        <div class="space-y-3">
          <EvidenceCard v-for="ev in evidence" :key="ev.id" :evidence="ev" />
        </div>
      </section>

      <!-- Ledtrådar (kuvert-modellen) -->
      <section v-if="clues.length" class="mt-10">
        <SectionHeading :count="clues.length">Förseglade ledtrådar</SectionHeading>
        <div class="space-y-3">
          <ClueEnvelope
            v-for="clue in clues"
            :key="clue.id"
            :clue="clue"
            :case-id="caseId"
          />
        </div>
      </section>

      <!-- Lösning bakom bekräftelse -->
      <section class="mt-14 border-t border-line pt-8">
        <template v-if="!solutionRevealed">
          <div v-if="!confirmingSolution">
            <AppButton variant="ghost" @click="confirmingSolution = true">
              Visa lösning
            </AppButton>
          </div>
          <div
            v-else
            class="fade-in border border-oxblood/40 bg-oxblood/5 p-5"
          >
            <p class="text-sm font-medium text-ink">
              Är ni säkra? Lösningen avslöjar vem som är skyldig.
            </p>
            <div class="mt-4 flex gap-3">
              <AppButton variant="solid" @click="revealSolution"
                >Ja, visa lösningen</AppButton
              >
              <AppButton variant="ghost" @click="confirmingSolution = false"
                >Avbryt</AppButton
              >
            </div>
          </div>
        </template>

        <div v-else class="fade-in">
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
    </template>
  </div>
</template>
