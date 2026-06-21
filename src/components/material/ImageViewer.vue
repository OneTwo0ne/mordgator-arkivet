<script setup lang="ts">
import { ref } from 'vue'
import type { MaterialItem } from '../../types/caseTypes'

const props = defineProps<{ item: MaterialItem }>()

// Media serveras från public/. assetPath saknar inledande slash, t.ex.
// "cases/case-demo/images/foo.jpg". Bildfilerna kan saknas under utveckling —
// då visas en platshållare med bildtexten i stället.
const src = props.item.assetPath
  ? import.meta.env.BASE_URL + props.item.assetPath
  : null
const failed = ref(!src)
</script>

<template>
  <figure class="m-0">
    <div
      class="flex items-center justify-center border border-line bg-paper-2"
      :class="{ 'aspect-[4/3]': failed }"
    >
      <img
        v-if="src && !failed"
        :src="src"
        :alt="item.title"
        class="max-h-[28rem] w-full object-contain"
        @error="failed = true"
      />
      <div
        v-else
        class="flex flex-col items-center gap-2 px-6 py-10 text-center"
      >
        <span
          class="text-[0.7rem] font-medium tracking-[0.2em] text-ink-faint uppercase"
          >Fotografi</span
        >
        <span class="text-xs text-ink-faint"
          >Bild ej tillgänglig — platshållare</span
        >
      </div>
    </div>
    <figcaption
      v-if="item.content"
      class="mt-2 font-mono text-[0.8rem] leading-relaxed text-ink-soft"
    >
      {{ item.content }}
    </figcaption>
  </figure>
</template>
