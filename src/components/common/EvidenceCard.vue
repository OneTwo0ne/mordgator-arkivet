<script setup lang="ts">
import type { Evidence } from '../../types/caseTypes'
import { evidenceTypeLabels } from '../../utils/labels'
import ArchiveLabel from './ArchiveLabel.vue'

defineProps<{ evidence: Evidence; gmMode?: boolean }>()
</script>

<template>
  <article class="border border-line bg-paper-2 p-4">
    <header class="mb-2 flex flex-wrap items-start justify-between gap-2">
      <h3 class="text-sm font-semibold text-ink">{{ evidence.title }}</h3>
      <ArchiveLabel>{{ evidenceTypeLabels[evidence.type] }}</ArchiveLabel>
    </header>
    <p class="text-sm leading-relaxed text-ink-soft">
      {{ evidence.description }}
    </p>
    <!-- significance kan vara GM-känslig; visas bara i GM-läge. -->
    <p
      v-if="gmMode && evidence.significance"
      class="mt-3 border-l-2 border-oxblood/40 pl-3 text-sm leading-relaxed text-ink-soft"
    >
      <span class="font-medium text-oxblood">Betydelse: </span
      >{{ evidence.significance }}
    </p>
  </article>
</template>
