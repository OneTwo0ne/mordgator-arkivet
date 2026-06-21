<script setup lang="ts">
import type { MaterialItem } from '../../types/caseTypes'

const props = defineProps<{ item: MaterialItem }>()

const src = props.item.assetPath
  ? import.meta.env.BASE_URL + props.item.assetPath
  : null
</script>

<template>
  <div class="border border-line bg-paper-3 p-4">
    <audio v-if="src" :src="src" controls preload="none" class="w-full" />
    <p v-else class="text-xs text-ink-faint">
      Ljudfil ej tillgänglig — platshållare.
    </p>
    <p
      v-if="item.content"
      class="mt-3 font-mono text-[0.8rem] leading-relaxed text-ink-soft"
    >
      {{ item.content }}
    </p>
  </div>
</template>
