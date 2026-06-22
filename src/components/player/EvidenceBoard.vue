<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { Character, Evidence } from '../../types/caseTypes'
import { characterRoleLabels } from '../../utils/labels'
import AppButton from '../common/AppButton.vue'

const props = defineProps<{
  characters: Character[]
  evidence: Evidence[]
  caseId: string
}>()

type NodeKind = 'person' | 'evidence'
interface BoardNode {
  id: string
  label: string
  kind: NodeKind
  sub: string
}
interface Pos {
  x: number
  y: number
}
interface Link {
  a: string
  b: string
}

const BOARD_H = 480

const nodes = computed<BoardNode[]>(() => [
  ...props.characters.map((c) => ({
    id: c.id,
    label: c.name,
    kind: 'person' as const,
    sub: characterRoleLabels[c.role],
  })),
  ...props.evidence.map((e) => ({
    id: e.id,
    label: e.title,
    kind: 'evidence' as const,
    sub: 'Bevis',
  })),
])

const positions = reactive<Record<string, Pos>>({})
const links = ref<Link[]>([])
const show = reactive<{ person: boolean; evidence: boolean }>({
  person: true,
  evidence: true,
})
const linkSel = ref<string | null>(null)

const board = ref<HTMLElement | null>(null)
const boardW = ref(880)

const storageKey = computed(() => `mordgator:board:${props.caseId}`)

const visibleNodes = computed(() => nodes.value.filter((n) => show[n.kind]))
const visibleLinks = computed(() =>
  links.value.filter(
    (l) =>
      visibleNodes.value.some((n) => n.id === l.a) &&
      visibleNodes.value.some((n) => n.id === l.b),
  ),
)

function center(id: string): Pos {
  return positions[id] ?? { x: boardW.value / 2, y: BOARD_H / 2 }
}

function clamp(p: Pos): Pos {
  return {
    x: Math.max(80, Math.min(boardW.value - 80, p.x)),
    y: Math.max(38, Math.min(BOARD_H - 38, p.y)),
  }
}

// Placera noder som ännu saknar position i en lös layout (personer överst).
function layoutMissing() {
  const W = boardW.value
  const pad = 100
  const persons = nodes.value.filter((n) => n.kind === 'person')
  const evid = nodes.value.filter((n) => n.kind === 'evidence')

  persons.forEach((n, i) => {
    if (positions[n.id]) return
    const t = persons.length > 1 ? i / (persons.length - 1) : 0.5
    positions[n.id] = clamp({ x: pad + (W - 2 * pad) * t, y: 95 })
  })
  evid.forEach((n, i) => {
    if (positions[n.id]) return
    const perRow = 3
    const col = i % perRow
    const row = Math.floor(i / perRow)
    const t = perRow > 1 ? col / (perRow - 1) : 0.5
    positions[n.id] = clamp({ x: pad + (W - 2 * pad) * t, y: 250 + row * 120 })
  })
}

function save() {
  try {
    localStorage.setItem(
      storageKey.value,
      JSON.stringify({ positions, links: links.value }),
    )
  } catch {
    // localStorage kan saknas (privat läge) — tavlan funkar ändå för sessionen.
  }
}

function load() {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (!raw) return
    const data = JSON.parse(raw) as { positions?: Record<string, Pos>; links?: Link[] }
    if (data.positions) {
      for (const [id, p] of Object.entries(data.positions)) positions[id] = p
    }
    if (Array.isArray(data.links)) links.value = data.links
  } catch {
    // Ogiltig sparning ignoreras.
  }
}

// ---- Dra & knyt ----
let dragId: string | null = null
let dragMoved = false
let offset: Pos = { x: 0, y: 0 }

function boardRect(): DOMRect {
  return (
    board.value?.getBoundingClientRect() ??
    new DOMRect(0, 0, boardW.value, BOARD_H)
  )
}

function onPointerDown(e: PointerEvent, id: string) {
  dragId = id
  dragMoved = false
  const rect = boardRect()
  const pos = center(id)
  offset = { x: e.clientX - (rect.left + pos.x), y: e.clientY - (rect.top + pos.y) }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragId) return
  const rect = boardRect()
  const next = clamp({
    x: e.clientX - rect.left - offset.x,
    y: e.clientY - rect.top - offset.y,
  })
  const prev = center(dragId)
  if (Math.abs(next.x - prev.x) > 4 || Math.abs(next.y - prev.y) > 4)
    dragMoved = true
  positions[dragId] = next
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (!dragId) return
  if (dragMoved) save()
  else handleClick(dragId)
  dragId = null
}

// Klick (utan att dra) = knyt-läge: första noden väljs, andra knyter snöret.
function handleClick(id: string) {
  if (linkSel.value === null) {
    linkSel.value = id
  } else if (linkSel.value === id) {
    linkSel.value = null
  } else {
    const a = linkSel.value
    const exists = links.value.some(
      (l) => (l.a === a && l.b === id) || (l.a === id && l.b === a),
    )
    if (!exists) links.value.push({ a, b: id })
    linkSel.value = null
    save()
  }
}

function removeLink(index: number) {
  links.value.splice(index, 1)
  save()
}

function reset() {
  for (const k of Object.keys(positions)) delete positions[k]
  links.value = []
  linkSel.value = null
  layoutMissing()
  save()
}

function onResize() {
  if (board.value) boardW.value = board.value.clientWidth
}

onMounted(() => {
  if (board.value) boardW.value = board.value.clientWidth
  load()
  layoutMissing()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <div class="border border-line bg-paper-2">
    <!-- Verktygsrad -->
    <div class="flex flex-wrap items-center gap-2 border-b border-line p-3">
      <button
        type="button"
        class="border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
        :class="
          show.person
            ? 'border-oxblood bg-oxblood text-ink'
            : 'border-line-strong text-ink-faint hover:text-ink'
        "
        @click="show.person = !show.person"
      >
        Personer
      </button>
      <button
        type="button"
        class="border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider uppercase transition-colors"
        :class="
          show.evidence
            ? 'border-oxblood bg-oxblood text-ink'
            : 'border-line-strong text-ink-faint hover:text-ink'
        "
        @click="show.evidence = !show.evidence"
      >
        Bevis
      </button>
      <span class="ml-auto hidden text-xs text-ink-dim sm:block">
        Dra för att flytta · klicka två kort för att knyta ett snöre · klicka snöret för att ta bort
      </span>
      <AppButton variant="ghost" @click="reset">Rensa tavlan</AppButton>
    </div>

    <!-- Tavla -->
    <div
      ref="board"
      class="relative w-full touch-none overflow-hidden select-none"
      :style="{
        height: BOARD_H + 'px',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(184,162,120,0.04) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(184,162,120,0.04) 32px)',
      }"
    >
      <svg
        :width="boardW"
        :height="BOARD_H"
        class="pointer-events-none absolute inset-0"
      >
        <g v-for="(l, i) in visibleLinks" :key="l.a + l.b">
          <line
            :x1="center(l.a).x"
            :y1="center(l.a).y"
            :x2="center(l.b).x"
            :y2="center(l.b).y"
            stroke="#b23a30"
            stroke-width="1.5"
            opacity="0.75"
          />
          <line
            :x1="center(l.a).x"
            :y1="center(l.a).y"
            :x2="center(l.b).x"
            :y2="center(l.b).y"
            stroke="transparent"
            stroke-width="14"
            class="pointer-events-auto cursor-pointer"
            @click="removeLink(i)"
          />
        </g>
      </svg>

      <div
        v-for="n in visibleNodes"
        :key="n.id"
        class="absolute w-36 cursor-grab border bg-paper-3 px-3 py-2 shadow-[0_10px_22px_-12px_rgba(0,0,0,0.9)] active:cursor-grabbing"
        :class="
          linkSel === n.id ? 'border-brass' : 'border-line-strong'
        "
        :style="{
          left: center(n.id).x + 'px',
          top: center(n.id).y + 'px',
          transform: 'translate(-50%, -50%)',
        }"
        @pointerdown="onPointerDown($event, n.id)"
      >
        <span
          class="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-paper bg-brass"
        />
        <span
          class="font-mono text-[0.6rem] tracking-wider uppercase"
          :class="n.kind === 'evidence' ? 'text-ink-dim' : 'text-ink-dim'"
          >{{ n.sub }}</span
        >
        <span
          class="mt-0.5 block leading-tight"
          :class="
            n.kind === 'person'
              ? 'font-serif text-[0.95rem] text-ink'
              : 'text-xs text-ink-soft'
          "
          >{{ n.label }}</span
        >
      </div>

      <p
        v-if="!visibleNodes.length"
        class="absolute inset-0 flex items-center justify-center text-sm text-ink-dim"
      >
        Inget att visa — slå på Personer eller Bevis.
      </p>
    </div>
  </div>
</template>
