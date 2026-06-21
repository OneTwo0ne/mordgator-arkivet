<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import type { MaterialItem, MaterialType } from '../../types/caseTypes'
import TextMaterialViewer from './TextMaterialViewer.vue'
import TestimonyViewer from './TestimonyViewer.vue'
import ImageViewer from './ImageViewer.vue'
import AudioPlayer from './AudioPlayer.vue'
import DocumentViewer from './DocumentViewer.vue'

const props = defineProps<{ item: MaterialItem }>()

// Väljer rätt renderare baserat på materialtyp. Se CLAUDE.md.
const rendererByType: Record<MaterialType, Component> = {
  document: TextMaterialViewer,
  'police-report': TextMaterialViewer,
  letter: TextMaterialViewer,
  note: TextMaterialViewer,
  testimony: TestimonyViewer,
  photo: ImageViewer,
  image: ImageViewer,
  video: ImageViewer,
  audio: AudioPlayer,
  forensic: DocumentViewer,
  financial: DocumentViewer,
}

const component = computed(() => rendererByType[props.item.type])
</script>

<template>
  <component :is="component" :item="item" />
</template>
