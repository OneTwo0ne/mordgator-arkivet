<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { caseService } from '../../services/caseService'
import type { Case } from '../../types/caseTypes'
import { difficultyLabels } from '../../utils/labels'

type CaseSummary = Pick<
  Case,
  | 'id'
  | 'title'
  | 'tagline'
  | 'description'
  | 'setting'
  | 'estimatedDuration'
  | 'difficulty'
  | 'minPlayers'
  | 'maxPlayers'
>

const router = useRouter()
const cases = ref<CaseSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    cases.value = await caseService.getAllCases()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kunde inte läsa fall.'
  } finally {
    loading.value = false
  }
})

function openCase(caseId: string) {
  router.push({ name: 'gm-dashboard', params: { caseId } })
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <header class="border-b border-line pb-6">
      <p class="text-[0.7rem] tracking-[0.22em] text-ink-faint uppercase">
        Digitalt utredningsarkiv
      </p>
      <h1 class="mt-2 font-serif text-3xl text-ink">Mordgåtor</h1>
      <p class="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
        Välj ett fall för att öppna spelledarvyn. Härifrån styr du vilken akt
        spelarna har tillgång till och kopierar länken du skickar till dem.
      </p>
    </header>

    <section class="mt-8">
      <p v-if="loading" class="text-sm text-ink-faint">Läser arkivet…</p>
      <p v-else-if="error" class="text-sm text-oxblood">{{ error }}</p>
      <p v-else-if="cases.length === 0" class="text-sm text-ink-faint">
        Inga fall i arkivet ännu.
      </p>

      <ul v-else class="space-y-3">
        <li v-for="c in cases" :key="c.id">
          <button
            type="button"
            class="block w-full border border-line bg-paper-2 p-5 text-left transition-colors hover:border-line-strong hover:bg-paper-3"
            @click="openCase(c.id)"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 class="text-lg font-semibold text-ink">{{ c.title }}</h2>
              <span class="font-mono text-xs text-ink-faint">{{ c.id }}</span>
            </div>
            <p class="mt-1 text-sm text-ink-soft">{{ c.tagline }}</p>
            <dl
              class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-faint"
            >
              <div class="flex gap-1">
                <dt>Svårighet:</dt>
                <dd class="text-ink-soft">{{ difficultyLabels[c.difficulty] }}</dd>
              </div>
              <div class="flex gap-1">
                <dt>Tid:</dt>
                <dd class="text-ink-soft">{{ c.estimatedDuration }}</dd>
              </div>
              <div class="flex gap-1">
                <dt>Spelare:</dt>
                <dd class="text-ink-soft">{{ c.minPlayers }}–{{ c.maxPlayers }}</dd>
              </div>
            </dl>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
