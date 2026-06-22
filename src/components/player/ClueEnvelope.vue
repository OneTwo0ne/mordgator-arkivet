<script setup lang="ts">
import { ref } from 'vue'
import type { Clue } from '../../types/caseTypes'
import AppButton from '../common/AppButton.vue'

const props = defineProps<{ clue: Clue; caseId: string }>()
const emit = defineEmits<{ open: [id: string] }>()

// En öppnad ledtråd förblir öppen mellan sidladdningar (localStorage).
const storageKey = `mordgator:clue:${props.caseId}:${props.clue.id}`
const opened = ref(localStorage.getItem(storageKey) === 'open')

function open() {
  opened.value = true
  emit('open', props.clue.id)
  try {
    localStorage.setItem(storageKey, 'open')
  } catch {
    // localStorage kan vara otillgängligt (privat läge) — ledtråden öppnas ändå.
  }
}
</script>

<template>
  <article
    class="border bg-paper-2 p-5"
    :class="
      clue.isEmergencyOnly ? 'border-oxblood/40' : 'border-line-strong'
    "
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-ink">{{ clue.title }}</h3>
        <p class="mt-1 text-sm text-ink-soft">{{ clue.hint }}</p>
      </div>
      <span
        v-if="clue.isEmergencyOnly"
        class="shrink-0 border border-oxblood/40 px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] text-oxblood uppercase"
        >Nödhjälp</span
      >
    </div>

    <p
      v-if="clue.isEmergencyOnly && !opened"
      class="mt-3 text-xs text-oxblood-soft"
    >
      Öppna bara om ni kört fast — den här ledtråden avslöjar mycket.
    </p>

    <div v-if="!opened" class="mt-4">
      <AppButton variant="outline" @click="open">Öppna ledtråd</AppButton>
    </div>
    <div
      v-else
      class="fade-in mt-4 border-t border-dashed border-line pt-4 text-sm leading-relaxed text-ink-soft"
    >
      {{ clue.content }}
    </div>
  </article>
</template>
