<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MaterialItem, MaterialType } from '../../types/caseTypes'
import { materialTypeLabels } from '../../utils/labels'
import ArchiveLabel from '../common/ArchiveLabel.vue'
import MaterialRenderer from '../material/MaterialRenderer.vue'

const props = defineProps<{ items: MaterialItem[]; unreadIds?: string[] }>()
const emit = defineEmits<{ open: [id: string] }>()

function isUnread(id: string): boolean {
  return props.unreadIds?.includes(id) ?? false
}

// Fasett: filtrera på materialtyp. 'all' = ingen filtrering.
const activeType = ref<MaterialType | 'all'>('all')
const query = ref('')
const selectedId = ref<string | null>(null)

// Vilka typer förekommer i aktuellt material (bara dessa visas som fasetter).
const presentTypes = computed<MaterialType[]>(() => {
  const seen = new Set<MaterialType>()
  for (const item of props.items) seen.add(item.type)
  return [...seen]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.items.filter((item) => {
    if (activeType.value !== 'all' && item.type !== activeType.value)
      return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      (item.content ?? '').toLowerCase().includes(q)
    )
  })
})

const selected = computed(
  () => props.items.find((i) => i.id === selectedId.value) ?? null,
)

// Håll ett giltigt val: välj första i filtrerad lista om inget/ogiltigt valt.
watch(
  filtered,
  (list) => {
    if (!list.some((i) => i.id === selectedId.value)) {
      selectedId.value = list[0]?.id ?? null
    }
  },
  { immediate: true },
)

// Att öppna ett dokument markerar det som läst.
watch(selectedId, (id) => {
  if (id) emit('open', id)
})
</script>

<template>
  <div class="grid min-h-[28rem] grid-cols-1 border border-line md:grid-cols-[17rem_1fr]">
    <!-- Vänsterskena: fasetter + lista -->
    <div class="flex flex-col border-line bg-paper-2 md:border-r">
      <div class="space-y-3 border-b border-line p-3">
        <input
          v-model="query"
          type="search"
          placeholder="Sök i materialet…"
          class="w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-line-strong focus:outline-none"
        />
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
            :class="
              activeType === 'all'
                ? 'border-oxblood bg-oxblood text-ink'
                : 'border-line-strong text-ink-faint hover:text-ink'
            "
            @click="activeType = 'all'"
          >
            Alla
          </button>
          <button
            v-for="t in presentTypes"
            :key="t"
            type="button"
            class="border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
            :class="
              activeType === t
                ? 'border-oxblood bg-oxblood text-ink'
                : 'border-line-strong text-ink-faint hover:text-ink'
            "
            @click="activeType = t"
          >
            {{ materialTypeLabels[t] }}
          </button>
        </div>
      </div>

      <div class="max-h-[24rem] overflow-y-auto md:max-h-[40rem]">
        <p v-if="!filtered.length" class="p-4 text-sm text-ink-dim">
          Inget material matchar.
        </p>
        <button
          v-for="item in filtered"
          :key="item.id"
          type="button"
          class="flex w-full flex-col gap-1 border-b border-line px-4 py-3 text-left transition-colors"
          :class="
            item.id === selectedId
              ? 'bg-paper-3 shadow-[inset_3px_0_0_var(--color-oxblood)]'
              : 'hover:bg-paper-3/60'
          "
          @click="selectedId = item.id"
        >
          <span class="flex items-center gap-2 text-sm text-ink">
            <span
              v-if="isUnread(item.id)"
              class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-oxblood"
              aria-label="Nytt"
            />
            {{ item.title }}
          </span>
          <span
            class="font-mono text-[0.6rem] tracking-wider uppercase"
            :class="isUnread(item.id) ? 'text-oxblood-soft' : 'text-ink-dim'"
            >{{ isUnread(item.id) ? 'Nytt · ' : ''
            }}{{ materialTypeLabels[item.type] }}</span
          >
        </button>
      </div>
    </div>

    <!-- Detalj -->
    <div class="bg-paper p-6 md:p-8">
      <template v-if="selected">
        <ArchiveLabel>{{ materialTypeLabels[selected.type] }}</ArchiveLabel>
        <h3 class="mt-3 mb-5 font-serif text-2xl text-ink">{{ selected.title }}</h3>
        <MaterialRenderer :item="selected" />
      </template>
      <p v-else class="text-sm text-ink-dim">Välj ett dokument i listan.</p>
    </div>
  </div>
</template>
