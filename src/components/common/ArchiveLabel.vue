<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'neutral' | 'gm' }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span
    class="inline-block border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.16em] uppercase"
    :class="
      tone === 'gm'
        ? 'border-oxblood/40 text-oxblood'
        : 'border-line text-ink-faint'
    "
  >
    <slot />
  </span>
</template>
