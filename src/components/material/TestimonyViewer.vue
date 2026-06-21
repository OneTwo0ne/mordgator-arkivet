<script setup lang="ts">
import { computed } from 'vue'
import type { MaterialItem } from '../../types/caseTypes'

const props = defineProps<{ item: MaterialItem }>()

type Line = { speaker: string | null; text: string }

// Förhörsprotokoll skrivs som rader. Rader som inleds med en talaretikett
// ("SM:", "ML:", ...) renderas i fråga/svar-layout; övriga rader (rubrik,
// metadata) visas som löpande text.
const lines = computed<Line[]>(() => {
  const raw = props.item.content ?? ''
  return raw.split('\n').map((line) => {
    const match = /^([A-ZÅÄÖ]{2,4}):\s?(.*)$/.exec(line)
    if (match) return { speaker: match[1], text: match[2] }
    return { speaker: null, text: line }
  })
})
</script>

<template>
  <div class="border border-line bg-paper-3 p-4 font-mono text-[0.9rem]">
    <template v-for="(line, i) in lines" :key="i">
      <div v-if="line.speaker" class="mb-2 flex gap-3 leading-relaxed">
        <span
          class="shrink-0 font-semibold tracking-wide text-ink-faint tabular-nums"
          >{{ line.speaker }}</span
        >
        <span class="text-ink">{{ line.text }}</span>
      </div>
      <div
        v-else-if="line.text.trim()"
        class="mb-2 leading-relaxed text-ink-soft"
      >
        {{ line.text }}
      </div>
      <div v-else class="h-2" />
    </template>
  </div>
</template>
