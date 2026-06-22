<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MaterialItem } from '../../types/caseTypes'
import { materialGroups, materialTypeLabels } from '../../utils/labels'
import ArchiveLabel from '../common/ArchiveLabel.vue'
import MaterialRenderer from '../material/MaterialRenderer.vue'

const props = defineProps<{ items: MaterialItem[]; unreadIds?: string[] }>()
const emit = defineEmits<{ open: [id: string] }>()

function isUnread(id: string): boolean {
  return props.unreadIds?.includes(id) ?? false
}

const query = ref('')
// Tillståndsfilter, skilt från kategorierna: allt material eller bara oläst.
const stateFilter = ref<'all' | 'new'>('all')
const selectedId = ref<string | null>(null)
// Ihopfällda grupper (dragspel). Tomt = alla utfällda.
const collapsed = ref<string[]>([])

const unreadCount = computed(() => props.unreadIds?.length ?? 0)
const hasUnread = computed(() => unreadCount.value > 0)

function matchesFilters(item: MaterialItem): boolean {
  if (stateFilter.value === 'new' && !isUnread(item.id)) return false
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return (
    item.title.toLowerCase().includes(q) ||
    (item.content ?? '').toLowerCase().includes(q)
  )
}

interface RenderGroup {
  key: string
  label: string
  items: MaterialItem[]
}

// Dokumenten grupperade efter materialgrupp. Tomma grupper döljs.
const groups = computed<RenderGroup[]>(() => {
  const result: RenderGroup[] = []
  const assigned = new Set<string>()
  for (const g of materialGroups) {
    const items = props.items.filter(
      (i) => g.types.includes(i.type) && matchesFilters(i),
    )
    items.forEach((i) => assigned.add(i.id))
    if (items.length) result.push({ key: g.key, label: g.label, items })
  }
  const leftovers = props.items.filter(
    (i) => !assigned.has(i.id) && matchesFilters(i),
  )
  // Endast oklassat material som ändå matchar filtren hamnar i Övrigt.
  const grouped = new Set(materialGroups.flatMap((g) => g.types))
  const ovrigt = leftovers.filter((i) => !grouped.has(i.type))
  if (ovrigt.length) result.push({ key: 'ovrigt', label: 'Övrigt', items: ovrigt })
  return result
})

const flatItems = computed(() => groups.value.flatMap((g) => g.items))
const totalShown = computed(() => flatItems.value.length)

const selected = computed(
  () => props.items.find((i) => i.id === selectedId.value) ?? null,
)

// När man filtrerar till "Nytt" fälls allt ut så inget nytt göms i en hopfälld grupp.
function isCollapsed(key: string): boolean {
  if (stateFilter.value === 'new') return false
  return collapsed.value.includes(key)
}
function toggleGroup(key: string) {
  const i = collapsed.value.indexOf(key)
  if (i >= 0) collapsed.value.splice(i, 1)
  else collapsed.value.push(key)
}

// Håll ett giltigt val bland synliga dokument (utan att markera som läst).
watch(
  flatItems,
  (list) => {
    if (!list.some((i) => i.id === selectedId.value)) {
      selectedId.value = list[0]?.id ?? null
    }
  },
  { immediate: true },
)

watch(hasUnread, (unread) => {
  if (!unread && stateFilter.value === 'new') stateFilter.value = 'all'
})

// Att aktivt öppna ett dokument markerar det som läst.
function selectItem(id: string) {
  selectedId.value = id
  emit('open', id)
}
</script>

<template>
  <div
    class="grid min-h-[28rem] grid-cols-1 border border-line md:grid-cols-[18rem_1fr]"
  >
    <!-- Vänsterskena: sök + tillståndsfilter + grupperad dragspelslista -->
    <div class="flex flex-col border-line bg-paper-2 md:border-r">
      <div class="space-y-3 border-b border-line p-3">
        <input
          v-model="query"
          type="search"
          placeholder="Sök i materialet…"
          class="w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-line-strong focus:outline-none"
        />
        <div class="flex gap-1.5">
          <button
            v-if="hasUnread"
            type="button"
            class="flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
            :class="
              stateFilter === 'new'
                ? 'border-oxblood bg-oxblood text-ink'
                : 'border-oxblood/50 text-oxblood-soft hover:text-ink'
            "
            @click="stateFilter = 'new'"
          >
            <span
              v-if="stateFilter !== 'new'"
              class="inline-block h-1.5 w-1.5 rounded-full bg-oxblood"
            />
            Nytt · {{ unreadCount }}
          </button>
          <button
            type="button"
            class="border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
            :class="
              stateFilter === 'all'
                ? 'border-oxblood bg-oxblood text-ink'
                : 'border-line-strong text-ink-faint hover:text-ink'
            "
            @click="stateFilter = 'all'"
          >
            Allt material
          </button>
        </div>
      </div>

      <div class="max-h-[26rem] overflow-y-auto md:max-h-[44rem]">
        <p v-if="!totalShown" class="p-4 text-sm text-ink-dim">
          Inget material matchar.
        </p>

        <div v-for="g in groups" :key="g.key">
          <!-- Gruppens rubrik (klickbar dragspelsknapp), fastnar vid scroll -->
          <button
            type="button"
            class="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-line bg-paper-2 px-3 py-2 text-left transition-colors hover:bg-paper-3/60"
            @click="toggleGroup(g.key)"
          >
            <span
              class="font-mono text-[0.6rem] text-ink-faint transition-transform"
              :class="isCollapsed(g.key) ? '-rotate-90' : ''"
              >▾</span
            >
            <span
              class="flex-1 font-mono text-[0.7rem] tracking-[0.14em] text-ink-faint uppercase"
              >{{ g.label }}</span
            >
            <span class="font-mono text-[0.65rem] text-ink-dim">{{ g.items.length }}</span>
          </button>

          <!-- Gruppens dokument -->
          <template v-if="!isCollapsed(g.key)">
            <button
              v-for="item in g.items"
              :key="item.id"
              type="button"
              class="flex w-full flex-col gap-0.5 border-b border-line px-4 py-2.5 pl-7 text-left transition-colors"
              :class="
                item.id === selectedId
                  ? 'bg-paper-3 shadow-[inset_3px_0_0_var(--color-oxblood)]'
                  : 'hover:bg-paper-3/60'
              "
              @click="selectItem(item.id)"
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
          </template>
        </div>
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
