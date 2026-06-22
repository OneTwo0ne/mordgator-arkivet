<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Case } from '../../types/caseTypes'
import { sessionService } from '../../services/sessionService'
import {
  createSession,
  isRealtimeAvailable,
  setManyVisibility,
  setSolutionRevealed,
  setVisibility,
  subscribeSession,
  type SessionState,
  type VisibleInit,
  type VisibleKind,
} from '../../services/realtimeService'
import AppButton from '../common/AppButton.vue'

const props = defineProps<{ caseData: Case }>()

interface InvItem {
  id: string
  label: string
}
interface Group {
  kind: VisibleKind
  label: string
  items: InvItem[]
}

const available = isRealtimeAvailable()
const storageKey = computed(() => `mordgator:gmsession:${props.caseData.id}`)

const sessionId = ref<string | null>(null)
const sessionState = ref<SessionState | null>(null)
const starting = ref(false)
const copied = ref(false)
const error = ref<string | null>(null)

let unsubscribe: (() => void) | null = null
let copyTimer: ReturnType<typeof setTimeout> | undefined

// Inventering — bara det som spelare överhuvudtaget får se (inte gmOnly).
const groups = computed<Group[]>(() => {
  const c = props.caseData
  return [
    {
      kind: 'material',
      label: 'Material',
      items: c.material
        .filter((m) => !m.gmOnly && m.playerVisible)
        .map((m) => ({ id: m.id, label: m.title })),
    },
    {
      kind: 'characters',
      label: 'Personer',
      items: c.characters
        .filter((ch) => !ch.gmOnly)
        .map((ch) => ({ id: ch.id, label: ch.name })),
    },
    {
      kind: 'evidence',
      label: 'Bevis',
      items: c.evidence
        .filter((e) => !e.gmOnly && e.playerVisible)
        .map((e) => ({ id: e.id, label: e.title })),
    },
    {
      kind: 'clues',
      label: 'Ledtrådar',
      items: c.clues.map((cl) => ({ id: cl.id, label: cl.title })),
    },
  ]
})

const sessionLink = computed(() =>
  sessionId.value ? sessionService.createSessionLink(sessionId.value) : '',
)

function isVisible(kind: VisibleKind, id: string): boolean {
  return sessionState.value?.visible?.[kind]?.[id] === true
}

function visibleCount(kind: VisibleKind, items: InvItem[]): number {
  return items.filter((it) => isVisible(kind, it.id)).length
}

// Förvald synlighet vid sessionsstart: det som hör till akt 1.
function defaultVisible(): VisibleInit {
  const c = props.caseData
  const inAct1 = (arr: number[]) => arr.includes(1)
  const pick = <T extends { id: string }>(
    items: T[],
    avail: (t: T) => boolean,
  ) => Object.fromEntries(items.filter(avail).map((i) => [i.id, true]))
  return {
    material: pick(
      c.material.filter((m) => !m.gmOnly && m.playerVisible),
      (m) => inAct1(m.actAvailability),
    ),
    characters: pick(
      c.characters.filter((ch) => !ch.gmOnly),
      (ch) => inAct1(ch.actAvailability),
    ),
    evidence: pick(
      c.evidence.filter((e) => !e.gmOnly && e.playerVisible),
      (e) => inAct1(e.actAvailability),
    ),
    clues: pick(c.clues, (cl) => inAct1(cl.actAvailability)),
  }
}

function attach(id: string) {
  sessionId.value = id
  try {
    localStorage.setItem(storageKey.value, id)
  } catch {
    // ignoreras
  }
  unsubscribe = subscribeSession(id, (state) => {
    sessionState.value = state
  })
}

async function startSession() {
  if (!available) return
  starting.value = true
  error.value = null
  try {
    const id = await createSession(props.caseData.id, defaultVisible())
    attach(id)
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Kunde inte starta sessionen.'
  } finally {
    starting.value = false
  }
}

async function toggle(kind: VisibleKind, id: string) {
  if (!sessionId.value) return
  await setVisibility(sessionId.value, kind, id, !isVisible(kind, id))
}

async function setGroup(kind: VisibleKind, items: InvItem[], visible: boolean) {
  if (!sessionId.value) return
  await setManyVisibility(
    sessionId.value,
    kind,
    Object.fromEntries(items.map((it) => [it.id, visible])),
  )
}

async function toggleSolution() {
  if (!sessionId.value) return
  await setSolutionRevealed(
    sessionId.value,
    !(sessionState.value?.solutionRevealed === true),
  )
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(sessionLink.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2500)
  } catch {
    // länken visas i klartext ändå
  }
}

onMounted(() => {
  if (!available) return
  const saved = localStorage.getItem(storageKey.value)
  if (saved) attach(saved)
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<template>
  <section class="mt-8 border border-brass/30 bg-paper-2 p-5">
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full" :class="sessionId ? 'bg-brass' : 'bg-ink-dim'" />
      <h2 class="font-mono text-[0.7rem] tracking-[0.2em] text-brass uppercase">
        Live-styrning
      </h2>
    </div>

    <!-- Realtid ej konfigurerad -->
    <p v-if="!available" class="mt-3 text-sm text-ink-faint">
      Realtid är inte aktiverad ännu — lägg in Firebase-konfigen i
      <code class="bg-paper-3 px-1 font-mono text-xs">src/config/firebase.ts</code>
      så kan du styra vad spelarna ser live.
    </p>

    <!-- Ingen aktiv session -->
    <template v-else-if="!sessionId">
      <p class="mt-3 max-w-[70ch] text-sm text-ink-faint">
        Starta en live-session och dela länken. Spelarna ansluter till samma länk
        och ser bara det du slår på. Akt 1:s material är påslaget från början.
      </p>
      <div class="mt-4">
        <AppButton variant="solid" :disabled="starting" @click="startSession">
          {{ starting ? 'Startar…' : 'Starta live-session' }}
        </AppButton>
      </div>
      <p v-if="error" class="mt-3 text-sm text-oxblood">{{ error }}</p>
    </template>

    <!-- Aktiv session -->
    <template v-else>
      <div class="mt-4 border-b border-line pb-4">
        <p class="mb-2 text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
          Spelarlänk (live)
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton variant="solid" @click="copyLink">
            {{ copied ? 'Kopierad!' : 'Kopiera spelarlänk' }}
          </AppButton>
          <code
            class="min-w-0 flex-1 truncate bg-paper-3 px-3 py-2 font-mono text-xs text-ink-soft"
            >{{ sessionLink }}</code
          >
        </div>
        <p class="mt-2 text-xs text-ink-dim">
          Slå på/av nedan — ändringar syns direkt hos alla anslutna spelare.
        </p>
      </div>

      <!-- Inventering med på/av -->
      <div class="mt-5 space-y-6">
        <div v-for="g in groups" :key="g.kind">
          <div class="mb-2 flex items-center justify-between gap-3">
            <h3 class="font-mono text-[0.7rem] tracking-[0.16em] text-ink-faint uppercase">
              {{ g.label }}
              <span class="text-ink-dim"
                >· {{ visibleCount(g.kind, g.items) }}/{{ g.items.length }} synliga</span
              >
            </h3>
            <div class="flex gap-2">
              <button
                type="button"
                class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase hover:text-ink"
                @click="setGroup(g.kind, g.items, true)"
              >
                Visa alla
              </button>
              <span class="text-ink-dim">·</span>
              <button
                type="button"
                class="font-mono text-[0.65rem] tracking-wider text-ink-faint uppercase hover:text-ink"
                @click="setGroup(g.kind, g.items, false)"
              >
                Dölj alla
              </button>
            </div>
          </div>
          <ul class="divide-y divide-line border border-line">
            <li
              v-for="it in g.items"
              :key="it.id"
              class="flex items-center justify-between gap-3 bg-paper px-3 py-2"
            >
              <span class="min-w-0 truncate text-sm text-ink-soft">{{ it.label }}</span>
              <button
                type="button"
                role="switch"
                :aria-checked="isVisible(g.kind, it.id)"
                class="relative h-5 w-9 shrink-0 rounded-full border transition-colors"
                :class="
                  isVisible(g.kind, it.id)
                    ? 'border-oxblood bg-oxblood'
                    : 'border-line-strong bg-paper-3'
                "
                @click="toggle(g.kind, it.id)"
              >
                <span
                  class="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ink transition-all"
                  :class="isVisible(g.kind, it.id) ? 'left-4' : 'left-0.5'"
                />
              </button>
            </li>
          </ul>
        </div>

        <!-- Lösning till spelarna -->
        <div class="flex items-center justify-between gap-3 border-t border-line pt-4">
          <span class="text-sm text-ink-soft">Gör lösningen tillgänglig för spelarna</span>
          <button
            type="button"
            role="switch"
            :aria-checked="sessionState?.solutionRevealed === true"
            class="relative h-5 w-9 shrink-0 rounded-full border transition-colors"
            :class="
              sessionState?.solutionRevealed
                ? 'border-oxblood bg-oxblood'
                : 'border-line-strong bg-paper-3'
            "
            @click="toggleSolution"
          >
            <span
              class="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ink transition-all"
              :class="sessionState?.solutionRevealed ? 'left-4' : 'left-0.5'"
            />
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
