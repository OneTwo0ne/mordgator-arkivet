<script setup lang="ts">
import type { MaterialItem } from '../../types/caseTypes'

defineProps<{ item: MaterialItem }>()
</script>

<template>
  <div class="doc-text text-[0.95rem] text-ink">{{ item.content }}</div>
</template>
