<script setup lang="ts">
import { ref } from 'vue'
import type { Character } from '../../types/caseTypes'
import { characterRoleLabels } from '../../utils/labels'
import ArchiveLabel from './ArchiveLabel.vue'

const props = defineProps<{ character: Character; gmMode?: boolean }>()

const src = props.character.imageAssetPath
  ? import.meta.env.BASE_URL + props.character.imageAssetPath
  : null
const imgFailed = ref(!src)
const initials = props.character.name
  .split(/\s+/)
  .map((part) => part[0])
  .slice(0, 2)
  .join('')
</script>

<template>
  <article class="flex gap-4 border border-line bg-paper-2 p-4">
    <div
      class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-line bg-paper-3"
    >
      <img
        v-if="src && !imgFailed"
        :src="src"
        :alt="character.name"
        class="h-full w-full object-cover"
        @error="imgFailed = true"
      />
      <span v-else class="font-mono text-lg text-ink-faint">{{ initials }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-semibold text-ink">{{ character.name }}</h3>
        <ArchiveLabel>{{ characterRoleLabels[character.role] }}</ArchiveLabel>
        <ArchiveLabel v-if="gmMode && character.gmOnly" tone="gm"
          >Endast GM</ArchiveLabel
        >
      </div>
      <p class="mt-1 text-xs text-ink-faint">
        <template v-if="character.occupation">{{
          character.occupation
        }}</template>
        <template v-if="character.age">
          · {{ character.age }} år</template
        >
      </p>
      <p class="mt-2 text-sm leading-relaxed text-ink-soft">
        {{ character.description }}
      </p>
      <dl class="mt-3 space-y-1.5 text-sm">
        <div v-if="character.alibi" class="flex gap-2">
          <dt class="shrink-0 text-ink-faint">Alibi:</dt>
          <dd class="text-ink-soft">{{ character.alibi }}</dd>
        </div>
        <!-- Motiv visas endast i GM-läge (caseService rensar bort fältet för spelare). -->
        <div v-if="gmMode && character.motive" class="flex gap-2">
          <dt class="shrink-0 font-medium text-oxblood">Motiv:</dt>
          <dd class="text-ink-soft">{{ character.motive }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>
