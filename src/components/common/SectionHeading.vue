<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="mb-4 flex items-baseline gap-3 border-b border-line pb-2">
    <h2 class="text-sm font-semibold tracking-[0.12em] text-ink uppercase">
      <slot />
    </h2>
    <span v-if="count !== undefined" class="font-mono text-xs text-ink-faint"
      >{{ count }} st</span
    >
  </div>
</template>
