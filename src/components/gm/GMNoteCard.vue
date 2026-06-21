<script setup lang="ts">
import type { GMNote } from '../../types/caseTypes'
import { gmNoteTypeLabels } from '../../utils/labels'
import ArchiveLabel from '../common/ArchiveLabel.vue'

defineProps<{ note: GMNote }>()
</script>

<template>
  <article class="border border-oxblood/30 bg-paper-2 p-4">
    <header class="mb-2 flex flex-wrap items-start justify-between gap-2">
      <h3 class="text-sm font-semibold text-ink">{{ note.title }}</h3>
      <ArchiveLabel tone="gm">{{ gmNoteTypeLabels[note.type] }}</ArchiveLabel>
    </header>
    <p class="doc-text text-[0.85rem] whitespace-pre-wrap text-ink-soft">
      {{ note.content }}
    </p>
  </article>
</template>
