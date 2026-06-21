<script setup lang="ts">
import { computed } from 'vue'
import type { Character, Evidence, Solution } from '../../types/caseTypes'

const props = defineProps<{
  solution: Solution
  characters: Character[]
  evidence: Evidence[]
}>()

const nameById = computed(() =>
  Object.fromEntries(props.characters.map((c) => [c.id, c.name])),
)
const evidenceTitleById = computed(() =>
  Object.fromEntries(props.evidence.map((e) => [e.id, e.title])),
)

const perpetratorName = computed(
  () =>
    nameById.value[props.solution.perpetratorId] ??
    props.solution.perpetratorId,
)

function names(ids: string[]): string {
  return ids.map((id) => nameById.value[id] ?? id).join(', ')
}
</script>

<template>
  <div class="space-y-6 text-sm leading-relaxed text-ink-soft">
    <div>
      <p class="text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Gärningsperson
      </p>
      <p class="mt-1 text-lg font-semibold text-ink">{{ perpetratorName }}</p>
    </div>

    <div>
      <p class="text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Motiv
      </p>
      <p class="mt-1">{{ solution.motive }}</p>
    </div>

    <div>
      <p class="text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Metod
      </p>
      <p class="mt-1">{{ solution.method }}</p>
    </div>

    <div>
      <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Händelseförlopp
      </p>
      <ol class="space-y-2 border-l border-line pl-4">
        <li v-for="(event, i) in solution.timeline" :key="i">
          <span class="font-mono text-xs font-medium text-ink"
            >{{ event.time }}</span
          >
          <span class="ml-2">{{ event.description }}</span>
          <span
            v-if="event.characterIds.length"
            class="ml-1 text-xs text-ink-faint"
            >({{ names(event.characterIds) }})</span
          >
        </li>
      </ol>
    </div>

    <div>
      <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Centrala bevis
      </p>
      <ul class="list-inside list-disc space-y-1">
        <li v-for="id in solution.keyEvidenceIds" :key="id">
          {{ evidenceTitleById[id] ?? id }}
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Vilseledande spår
      </p>
      <ul class="list-inside list-disc space-y-1">
        <li v-for="(trail, i) in solution.misleadingTrails" :key="i">
          {{ trail }}
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Viktiga detaljer
      </p>
      <ul class="list-inside list-disc space-y-1">
        <li v-for="(detail, i) in solution.importantDetails" :key="i">
          {{ detail }}
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
        Sammanfattning
      </p>
      <p class="doc-text text-[0.95rem] whitespace-pre-wrap">
        {{ solution.fullNarrative }}
      </p>
    </div>
  </div>
</template>
