<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'solid' | 'outline' | 'ghost'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'outline', type: 'button', disabled: false },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'bg-oxblood text-ink hover:bg-oxblood-soft': variant === 'solid',
      'border border-line-strong bg-paper-2 text-ink hover:bg-paper-3':
        variant === 'outline',
      'text-ink-faint hover:text-ink': variant === 'ghost',
    }"
  >
    <slot />
  </button>
</template>
