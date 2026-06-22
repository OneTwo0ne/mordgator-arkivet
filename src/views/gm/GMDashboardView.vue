<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { caseService } from '../../services/caseService'
import { sessionService } from '../../services/sessionService'
import type {
  Case,
  Character,
  Evidence,
  GMNote,
  MaterialItem,
} from '../../types/caseTypes'
import AppButton from '../../components/common/AppButton.vue'
import SectionHeading from '../../components/common/SectionHeading.vue'
import MaterialCard from '../../components/common/MaterialCard.vue'
import CharacterCard from '../../components/common/CharacterCard.vue'
import EvidenceCard from '../../components/common/EvidenceCard.vue'
import SolutionPanel from '../../components/common/SolutionPanel.vue'
import ActSelector from '../../components/gm/ActSelector.vue'
import GMNoteCard from '../../components/gm/GMNoteCard.vue'

const props = defineProps<{ caseId: string }>()

const caseData = ref<Case | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const currentAct = ref(1)
const material = ref<MaterialItem[]>([])
const characters = ref<Character[]>([])
const evidence = ref<Evidence[]>([])
const gmNotes = ref<GMNote[]>([])

const showSolution = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const currentActInfo = computed(() =>
  caseData.value?.acts.find((a) => a.number === currentAct.value),
)

// En enda akt-oberoende sessionslänk — spelarna ser hela fallet direkt.
const playerLink = computed(() =>
  sessionService.createPlayerLink(props.caseId),
)

async function loadActData(act: number) {
  const [m, ch, ev, notes] = await Promise.all([
    caseService.getMaterialForAct(props.caseId, act, true),
    caseService.getCharactersForAct(props.caseId, act, true),
    caseService.getEvidenceForAct(props.caseId, act, true),
    caseService.getGMNotes(props.caseId, act),
  ])
  material.value = m
  characters.value = ch
  evidence.value = ev
  gmNotes.value = notes
}

onMounted(async () => {
  try {
    caseData.value = await caseService.getCase(props.caseId)
    await loadActData(currentAct.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kunde inte läsa fallet.'
  } finally {
    loading.value = false
  }
})

watch(currentAct, (act) => {
  if (caseData.value) void loadActData(act)
})

async function copyPlayerLink() {
  try {
    await navigator.clipboard.writeText(playerLink.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2500)
  } catch {
    // Clipboard kan vara blockerad — länken visas alltid i klartext nedan.
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-8">
    <!-- GM-läge-indikator: skiljer tydligt från spelarvyn. -->
    <div
      class="mb-6 flex items-center justify-between border border-oxblood/40 bg-oxblood/5 px-4 py-2"
    >
      <span
        class="text-[0.7rem] font-semibold tracking-[0.22em] text-oxblood uppercase"
        >Spelledarläge — visar allt material</span
      >
      <router-link
        :to="{ name: 'gm-case-select' }"
        class="text-xs text-ink-soft underline-offset-2 hover:underline"
        >← Alla fall</router-link
      >
    </div>

    <p v-if="loading" class="text-sm text-ink-faint">Läser fallet…</p>
    <p v-else-if="error" class="text-sm text-oxblood">{{ error }}</p>

    <template v-else-if="caseData">
      <header class="border-b border-line pb-6">
        <h1 class="font-serif text-3xl text-ink">{{ caseData.title }}</h1>
        <p class="mt-1 text-sm text-ink-faint">{{ caseData.setting }}</p>
        <p class="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
          {{ caseData.description }}
        </p>
      </header>

      <!-- Aktstyrning + spelarlänk -->
      <section class="mt-8 border border-line bg-paper-2 p-5">
        <ActSelector :acts="caseData.acts" v-model="currentAct" />

        <div
          v-if="currentActInfo"
          class="mt-4 border-t border-line pt-4 text-sm text-ink-soft"
        >
          <p class="font-medium text-ink">{{ currentActInfo.title }}</p>
          <p class="mt-1">{{ currentActInfo.description }}</p>
        </div>

        <div class="mt-5 border-t border-line pt-4">
          <p
            class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase"
          >
            Spelarlänk för hela sessionen
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <AppButton variant="solid" @click="copyPlayerLink">
              {{ copied ? 'Kopierad!' : 'Kopiera spelarlänk' }}
            </AppButton>
            <code
              class="min-w-0 flex-1 truncate bg-paper-3 px-3 py-2 font-mono text-xs text-ink-soft"
              >{{ playerLink }}</code
            >
          </div>
          <p class="mt-3 text-xs leading-relaxed text-ink-dim">
            En enda länk för hela spelomgången — spelarna ser allt material direkt
            och behöver aldrig byta länk. Aktväljaren ovan styr bara <em>din</em>
            förhandsgranskning här nedanför, inte vad spelarna ser.
            <span class="text-ink-faint"
              >(På önskelistan: styra vad spelarna ser i realtid.)</span
            >
          </p>
        </div>
      </section>

      <!-- GM-noteringar -->
      <section v-if="gmNotes.length" class="mt-10">
        <SectionHeading :count="gmNotes.length">Spelledaranteckningar</SectionHeading>
        <div class="grid gap-3 md:grid-cols-2">
          <GMNoteCard v-for="note in gmNotes" :key="note.id" :note="note" />
        </div>
      </section>

      <!-- Karaktärer -->
      <section v-if="characters.length" class="mt-10">
        <SectionHeading :count="characters.length">Personer i fallet</SectionHeading>
        <div class="grid gap-3 md:grid-cols-2">
          <CharacterCard
            v-for="ch in characters"
            :key="ch.id"
            :character="ch"
            gm-mode
          />
        </div>
      </section>

      <!-- Material -->
      <section v-if="material.length" class="mt-10">
        <SectionHeading :count="material.length">Material</SectionHeading>
        <div class="space-y-4">
          <MaterialCard
            v-for="item in material"
            :key="item.id"
            :item="item"
            gm-mode
          />
        </div>
      </section>

      <!-- Bevis -->
      <section v-if="evidence.length" class="mt-10">
        <SectionHeading :count="evidence.length">Bevis</SectionHeading>
        <div class="grid gap-3 md:grid-cols-2">
          <EvidenceCard
            v-for="ev in evidence"
            :key="ev.id"
            :evidence="ev"
            gm-mode
          />
        </div>
      </section>

      <!-- Lösning (utfällbar) -->
      <section class="mt-10">
        <SectionHeading>Lösning</SectionHeading>
        <AppButton variant="outline" @click="showSolution = !showSolution">
          {{ showSolution ? 'Dölj lösning' : 'Visa lösning' }}
        </AppButton>
        <div
          v-if="showSolution"
          class="fade-in mt-4 border border-oxblood/30 bg-paper-2 p-6"
        >
          <SolutionPanel
            :solution="caseData.solution"
            :characters="caseData.characters"
            :evidence="caseData.evidence"
          />
        </div>
      </section>
    </template>
  </div>
</template>
