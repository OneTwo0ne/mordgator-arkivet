<script setup lang="ts">
import type { Act } from '../../types/caseTypes'

defineProps<{ acts: Act[]; modelValue: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>

<template>
  <div>
    <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
      Spelarna befinner sig i
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="act in acts"
        :key="act.id"
        type="button"
        class="border px-4 py-2 text-left transition-colors"
        :class="
          act.number === modelValue
            ? 'border-ink bg-ink text-paper-2'
            : 'border-line-strong bg-paper-2 text-ink hover:bg-paper-3'
        "
        @click="$emit('update:modelValue', act.number)"
      >
        <span class="block font-mono text-xs opacity-70"
          >Akt {{ act.number }}</span
        >
        <span class="block text-sm font-medium">{{ act.title }}</span>
      </button>
    </div>
  </div>
</template>
