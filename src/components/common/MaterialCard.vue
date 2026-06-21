<script setup lang="ts">
import type { MaterialItem } from '../../types/caseTypes'
import { materialTypeLabels } from '../../utils/labels'
import ArchiveLabel from './ArchiveLabel.vue'
import MaterialRenderer from '../material/MaterialRenderer.vue'

defineProps<{ item: MaterialItem; gmMode?: boolean }>()
</script>

<template>
  <article class="border border-line bg-paper-2 p-5">
    <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-ink">{{ item.title }}</h3>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <ArchiveLabel>{{ materialTypeLabels[item.type] }}</ArchiveLabel>
        <ArchiveLabel v-if="gmMode && item.gmOnly" tone="gm"
          >Endast GM</ArchiveLabel
        >
      </div>
    </header>
    <MaterialRenderer :item="item" />
  </article>
</template>
