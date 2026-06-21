<script setup lang="ts">
import type { MaterialItem } from '../../types/caseTypes'

defineProps<{ item: MaterialItem }>()
</script>

<template>
  <!-- Formell dokumentlayout för forensiska/ekonomiska underlag. -->
  <div class="border border-line bg-paper-3 p-4">
    <div
      class="mb-3 border-b border-line pb-2 text-[0.7rem] font-medium tracking-[0.18em] text-ink-faint uppercase"
    >
      Officiellt underlag
    </div>
    <div class="doc-text text-[0.95rem] text-ink">{{ item.content }}</div>
  </div>
</template>
